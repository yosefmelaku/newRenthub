import { Request, Response } from 'express';
import pool from '../database/db';

/**
 * GET /api/admin/approvals
 *
 * Returns all properties currently sitting in 'pending_approval' status.
 * Only accessible by a superadmin.
 *
 * Expected query param (or header in production JWT setup):
 *   requesterRole  string  — must be 'superadmin'
 *
 * Response: array of pending property rows joined with the owner's name/email
 * from public.users so the admin has full context for each approval.
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  // --- Authorization check ---
  // In production this comes from a verified JWT claim.
  // We accept it via query param so the endpoint is testable without auth middleware.
  const requesterRole = req.query.requesterRole ?? req.body.requesterRole;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only superadmin users can access the approvals queue.',
    });
  }

  try {
    const query = `
      SELECT
        p.id                AS "propertyId",
        p.title,
        p.description,
        p.location,
        p.price,
        p.type,
        p.beds,
        p.baths,
        p.image,
        p.amenities,
        p.status,
        p.created_at        AS "submittedAt",
        u.id                AS "ownerId",
        u.name              AS "ownerName",
        u.email             AS "ownerEmail"
      FROM public.properties p
      LEFT JOIN public.users u
        ON p.owner_id::text = u.id::text
      WHERE p.status = 'pending_approval'
      ORDER BY p.created_at ASC
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      count: result.rowCount,
      pendingProperties: result.rows,
    });
  } catch (error) {
    console.error('[getPendingApprovals] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/rentals-matrix
 *
 * Runs a three-table JOIN across public.users, public.properties, and
 * public.leases to produce a unified list showing who is currently renting
 * whose property, along with all relevant lease and financial details.
 *
 * Only returns leases with status = 'active' so the output reflects the
 * live occupancy state of the portfolio.
 *
 * Only accessible by a superadmin.
 *
 * Expected query param:
 *   requesterRole  string  — must be 'superadmin'
 */
export const getRentalsMatrix = async (req: Request, res: Response) => {
  // --- Authorization check ---
  const requesterRole = req.query.requesterRole ?? req.body.requesterRole;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only superadmin users can access the rentals matrix.',
    });
  }

  try {
    const query = `
      SELECT
        -- Lease info
        l.id                  AS "leaseId",
        l.start_date          AS "leaseStartDate",
        l.end_date            AS "leaseEndDate",
        l.monthly_rent        AS "monthlyRent",
        l.status              AS "leaseStatus",
        l.created_at          AS "leaseCreatedAt",

        -- Tenant (renter) info — joined from public.users via tenant_id
        tenant.id             AS "tenantId",
        tenant.name           AS "tenantName",
        tenant.email          AS "tenantEmail",

        -- Property info
        p.id                  AS "propertyId",
        p.title               AS "propertyTitle",
        p.location            AS "propertyLocation",
        p.type                AS "propertyType",
        p.beds                AS "propertyBeds",
        p.baths               AS "propertyBaths",
        p.price               AS "propertyListedPrice",
        p.status              AS "propertyStatus",

        -- Owner info — joined from public.users via properties.owner_id
        owner.id              AS "ownerId",
        owner.name            AS "ownerName",
        owner.email           AS "ownerEmail"

      FROM public.leases l

      -- Join property being leased
      INNER JOIN public.properties p
        ON l.property_id = p.id

      -- Join the tenant user record
      LEFT JOIN public.users tenant
        ON l.tenant_id::text = tenant.id::text

      -- Join the owner user record via the property's owner_id
      LEFT JOIN public.users owner
        ON p.owner_id::text = owner.id::text

      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      count: result.rowCount,
      rentalsMatrix: result.rows,
    });
  } catch (error) {
    console.error('[getRentalsMatrix] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
