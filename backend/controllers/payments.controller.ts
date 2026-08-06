import { Request, Response } from 'express';
import pool from '../database/db';

export const createPayment = async (req: Request, res: Response) => {
  const { bookingId, renterId, amount, cardholderName, cardNumberMasked } = req.body;
  try {
    const transactionId = "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const query = `
      INSERT INTO payments (booking_id, renter_id, amount, cardholder_name, card_number_masked, transaction_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [bookingId, renterId, amount, cardholderName, cardNumberMasked, transactionId, 'success'];
    const result = await pool.query(query, values);
    
    // Also update booking status
    await pool.query('UPDATE bookings SET payment_status = $1, status = $2 WHERE id = $3', ['paid', 'approved', bookingId]);

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      bookingId: row.booking_id,
      renterId: row.renter_id,
      amount: row.amount,
      cardholderName: row.cardholder_name,
      cardNumberMasked: row.card_number_masked,
      transactionId: row.transaction_id,
      status: row.status,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
