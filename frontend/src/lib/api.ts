import type { PropertyListing, Booking, PaymentRecord } from '../types';

const API_URL = 'http://localhost:5000/api';

export async function getAllListings(): Promise<PropertyListing[]> {
  const response = await fetch(`${API_URL}/listings`);
  if (!response.ok) throw new Error('Failed to fetch listings');
  return response.json();
}

export async function createListing(listing: Omit<PropertyListing, 'id' | 'rating' | 'reviewsCount'>): Promise<PropertyListing> {
  const response = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing)
  });
  if (!response.ok) throw new Error('Failed to create listing');
  return response.json();
}

export async function getBookingsByRenter(renterId: string): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/bookings/renter/${encodeURIComponent(renterId)}`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

export async function getAllBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch all bookings');
  return response.json();
}

export async function createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'paymentStatus'>): Promise<Booking> {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  if (!response.ok) throw new Error('Failed to create booking');
  return response.json();
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<void> {
  const response = await fetch(`${API_URL}/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update booking status');
}

export async function createPaymentRecord(payment: Omit<PaymentRecord, 'id' | 'transactionId' | 'timestamp' | 'status'>): Promise<PaymentRecord> {
  const response = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment)
  });
  if (!response.ok) throw new Error('Failed to create payment record');
  return response.json();
}
