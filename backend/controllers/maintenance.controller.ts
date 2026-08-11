import { Request, Response } from 'express';
import pool from '../database/db';

export const getAllMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

/**
 * POST /api/maintenance/submit
 *
 * Tenant-facing endpoint for submitting a new maintenance ticket.
 *
 * Request body:
 *   issue_title   string  — short summary of the issue (e.g. "Bathroom")
 *   description   string  — detailed explanation  (e.g. "Broken the bulb")
 *   tenant_id     string  — (optional) identifier of the submitting tenant
 *
 * Behaviour:
 *   1. Validates that both issue_title and description are present.
 *   2. Runs a parameterised INSERT into public.maintenance_tickets
 *      with status hard-coded to 'New' and created_at set to NOW().
 *   3. Returns the full inserted row (RETURNING *) so the frontend
 *      can immediately append it to the "My Tickets" list without
 *      a page refresh.
 */
export const submitMaintenanceTicket = async (req: Request, res: Response) => {
  const { issue_title, description, tenant_id } = req.body;

  // ── Input validation ──────────────────────────────────────────────
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

  try {
    // ── Parameterised INSERT — safe against SQL injection ────────────
    const query = `
      INSERT INTO public.maintenance_tickets
        (issue_title, description, status, tenant_id, created_at)
      VALUES
        ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const values = [
      String(issue_title).trim(),
      String(description).trim(),
      'New',                              // status is always 'New' on creation
      tenant_id ?? null,                  // nullable — allows anonymous tickets
    ];

    const result = await pool.query(query, values);
    const ticket = result.rows[0];

    // ── Return the full ticket so the frontend can render it instantly ─
    return res.status(201).json({
      message: 'Maintenance ticket submitted successfully.',
      ticket,
    });
  } catch (error) {
    console.error('[submitMaintenanceTicket] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
