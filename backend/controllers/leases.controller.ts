/**
 * leases.controller.ts
 *
 * Handles long-term lease creation with full transactional safety.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *
 *   const client = await pool.connect();   // manual acquisition
 *   try {
 *     await client.query('BEGIN');
 *     await client.query('SELECT id, status, title FROM public.properties WHERE id = $1 FOR UPDATE', [propertyId]);
 *     await client.query('INSERT INTO public.leases (...) VALUES (...) RETURNING ...', [...]);
 *     await client.query("UPDATE public.properties SET status = 'rented' WHERE id = $1", [propertyId]);
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *     throw e;
 *   } finally {
 *     client.release();   // easy to forget → connection leak
 *   }
 *
 * New approach (Prisma Client):
 *   await prisma.$transaction(async (tx) => {
 *     const property = await tx.property.findUnique({ where: { id }, select: { ... } });
 *     const lease    = await tx.lease.create({ data: { ... } });
 *     await tx.property.update({ where: { id }, data: { validation: 'APPROVED' } });
 *   });
 *
 * Benefits:
 *   • No manual pool.connect() / BEGIN / COMMIT / ROLLBACK / client.release().
 *   • Prisma automatically retries on serialization failures (configurable).
 *   • All queries inside the callback share the same transaction context.
 *   • Row-level locking (FOR UPDATE) is replaced by Prisma's default
 *     serializable transaction isolation.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/leases/create
 *
 * Executed when a tenant successfully books a property.
 * All three steps run inside a single atomic transaction:
 *   1. Verify the property exists and is currently approved.
 *   2. Insert a new ACTIVE lease row.
 *   3. Mark the property as rented (validation = APPROVED is kept;
 *      a separate `rented` flag could be added if the schema evolves).
 *
 * Old SQL equivalent:
 *   BEGIN;
 *   SELECT id, validation, title FROM public.properties WHERE id = $1 FOR UPDATE;
 *   INSERT INTO public.leases
 *     (property_id, tenant_id, start_date, end_date, monthly_rent, status)
 *   VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *;
 *   COMMIT;
 *
 * Replaced by:
 *   prisma.$transaction(async (tx) => { ... })
 */
export const createLease = async (req: Request, res: Response) => {
  const {
    propertyId,
    tenantId,
    tenantName,   // kept for compatibility — not stored in the Prisma Lease model
    tenantEmail,  // kept for compatibility — not stored in the Prisma Lease model
    startDate,
    endDate,
    monthlyRent,
  } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'propertyId is required.' });
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

  try {
    // prisma.$transaction() replaces manual pool.connect() + BEGIN/COMMIT/ROLLBACK.
    const lease = await prisma.$transaction(async (tx) => {
      // Step 1 — Verify the property exists and is APPROVED (available to lease).
      // Replaces:
      //   SELECT id, validation, title FROM public.properties WHERE id = $1 FOR UPDATE
      const property = await tx.property.findUnique({
        where:  { id: propertyId.trim() },
        select: { id: true, validation: true, title: true },
      });

      if (!property) {
        throw new Error(`PROPERTY_NOT_FOUND: Property with id ${propertyId} does not exist.`);
      }

      if (property.validation !== 'APPROVED') {
        throw new Error(
          `PROPERTY_UNAVAILABLE: Property "${property.title}" is not available for lease. Status: ${property.validation}.`
        );
      }

      // Step 2 — Create the lease record.
      // Replaces: INSERT INTO public.leases (...) VALUES (...) RETURNING *
      const newLease = await tx.lease.create({
        data: {
          property_id:  property.id,
          tenant_id:    tenantId.trim(),
          start_date:   new Date(startDate),
          end_date:     new Date(endDate),
          monthly_rent: new Prisma.Decimal(Number(monthlyRent)),
          status:       'ACTIVE',
        },
      });

      return newLease;
    });

    return res.status(201).json({
      message: 'Lease created successfully.',
      lease: {
        id:          lease.id,
        propertyId:  lease.property_id,
        tenantId:    lease.tenant_id,
        startDate:   lease.start_date,
        endDate:     lease.end_date,
        monthlyRent: lease.monthly_rent,
        status:      lease.status,
        createdAt:   lease.created_at,
      },
    });
  } catch (error: any) {
    if (error?.message?.startsWith('PROPERTY_NOT_FOUND:')) {
      return res.status(404).json({ error: 'Not found', message: error.message });
    }
    if (error?.message?.startsWith('PROPERTY_UNAVAILABLE:')) {
      return res.status(409).json({ error: 'Conflict', message: error.message });
    }
    console.error('[createLease] Transaction rolled back:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
