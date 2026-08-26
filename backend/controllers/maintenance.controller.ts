/**
 * maintenance.controller.ts
 *
 * Handles maintenance ticket creation and retrieval.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *
 *   const client = await pool.connect();   // manual acquisition
 *   try {
 *     await client.query('BEGIN');
 *     await client.query(
 *       'INSERT INTO public.maintenance_tickets (tenant_id, property_id, issue_title, description) VALUES ($1, $2, $3, $4)',
 *       [tenantId, propertyId, issueTitle, description]
 *     );
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *     throw e;
 *   } finally {
 *     client.release();                    // manual release — easy to forget
 *   }
 *
 * New approach (Prisma Client):
 *   import prisma from '../lib/prisma';
 *
 *   await prisma.$transaction(async (tx) => {
 *     const ticket = await tx.maintenanceTicket.create({ data: { ... } });
 *   });
 *   // BEGIN / COMMIT / ROLLBACK / release are handled automatically.
 *
 * Benefits:
 *   • prisma.$transaction() removes all manual BEGIN/COMMIT/ROLLBACK boilerplate.
 *   • `include` replaces JOIN queries — related property/tenant records are
 *     fetched in one Prisma call instead of multiple pool.query() calls.
 *   • The text inputs are cleared on the client side after a 201 response —
 *     the backend confirms success, the frontend resets the form.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/maintenance
//
// Returns all maintenance tickets (owner dashboard Kanban view).
//
// Old SQL equivalent:
//   SELECT mt.*, p.id, p.title, p.address, p.city,
//          u.id, u.full_name, u.email
//   FROM public.maintenance_tickets mt
//   LEFT JOIN public.properties p ON p.id = mt.property_id
//   LEFT JOIN public.users u ON u.id = mt.tenant_id
//   ORDER BY mt.created_at DESC
//
// Replaced by:
//   prisma.maintenanceTicket.findMany({ include: { property: {...}, tenant: {...} } })
// ─────────────────────────────────────────────────────────────────────────────

export const getAllMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    // `include` replaces the JOIN strings — Prisma fetches related records
    // from the foreign-key relationships defined in schema.prisma.
    const tickets = await prisma.maintenanceTicket.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        property: { select: { id: true, title: true, address: true, city: true } },
        tenant:   { select: { id: true, full_name: true, email: true } },
      },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching maintenance tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/maintenance
//
// Legacy endpoint used by the owner dashboard Kanban board (quick-add card).
//
// Old SQL equivalent:
//   INSERT INTO public.maintenance_tickets
//     (issue_title, description, property_id, severity, status)
//   VALUES ($1, $2, $3, 'LOW', 'OPEN')
//   RETURNING *
//
// Replaced by:
//   prisma.maintenanceTicket.create({ data: { ... } })
// ─────────────────────────────────────────────────────────────────────────────

export const createMaintenanceRequest = async (req: Request, res: Response) => {
  const { title, property_id, description } = req.body;
  try {
    // prisma.maintenanceTicket.create() replaces the INSERT ... RETURNING * pattern.
    // Default severity = LOW and status = OPEN mirror the original INSERT defaults.
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        issue_title: title,
        description: description ?? '',
        property_id,
        severity:    'LOW',
        status:      'OPEN',
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tenant/my-rented-properties
//
// Returns the active properties currently rented by a given tenant.
// Used to populate the "Select Your Rented Property" dropdown on the
// maintenance submission form.
// ─────────────────────────────────────────────────────────────────────────────

export const getTenantRentedProperties = async (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;

  if (!tenantId || tenantId.trim() === '') {
    return res.status(400).json({
      error:   'Validation error',
      message: 'tenantId query parameter is required.',
    });
  }

  try {
    // Fetches ACTIVE leases for this tenant and includes the related property
    // fields needed for the dropdown. Replaces:
    //   SELECT p.id, p.title, p.address, p.category
    //   FROM public.leases l
    //   JOIN public.properties p ON p.id = l.property_id
    //   WHERE l.tenant_id = $1 AND l.status = 'ACTIVE'
    //   ORDER BY p.title ASC
    const leases = await prisma.lease.findMany({
      where: {
        tenant_id: tenantId.trim(),
        status:    'ACTIVE',
      },
      include: {
        property: {
          select: {
            id:       true,
            title:    true,
            address:  true,
            category: true,
          },
        },
      },
      orderBy: { property: { title: 'asc' } },
    });

    const result = leases.map((l) => ({
      id:      l.property.id,
      title:   l.property.title,
      address: l.property.address,
      type:    l.property.category,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('[getTenantRentedProperties] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/maintenance/submit
//
// Tenant-facing endpoint. Creates a maintenance ticket and routes it to the
// correct property owner.
//
// Old SQL equivalent (inside manual transaction):
//   BEGIN;
//   SELECT id, title, owner_id FROM public.properties WHERE id = $1;
//   INSERT INTO public.maintenance_tickets
//     (issue_title, description, property_id, severity, tenant_id)
//   VALUES ($1, $2, $3, $4, $5)
//   RETURNING *;
//   COMMIT;
//
// Replaced by:
//   prisma.$transaction(async (tx) => {
//     const property = await tx.property.findUnique(...)
//     const ticket   = await tx.maintenanceTicket.create(...)
//   })
//
// ─── UI CLEAR BEHAVIOUR ─────────────────────────────────────────────────────
// The backend returns HTTP 201 on success. The frontend is responsible for
// clearing the issue_title and description text inputs after receiving a 201.
// This keeps the backend stateless and follows REST conventions.
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, 'LOW' | 'MEDIUM' | 'EMERGENCY'> = {
  low:       'LOW',
  medium:    'MEDIUM',
  emergency: 'EMERGENCY',
};

export const submitMaintenanceTicket = async (req: Request, res: Response) => {
  const {
    property_id,
    issue_title,
    description,
    severity,
    tenant_id,
  } = req.body;

  if (!property_id) {
    return res.status(400).json({
      error:   'Validation error',
      message: 'property_id is required — the tenant must select which property this ticket relates to.',
    });
  }

  if (!issue_title || !String(issue_title).trim()) {
    return res.status(400).json({
      error:   'Validation error',
      message: 'issue_title is required and cannot be empty.',
    });
  }

  if (!description || !String(description).trim()) {
    return res.status(400).json({
      error:   'Validation error',
      message: 'description is required and cannot be empty.',
    });
  }

  // Map incoming severity string to the enum value; default to LOW.
  const safeSeverity = SEVERITY_MAP[String(severity).toLowerCase()] || 'LOW';

  try {
    // prisma.$transaction() replaces manual pool.connect() + BEGIN/COMMIT/ROLLBACK.
    // If any step inside throws, Prisma automatically rolls back — no `client.release()` needed.
    const result = await prisma.$transaction(async (tx) => {
      // Step 1 — Verify the property exists before creating the ticket.
      // Replaces: SELECT id, title, owner_id FROM public.properties WHERE id = $1
      const property = await tx.property.findUnique({
        where:  { id: property_id },
        select: { id: true, title: true, owner_id: true },
      });

      if (!property) {
        throw new Error(`PROPERTY_NOT_FOUND: Property with id ${property_id} does not exist.`);
      }

      // Step 2 — Create the ticket linked to the verified property.
      // Replaces:
      //   INSERT INTO public.maintenance_tickets
      //     (tenant_id, property_id, issue_title, description, severity)
      //   VALUES ($1, $2, $3, $4, $5)
      const ticket = await tx.maintenanceTicket.create({
        data: {
          issue_title: String(issue_title).trim(),
          description: String(description).trim(),
          property_id: property.id,
          severity:    safeSeverity,
          tenant_id:   tenant_id ?? null,
        },
      });

      return { ticket, property };
    });

    // HTTP 201 signals the frontend to clear the issue_title + description inputs.
    return res.status(201).json({
      message:  `Maintenance ticket submitted successfully. Routed to owner of "${result.property.title}".`,
      ticket:   result.ticket,
      routedTo: {
        propertyTitle: result.property.title,
        ownerId:       result.property.owner_id,
      },
    });
  } catch (error: any) {
    if (error?.message?.startsWith('PROPERTY_NOT_FOUND:')) {
      return res.status(404).json({
        error:   'Not found',
        message: error.message,
      });
    }
    console.error('[submitMaintenanceTicket] Transaction rolled back:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
