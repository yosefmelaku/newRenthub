/**
 * listings.controller.ts
 *
 * Handles marketplace listing creation and retrieval.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *   const result = await pool.query('SELECT * FROM listings ORDER BY id ASC');
 *   const rows = result.rows;   // manual array, no type information
 *
 * New approach (Prisma Client):
 *   import prisma from '../lib/prisma';
 *   const listings = await prisma.listing.findMany({ orderBy: { created_at: 'asc' } });
 *   // fully-typed Listing[] — no result.rows, no camelCase mapping needed
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/listings
 *
 * Returns all marketplace listings ordered by creation date.
 *
 * Old SQL equivalent:
 *   SELECT * FROM listings ORDER BY id ASC
 *
 * Replaced by:
 *   prisma.listing.findMany({ orderBy: { created_at: 'asc' } })
 */
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { created_at: 'asc' },
    });

    // Map to camelCase response shape for the frontend
    const mapped = listings.map((row) => ({
      ...row,
      ownerId:      row.owner_id,
      reviewsCount: row.reviews_count,
      propertyType: row.property_type,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/listings
 *
 * Creates a new marketplace listing.
 *
 * Old SQL equivalent:
 *   INSERT INTO listings (title, description, location, price, type, beds, baths,
 *     image, amenities, rating, reviews_count, owner_id, featured)
 *   VALUES ($1, $2, ..., $13)
 *   RETURNING *
 *
 * Replaced by:
 *   prisma.listing.create({ data: { ... } })
 */
export const createListing = async (req: Request, res: Response) => {
  const {
    title,
    description,
    location,
    price,
    type,
    beds,
    baths,
    image,
    amenities,
    rating,
    reviewsCount,
    ownerId,
    featured,
  } = req.body;

  try {
    // prisma.listing.create() replaces the INSERT ... RETURNING * pattern.
    const listing = await prisma.listing.create({
      data: {
        owner_id:      ownerId     ?? null,
        title,
        description:   description ?? null,
        location:      location    ?? null,
        price:         price != null ? new Prisma.Decimal(Number(price)) : null,
        property_type: type        ?? null,
        beds:          beds  != null ? Number(beds)  : null,
        baths:         baths != null ? Number(baths) : null,
        image:         image       ?? null,
        amenities:     Array.isArray(amenities) ? amenities : [],
        rating:        rating != null ? new Prisma.Decimal(Number(rating)) : null,
        reviews_count: reviewsCount != null ? Number(reviewsCount) : 0,
        featured:      featured     ?? false,
      },
    });

    res.status(201).json({
      ...listing,
      ownerId:      listing.owner_id,
      reviewsCount: listing.reviews_count,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
