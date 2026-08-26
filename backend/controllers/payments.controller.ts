/**
 * payments.controller.ts
 *
 * Handles payment recording and booking settlement.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *
 *   // Two separate pool.query() calls — no atomicity guarantee
 *   await pool.query('INSERT INTO payments (...) VALUES (...) RETURNING *', [...]);
 *   await pool.query('UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3', [...]);
 *
 * New approach (Prisma Client):
 *   await prisma.$transaction(async (tx) => {
 *     const payment = await tx.payment.create({ data: { ... } });
 *     await tx.booking.update({ where: { id: bookingId }, data: { ... } });
 *   });
 *
 * Benefits:
 *   • Both writes are atomic — if the booking update fails, the payment insert
 *     is rolled back automatically. No orphaned payment records.
 *   • No manual BEGIN/COMMIT/ROLLBACK or pool.connect() / client.release().
 *   • Transaction ID is generated server-side and stored directly in the data
 *     object — no $1…$N parameter counting.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/payments
 *
 * Records a payment and immediately marks the associated booking as paid/approved.
 * Both writes execute inside a single atomic transaction.
 *
 * Old SQL equivalent (two separate calls, no transaction):
 *   INSERT INTO payments (booking_id, renter_id, amount, cardholder_name,
 *     card_number_masked, transaction_id, status)
 *   VALUES ($1, $2, $3, $4, $5, $6, $7)
 *   RETURNING *
 *
 *   UPDATE bookings SET payment_status = 'paid', status = 'approved'
 *   WHERE id = $1
 *
 * Replaced by:
 *   prisma.$transaction([
 *     tx.payment.create({ data: { ... } }),
 *     tx.booking.update({ where: { id }, data: { ... } }),
 *   ])
 */
export const createPayment = async (req: Request, res: Response) => {
  const {
    bookingId,
    renterId,
    amount,
    cardholderName,
    cardNumberMasked,
  } = req.body;

  // Generate a unique transaction ID server-side — never trust one from the client.
  const transactionId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  try {
    // prisma.$transaction() wraps both writes atomically.
    // If either fails, Prisma rolls back the entire operation — no orphaned
    // payment records and no paid bookings without a corresponding payment row.
    const [payment] = await prisma.$transaction([
      // Step 1 — Insert the payment record.
      // Replaces: INSERT INTO payments (...) VALUES ($1 … $7) RETURNING *
      prisma.payment.create({
        data: {
          booking_id:         bookingId,
          renter_id:          renterId          ?? null,
          amount:             amount != null ? new Prisma.Decimal(Number(amount)) : null,
          cardholder_name:    cardholderName    ?? null,
          card_number_masked: cardNumberMasked  ?? null,
          transaction_id:     transactionId,
          status:             'success',
        },
      }),

      // Step 2 — Mark the booking as paid and approved.
      // Replaces: UPDATE bookings SET payment_status = 'paid', status = 'approved' WHERE id = $1
      prisma.booking.update({
        where: { id: bookingId },
        data:  { payment_status: 'paid', status: 'approved' },
      }),
    ]);

    res.status(201).json({
      id:               payment.id,
      bookingId:        payment.booking_id,
      renterId:         payment.renter_id,
      amount:           payment.amount,
      cardholderName:   payment.cardholder_name,
      cardNumberMasked: payment.card_number_masked,
      transactionId:    payment.transaction_id,
      status:           payment.status,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
