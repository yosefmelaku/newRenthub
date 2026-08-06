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
