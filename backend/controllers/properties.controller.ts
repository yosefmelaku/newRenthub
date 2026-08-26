/**
 * properties.controller.ts
 *
 * Handles property registration and owner portfolio retrieval.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *
 *   // Fetch owner portfolio
 *   const result = await pool.query(
 *     'SELECT * FROM public.properties WHERE owner_id = $1',
 *     [ownerId]
 *   );
 *   const properties = result.rows;
 *   // count check and discount logic had to be wired manually in JS afterward
 *
 * New approach (Prisma Client):
 *   import prisma from '../lib/prisma';
 *
 *   const properties = await prisma.property.findMany({
 *     where: { owner_id: ownerId },
 *     orderBy: { created_at: 'desc' },
 *   });
 *   // Bulk-discount logic is applied inline — no extra DB round-trip needed.
 *
 * Benefits:
 *   • `orderBy` is declarative — no ORDER BY string appended to SQL.
 *   • Prisma.Decimal handles monetary values safely (no float drift).
 *   • The `include` / `select` API replaces JOIN strings entirely.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const ALLOWED_CATEGORIES = ['house', 'villa', 'office', 'studio'] as const;
type PropertyCategoryInput = (typeof ALLOWED_CATEGORIES)[number];

/**
 * POST /api/properties/register
 *
 * Registers a new property submitted by an owner.
 * Sets validation = 'PENDING' by default, pending superadmin approval.
 *
 * Old SQL equivalent:
 *   INSERT INTO public.properties
 *     (owner_id, title, description, address, city, rent_amount,
 *      category, bedrooms, bathrooms, image_url, validation)
 *   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
 *   RETURNING *
 *
 * Replaced by:
 *   prisma.property.create({ data: { ... } })
 *
 * Prisma handles the RETURNING clause automatically — the created record
 * is returned as a fully-typed object, no manual `result.rows[0]` needed.
 */
export const registerProperty = async (req: Request, res: Response) => {
  const {
    ownerId,
    ownerRole,
    title,
    description,
    address,
    city,
    rent_amount,
    category,
    bedrooms,
    bathrooms,
    image_url,
  } = req.body;

  if (ownerRole !== 'owner' && ownerRole !== 'OWNER') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only users with the owner role can register properties.',
    });
  }

  if (!ownerId || typeof ownerId !== 'string' || ownerId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'ownerId is required.' });
  }
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'title is required.' });
  }
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'address is required.' });
  }
  if (!city || typeof city !== 'string' || city.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'city is required.' });
  }
  if (rent_amount === undefined || isNaN(Number(rent_amount)) || Number(rent_amount) <= 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'rent_amount must be a positive number.' });
  }
  if (!ALLOWED_CATEGORIES.includes(category as PropertyCategoryInput)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
    });
  }

  try {
    // prisma.property.create() replaces the INSERT ... RETURNING * pattern.
    // Prisma.Decimal ensures rent_amount is stored with full decimal precision,
    // avoiding the floating-point rounding issues that come with JS numbers.
    const property = await prisma.property.create({
      data: {
        owner_id:    ownerId.trim(),
        title:       title.trim(),
        description: description?.trim() ?? '',
        address:     address.trim(),
        city:        city.trim(),
        rent_amount: new Prisma.Decimal(Number(rent_amount)),
        category:    (category as string).toUpperCase() as any,
        bedrooms:    bedrooms  != null ? Number(bedrooms)  : null,
        bathrooms:   bathrooms != null ? Number(bathrooms) : null,
        image_url:   image_url?.trim() ?? null,
        validation:  'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Property submitted successfully and is pending admin approval.',
      property,
    });
  } catch (error) {
    console.error('[registerProperty] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/properties/owner/:ownerId
 *
 * Returns the full property portfolio for a given owner.
 *
 * Old SQL equivalent:
 *   SELECT * FROM public.properties
 *   WHERE owner_id = $1
 *   ORDER BY created_at DESC
 *
 * Replaced by:
 *   prisma.property.findMany({ where: { owner_id: ownerId }, orderBy: { created_at: 'desc' } })
 *
 * ─── BULK DISCOUNT LOGIC ────────────────────────────────────────────────────
 * After fetching all properties, we check if count > 1.
 * If true, every property in the response is tagged with:
 *   - bulkDiscountEligible: true
 *   - discountTag: 'BULK_PACKAGE_ACTIVE'
 *   - discountApplied: true  (on each property object)
 *
 * This replaces what previously would have required a separate
 * SELECT COUNT(*) query or a subquery join.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const getOwnerProperties = async (req: Request, res: Response) => {
  const { ownerId } = req.params;

  if (!ownerId || ownerId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'ownerId is required.' });
  }

  try {
    // prisma.property.findMany() replaces:
    //   pool.query('SELECT * FROM public.properties WHERE owner_id = $1', [ownerId])
    // and returns a fully-typed Property[] array — no `result.rows` unwrapping.
    const properties = await prisma.property.findMany({
      where:   { owner_id: ownerId.trim() },
      orderBy: { created_at: 'desc' },
    });

    // Bulk discount: if the owner has more than 1 property listed,
    // apply the package discount tag dynamically — no extra DB query needed.
    const hasBulkDiscount = properties.length > 1;

    return res.status(200).json({
      count:               properties.length,
      bulkDiscountEligible: hasBulkDiscount,
      discountTag:         hasBulkDiscount ? 'BULK_PACKAGE_ACTIVE' : null,
      properties: properties.map((p) => ({
        ...p,
        discountApplied: hasBulkDiscount,
      })),
    });
  } catch (error) {
    console.error('[getOwnerProperties] DB error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
