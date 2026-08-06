import { Request, Response } from 'express';
import pool from '../database/db';

export const getAllListings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM listings ORDER BY id ASC');
    // Map snake_case to camelCase
    const mapped = result.rows.map(row => ({
      ...row,
      ownerId: row.owner_id,
      reviewsCount: row.reviews_count,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createListing = async (req: Request, res: Response) => {
  const { title, description, location, price, type, beds, baths, image, amenities, rating, reviewsCount, ownerId, featured } = req.body;
  try {
    const query = `
      INSERT INTO listings (title, description, location, price, type, beds, baths, image, amenities, rating, reviews_count, owner_id, featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [title, description, location, price, type, beds, baths, image, amenities, rating || 5.0, reviewsCount || 0, ownerId || 'owner_default', featured || false];
    const result = await pool.query(query, values);
    
    const row = result.rows[0];
    res.status(201).json({
      ...row,
      ownerId: row.owner_id,
      reviewsCount: row.reviews_count,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
