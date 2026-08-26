/**
 * bookings.controller.ts
 *
 * Handles booking creation, retrieval, and status updates.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *   const result = await pool.query(
 *     'INSERT INTO bookings (...) VALUES ($1, $2, ...) RETURNING *',
 *     [listingId, renterId, ...]
 *   );
 *   const row = result.rows[0];   // manual unwrap, manual camelCase mapping
 *
 * New approach (Prisma Client):
 *   import prisma from '../lib/prisma';
 *   const booking = await prisma.booking.create({ data: { ... } });
 *   // fully-typed Booking object — no result.rows[0], no mapping needed
 *
 * The JOIN in getBookingsByRenter (bookings + listings) is now expressed as
 * `include: { listing: { select: {...} } }` — no SQL string required.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/bookings
 *
 * Creates a new booking.
 *
 * Old SQL equivalent:
 *   INSERT INTO bookings
 *     (listing_id, renter_id, renter_name, start_date, end_date,
 *      total_price, status, payment_status, nights)
 *   VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'unpaid', $9)
 *   RETURNING *
 *
 * Replaced by:
 *   prisma.booking.create({ data: { ... } })
 */
export const createBooking = async (req: Request, res: Response) => {
  const { listingId, renterId, renterName, startDate, endDate, totalPrice, nights } = req.body;

  try {
    // prisma.booking.create() replaces INSERT ... RETURNING *.
    // Default values for status and payment_status are set declaratively here,
    // mirroring the original SQL defaults.
    const booking = await prisma.booking.create({
      data: {
        listing_id:     listingId,
        renter_id:      renterId      ?? null,
        renter_name:    renterName    ?? null,
        start_date:     new Date(startDate),
        end_date:       new Date(endDate),
        total_price:    totalPrice != null ? new Prisma.Decimal(Number(totalPrice)) : null,
        status:         'pending',
        payment_status: 'unpaid',
        nights:         nights != null ? Number(nights) : null,
      },
    });

    res.status(201).json({
      id:            booking.id,
      listingId:     booking.listing_id,
      renterId:      booking.renter_id,
      renterName:    booking.renter_name,
      startDate:     booking.start_date,
      endDate:       booking.end_date,
      totalPrice:    booking.total_price,
      status:        booking.status,
      paymentStatus: booking.payment_status,
      nights:        booking.nights,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/bookings/renter/:renterId
 *
 * Returns all bookings for a given renter, with listing details joined in.
 *
 * Old SQL equivalent:
 *   SELECT b.*, l.title AS listing_title, l.image AS listing_image, l.location AS listing_location
 *   FROM bookings b
 *   JOIN listings l ON b.listing_id = l.id
 *   WHERE b.renter_id = $1
 *   ORDER BY b.id DESC
 *
 * Replaced by:
 *   prisma.booking.findMany({ where: { renter_id }, include: { listing: { select: {...} } } })
 *
 * `include` handles the JOIN — no SQL string, no manual column aliasing.
 */
export const getBookingsByRenter = async (req: Request, res: Response) => {
  const { renterId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where:   { renter_id: renterId },
      include: {
        listing: {
          select: {
            title:    true,
            image:    true,
            location: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mapped = bookings.map((b) => ({
      id:              b.id,
      listingId:       b.listing_id,
      listingTitle:    b.listing.title,
      listingImage:    b.listing.image,
      listingLocation: b.listing.location,
      renterId:        b.renter_id,
      renterName:      b.renter_name,
      startDate:       b.start_date,
      endDate:         b.end_date,
      totalPrice:      b.total_price,
      status:          b.status,
      paymentStatus:   b.payment_status,
      nights:          b.nights,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching bookings for renter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/bookings/:id/status
 *
 * Updates the status field on a single booking.
 *
 * Old SQL equivalent:
 *   UPDATE bookings SET status = $1 WHERE id = $2
 *
 * Replaced by:
 *   prisma.booking.update({ where: { id }, data: { status } })
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  const { id }     = req.params;
  const { status } = req.body;

  try {
    // prisma.booking.update() replaces the UPDATE ... WHERE pattern.
    // Throws a PrismaClientKnownRequestError (P2025) if id doesn't exist,
    // which we can catch and return a proper 404 instead of silently ignoring.
    await prisma.booking.update({
      where: { id },
      data:  { status },
    });

    res.json({ message: 'Booking status updated successfully' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
