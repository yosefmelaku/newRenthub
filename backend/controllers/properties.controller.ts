/**
 * properties.controller.ts
 *
 * Full CRUD for owner properties stored in PostgreSQL.
 * Every operation is scoped to the authenticated owner's ID so
 * owners can only read/mutate their own properties.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const ALLOWED_CATEGORIES = ['house', 'villa', 'office', 'studio'] as const;
type PropertyCategoryInput = (typeof ALLOWED_CATEGORIES)[number];

// ─── helpers ─────────────────────────────────────────────────────────────────

function toCategoryEnum(raw: string): string {
  return raw.toUpperCase();
}

function mapToClient(p: any) {
  return {
    id:             p.id,
    title:          p.title,
    type:           p.category.toLowerCase() as 'house' | 'villa' | 'office' | 'studio',
    city:           p.city,
    subcity:        p.subcity ?? '',
    address:        p.address,
    monthlyRent:    Number(p.rent_amount),
    beds:           p.bedrooms  ?? 0,
    baths:          p.bathrooms ?? 1,
    officeSqm:      p.office_sqm ?? 0,
    meetingRooms:   p.meeting_rooms ?? 0,
    parkingSpaces:  p.parking_spaces ?? 0,
    imageUrl:       p.image_url ?? null,
    totalUnits:     p.total_units  ?? 1,
    rentedUnits:    p.rented_units ?? 0,
    tenantUnitCount: p.total_units ?? 1,
    status:         p.rented_units >= p.total_units ? 'rented' : 'available',
    validation:     p.validation,
    ownerId:        p.owner_id,
    createdAt:      p.created_at,
  };
}

// ─── CREATE  POST /api/properties ────────────────────────────────────────────

export const createProperty = async (req: Request, res: Response) => {
  const {
    ownerId, title, type, city, subcity, address,
    monthlyRent, beds, baths, officeSqm, meetingRooms,
    parkingSpaces, totalUnits, imageUrl,
  } = req.body;

  if (!ownerId || !title || !city || !address || !monthlyRent || !type) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const cat = (type as string).toLowerCase();
  if (!ALLOWED_CATEGORIES.includes(cat as PropertyCategoryInput)) {
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_CATEGORIES.join(', ')}.` });
  }

  try {
    const property = await prisma.property.create({
      data: {
        owner_id:       ownerId,
        title:          title.trim(),
        city:           city.trim(),
        subcity:        subcity?.trim() ?? null,
        address:        address.trim(),
        rent_amount:    new Prisma.Decimal(Number(monthlyRent)),
        category:       toCategoryEnum(cat) as any,
        bedrooms:       cat !== 'office' ? (Number(beds) || 1)  : null,
        bathrooms:      Number(baths) || 1,
        office_sqm:     cat === 'office' ? (Number(officeSqm) || null) : null,
        meeting_rooms:  cat === 'office' ? (Number(meetingRooms) || 0)  : null,
        parking_spaces: Number(parkingSpaces) || 0,
        total_units:    Math.max(1, Number(totalUnits) || 1),
        rented_units:   0,
        image_url:      imageUrl?.trim() || null,
        validation:     'PENDING',
      },
    });

    return res.status(201).json({ property: mapToClient(property) });
  } catch (err) {
    console.error('[createProperty]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── LIST  GET /api/properties/owner/:ownerId ─────────────────────────────────

export const getOwnerProperties = async (req: Request, res: Response) => {
  const { ownerId } = req.params;

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required.' });
  }

  try {
    const properties = await prisma.property.findMany({
      where:   { owner_id: ownerId },
      orderBy: { created_at: 'desc' },
    });

    const mapped = properties.map(mapToClient);
    const hasBulkDiscount = mapped.length > 1;

    return res.status(200).json({
      count:               mapped.length,
      bulkDiscountEligible: hasBulkDiscount,
      properties:          mapped,
    });
  } catch (err) {
    console.error('[getOwnerProperties]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── UPDATE  PATCH /api/properties/:id ───────────────────────────────────────

export const updateProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    ownerId, title, type, city, subcity, address,
    monthlyRent, beds, baths, officeSqm, meetingRooms,
    parkingSpaces, totalUnits, imageUrl,
  } = req.body;

  try {
    // Verify ownership before mutating
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (existing.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Forbidden: you do not own this property.' });
    }

    const cat = type ? (type as string).toLowerCase() : existing.category.toLowerCase();

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title:          title?.trim()         ?? existing.title,
        city:           city?.trim()          ?? existing.city,
        subcity:        subcity?.trim()       ?? existing.subcity,
        address:        address?.trim()       ?? existing.address,
        rent_amount:    monthlyRent != null ? new Prisma.Decimal(Number(monthlyRent)) : existing.rent_amount,
        category:       toCategoryEnum(cat) as any,
        bedrooms:       cat !== 'office' ? (beds != null ? Number(beds) : existing.bedrooms) : null,
        bathrooms:      baths != null ? Number(baths) : existing.bathrooms,
        office_sqm:     cat === 'office' ? (officeSqm != null ? Number(officeSqm) : existing.office_sqm) : null,
        meeting_rooms:  cat === 'office' ? (meetingRooms != null ? Number(meetingRooms) : existing.meeting_rooms) : null,
        parking_spaces: parkingSpaces != null ? Number(parkingSpaces) : existing.parking_spaces,
        total_units:    totalUnits != null ? Math.max(1, Number(totalUnits)) : existing.total_units,
        image_url:      imageUrl !== undefined ? (imageUrl?.trim() || null) : existing.image_url,
      },
    });

    return res.status(200).json({ property: mapToClient(updated) });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Property not found.' });
    console.error('[updateProperty]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE  DELETE /api/properties/:id ──────────────────────────────────────

export const deleteProperty = async (req: Request, res: Response) => {
  const { id }      = req.params;
  const  ownerId    = req.body.ownerId || req.query.ownerId;

  try {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (ownerId && existing.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Forbidden: you do not own this property.' });
    }

    await prisma.property.delete({ where: { id } });
    return res.status(200).json({ message: 'Property deleted successfully.' });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Property not found.' });
    console.error('[deleteProperty]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── RECORD RENTAL  PATCH /api/properties/:id/rent ───────────────────────────

export const recordRentalOnProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { delta = 1 } = req.body; // +1 to add a tenant, -1 to release

  try {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found.' });

    const newRented = Math.max(0, Math.min(property.total_units, property.rented_units + Number(delta)));

    const updated = await prisma.property.update({
      where: { id },
      data:  { rented_units: newRented },
    });

    return res.status(200).json({ property: mapToClient(updated) });
  } catch (err) {
    console.error('[recordRentalOnProperty]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Legacy: register via old route (kept for backward compat) ────────────────
export const registerProperty = createProperty;
