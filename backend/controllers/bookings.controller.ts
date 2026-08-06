import { Request, Response } from 'express';
import pool from '../database/db';

export const createBooking = async (req: Request, res: Response) => {
  const { listingId, renterId, renterName, startDate, endDate, totalPrice, nights } = req.body;
  try {
    const query = `
      INSERT INTO bookings (listing_id, renter_id, renter_name, start_date, end_date, total_price, status, payment_status, nights)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [listingId, renterId, renterName, startDate, endDate, totalPrice, 'pending', 'unpaid', nights];
    const result = await pool.query(query, values);
    
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      listingId: row.listing_id,
      renterId: row.renter_id,
      renterName: row.renter_name,
      startDate: row.start_date,
      endDate: row.end_date,
      totalPrice: row.total_price,
      status: row.status,
      paymentStatus: row.payment_status,
      nights: row.nights,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBookingsByRenter = async (req: Request, res: Response) => {
  const { renterId } = req.params;
  try {
    const query = `
      SELECT b.*, l.title as listing_title, l.image as listing_image, l.location as listing_location
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      WHERE b.renter_id = $1
      ORDER BY b.id DESC
    `;
    const result = await pool.query(query, [renterId]);
    
    const mapped = result.rows.map(row => ({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: row.listing_title,
      listingImage: row.listing_image,
      listingLocation: row.listing_location,
      renterId: row.renter_id,
      renterName: row.renter_name,
      startDate: row.start_date,
      endDate: row.end_date,
      totalPrice: row.total_price,
      status: row.status,
      paymentStatus: row.payment_status,
      nights: row.nights,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching bookings for renter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
