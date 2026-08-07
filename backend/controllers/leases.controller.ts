import { Request, Response } from 'express';
import pool from '../database/db';

/**
 * POST /api/leases/create
 *
 * Executed when a tenant successfully books a property.
 * Runs as a single atomic database transaction:
 *   1. Validates the property exists and is currently 'live' (not already rented/draft).
 *   2. Inserts a new row into public.leases with status = 'active'.
 *   3. Updates public.properties status to 'rented'.
 *
 * Both writes succeed together or neither is committed (rollback on any error).
 *
 * Expected body:
 *   propertyId   number | string  — ID of the property being leased
 *   tenantId     string           — ID of the tenant (user)
 *   tenantName   string           — Full name of the tenant
 *   tenantEmail  string           — Email of the tenant
 *   startDate    string           — Lease start date  (YYYY-MM-DD)
 *   endDate      string           — Lease end date    (YYYY-MM-DD)
 *   monthlyRent  number           — Agreed monthly rent amount
 */
export const createLease = async (req: Request, res: Response) => {
  const {
    propertyId,
    tenantId,
    tenantName,
    tenantEmail,
    startDate,
    endDate,
    monthlyRent,
  } = req.body;

  // --- Input validation ---
  if (!propertyId || isNaN(Number(propertyId))) {
    return res.status(400).json({ error: 'Validation failed', message: 'propertyId must be a valid number.' });
  }
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'tenantId is required.' });
  }
  if (!tenantName || typeof tenantName !== 'string' || tenantName.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'tenantName is required.' });
  }
  if (!tenantEmail || typeof tenantEmail !== 'string' || !tenantEmail.includes('@')) {
    return res.status(400).json({ error: 'Validation failed', message: 'A valid tenantEmail is required.' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Validation failed', message: 'startDate and endDate are required.' });
  }
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ error: 'Validation failed', message: 'startDate must be before endDate.' });
  }
  if (monthlyRent === undefined || isNaN(Number(monthlyRent)) || Number(monthlyRent) <= 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'monthlyRent must be a positive number.' });
  }

  // Acquire a dedicated client from the pool so we can wrap both writes in one transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1 — Verify the property exists and is available to lease.
    // We use SELECT ... FOR UPDATE to lock the row for the duration of this
    // transaction, preventing a race condition where two tenants book the
    // same property simultaneously.
    const propertyCheck = await client.query(
      `SELECT id, status, title FROM public.properties WHERE id = $1 FOR UPDATE`,
      [Number(propertyId)]
    );

    if (propertyCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not found',
        message: `Property with id ${propertyId} does not exist.`,
      });
    }

    const property = propertyCheck.rows[0];

    // Only 'live' (approved) properties can be leased
    if (property.status !== 'live') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Conflict',
        message: `Property "${property.title}" is not available for lease. Current status: ${property.status}.`,
      });
    }

    // Step 2 — Insert the new lease record
    const leaseInsert = await client.query(
      `INSERT INTO public.leases (
        property_id,
        tenant_id,
        tenant_name,
        tenant_email,
        start_date,
        end_date,
        monthly_rent,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING
        id,
        property_id   AS "propertyId",
        tenant_id     AS "tenantId",
        tenant_name   AS "tenantName",
        tenant_email  AS "tenantEmail",
        start_date    AS "startDate",
        end_date      AS "endDate",
        monthly_rent  AS "monthlyRent",
        status,
        created_at    AS "createdAt"`,
      [
        Number(propertyId),
        tenantId.trim(),
        tenantName.trim(),
        tenantEmail.trim().toLowerCase(),
        startDate,
        endDate,
        Number(monthlyRent),
      ]
    );

    // Step 3 — Mark the property as rented
    await client.query(
      `UPDATE public.properties SET status = 'rented' WHERE id = $1`,
      [Number(propertyId)]
    );

    // Commit only when both writes have succeeded
    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Lease created successfully. Property has been marked as rented.',
      lease: leaseInsert.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createLease] Transaction rolled back due to error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
};
