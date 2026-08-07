import { Request, Response } from 'express';
import pool from '../database/db';

// Allowed property types — used to whitelist input and prevent garbage data
const ALLOWED_TYPES = ['house', 'apartment', 'villa', 'studio', 'office', 'realestate'] as const;
type PropertyType = (typeof ALLOWED_TYPES)[number];

/**
 * POST /api/properties/register
 *
 * Registers a new property submitted by an owner.
 * Sets status = 'pending_approval' by default.
 * Requires the requesting user to have role = 'owner'.
 *
 * Expected body:
 *   ownerId      string  — ID of the owner (from session / auth header in production)
 *   ownerRole    string  — Role of the requester; must be 'owner'
 *   title        string  — Property display title
 *   description  string  — Full description
 *   location     string  — Human-readable address / city
 *   price        number  — Monthly rent in USD
 *   type         string  — One of: house | apartment | villa | studio | office | realestate
 *   beds         number  — Bedroom count
 *   baths        number  — Bathroom count
 *   image        string  — URL or path to cover image
 *   amenities    string[]— List of amenities
 */
export const registerProperty = async (req: Request, res: Response) => {
  const {
    ownerId,
    ownerRole,
    title,
    description,
    location,
    price,
    type,
    beds,
    baths,
    image,
    amenities,
  } = req.body;

  // --- Authorization check ---
  // In production this would come from a verified JWT. We accept it from the
  // body here so the endpoint stays self-contained and testable without auth
  // middleware being in place yet.
  if (ownerRole !== 'owner') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only users with the owner role can register properties.',
    });
  }

  // --- Input validation ---
  if (!ownerId || typeof ownerId !== 'string' || ownerId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'ownerId is required.' });
  }
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'title is required.' });
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'location is required.' });
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'price must be a positive number.' });
  }
  if (!ALLOWED_TYPES.includes(type as PropertyType)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `type must be one of: ${ALLOWED_TYPES.join(', ')}.`,
    });
  }

  try {
    const query = `
      INSERT INTO public.properties (
        owner_id,
        title,
        description,
        location,
        price,
        type,
        beds,
        baths,
        image,
        amenities,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_approval')
      RETURNING
        id,
        owner_id    AS "ownerId",
        title,
        description,
        location,
        price,
        type,
        beds,
        baths,
        image,
        amenities,
        status,
        created_at  AS "createdAt"
    `;

    const values = [
      ownerId.trim(),
      title.trim(),
      description?.trim() ?? '',
      location.trim(),
      Number(price),
      type,
      beds != null ? Number(beds) : null,
      baths != null ? Number(baths) : null,
      image?.trim() ?? null,
      Array.isArray(amenities) ? amenities : [],
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      message: 'Property submitted successfully and is pending admin approval.',
      property: result.rows[0],
    });
  } catch (error) {
    console.error('[registerProperty] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
