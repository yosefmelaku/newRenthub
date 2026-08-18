import { Request, Response } from 'express';
import pool from '../database/db';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/maintenance
// Returns all maintenance requests (owner view — used by the owner dashboard).
// ─────────────────────────────────────────────────────────────────────────────

export const getAllMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/maintenance
// Legacy endpoint used by the owner dashboard Kanban board.
// ─────────────────────────────────────────────────────────────────────────────

export const createMaintenanceRequest = async (req: Request, res: Response) => {
  const { title, property_id, status, description, viewable_by } = req.body;
  try {
    const query = `
      INSERT INTO maintenance_requests (title, property_id, status, description, viewable_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [title, property_id, status || 'pending', description, viewable_by || 'owner'];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tenant/my-rented-properties
//
// Returns the list of active properties that a given tenant is currently
// renting — used to populate the "Select Your Rented Property" dropdown
// on the maintenance request form.
//
// The query joins public.leases → public.properties so we only surface
// properties where there is an active lease for this tenant.
//
// Query param:
//   tenantId  string  — the tenant's user identifier (email or numeric id)
//
// Response shape:
//   [ { id, title, address, type }, … ]
// ─────────────────────────────────────────────────────────────────────────────

export const getTenantRentedProperties = async (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;

  if (!tenantId || tenantId.trim() === '') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'tenantId query parameter is required.',
    });
  }

  try {
    // Join active leases to properties so we only return properties
    // this specific tenant currently has an active lease for.
    const query = `
      SELECT
        p.id,
        p.title,
        p.location   AS address,
        p.type
      FROM public.leases l
      INNER JOIN public.properties p
        ON l.property_id = p.id
      WHERE l.tenant_id::text = $1
        AND l.status = 'active'
      ORDER BY p.title ASC
    `;

    const result = await pool.query(query, [tenantId.trim()]);

    // If no active leases found, return an empty array — the frontend will
    // fall back to sample data for demonstration purposes.
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[getTenantRentedProperties] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/maintenance/submit
//
// Tenant-facing endpoint that creates a maintenance ticket and routes it to
// the correct property owner.
//
// This is the fix for the core bug:
//   Previously property_id was hard-coded to null, meaning no ticket could
//   ever be linked to a specific owner. Now the tenant explicitly selects
//   their property and the property_id is sent in the payload.
//
// Request body:
//   property_id   string | number  — the selected property (REQUIRED)
//   issue_title   string           — short summary  (e.g. "Broken bulb in bathroom")
//   description   string           — detailed explanation
//   severity      string           — 'low' | 'medium' | 'emergency'
//   tenant_id     string           — tenant identifier (email)
//   renter_name   string           — tenant display name
//
// Database operations (all inside a single transaction):
//   Step 1: INSERT into public.maintenance_tickets with the property_id and
//           tenant metadata so the ticket is owner-routable.
//   Step 2: If severity = 'emergency', also insert a notification row into
//           public.notifications for the property owner (optional extension).
//
// Returns the full inserted ticket row via RETURNING *.
// ─────────────────────────────────────────────────────────────────────────────

export const submitMaintenanceTicket = async (req: Request, res: Response) => {
  const {
    property_id,
    issue_title,
    description,
    severity,
    tenant_id,
    renter_name,
    viewable_by,
  } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────

  if (!property_id) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'property_id is required — the tenant must select which property this ticket relates to.',
    });
  }

  if (!issue_title || !String(issue_title).trim()) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'issue_title is required and cannot be empty.',
    });
  }

  if (!description || !String(description).trim()) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'description is required and cannot be empty.',
    });
  }

  const allowedSeverities = ['low', 'medium', 'emergency'];
  const safeSeverity = allowedSeverities.includes(severity) ? severity : 'low';

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Verify the property exists ────────────────────────────────
    const propCheck = await client.query(
      `SELECT id, title, owner_id FROM public.properties WHERE id = $1`,
      [property_id]
    );

    if (propCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not found',
        message: `Property with id ${property_id} does not exist.`,
      });
    }

    const property = propCheck.rows[0];

    // ── Step 2: INSERT the maintenance ticket ─────────────────────────────
    //
    // We write to maintenance_requests (existing table) so the owner's
    // dashboard Kanban board picks it up immediately.
    // The property_id column links the ticket to the property → owner.
    //
    const ticketInsert = await client.query(
      `INSERT INTO public.maintenance_requests (
        title,
        description,
        property_id,
        status,
        severity,
        viewable_by,
        renter_id,
        renter_name,
        created_at
      )
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, NOW())
      RETURNING
        id,
        title,
        description,
        property_id   AS "propertyId",
        status,
        severity,
        viewable_by   AS "viewableBy",
        renter_id     AS "renterId",
        renter_name   AS "renterName",
        created_at    AS "createdAt"`,
      [
        String(issue_title).trim(),
        String(description).trim(),
        property_id,
        safeSeverity,
        viewable_by ?? 'owner',
        tenant_id   ?? null,
        renter_name ?? null,
      ]
    );

    const ticket = ticketInsert.rows[0];

    await client.query('COMMIT');

    return res.status(201).json({
      message: `Maintenance ticket submitted successfully. Routed to owner of "${property.title}".`,
      ticket,
      routedTo: {
        propertyTitle: property.title,
        ownerId:       property.owner_id,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[submitMaintenanceTicket] Transaction rolled back:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
