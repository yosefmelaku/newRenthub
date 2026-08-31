import { z } from 'zod';

/**
 * Validation schema for the old custom payment endpoint (kept for compatibility).
 */
export const createPaymentSchema = {
  body: z.object({
    bookingId: z.string({ message: 'bookingId is required' }).uuid('bookingId must be a valid UUID'),
    renterId: z.string().uuid('renterId must be a valid UUID').optional().nullable(),
    amount: z.coerce.number().positive('Amount must be a positive number').optional().nullable(),
    cardholderName: z.string().trim().min(2, 'Cardholder name must be at least 2 characters').optional().nullable(),
    cardNumberMasked: z.string().trim().min(4, 'Card number must be at least 4 digits').optional().nullable(),
  }),
};

/**
 * Validation schema for creating a Stripe checkout session.
 */
export const checkoutSessionSchema = {
  body: z.object({
    bookingId: z.string({ message: 'bookingId is required' }).uuid('bookingId must be a valid UUID'),
  }),
};

/**
 * Validation schema for verifying a sandbox checkout session in development mode.
 */
export const verifySandboxSchema = {
  body: z.object({
    bookingId: z.string({ message: 'bookingId is required' }).uuid('bookingId must be a valid UUID'),
    sessionId: z.string({ message: 'sessionId is required' }).min(1, 'sessionId cannot be empty'),
  }),
};

/**
 * Validation schema for verifying payment status parameter.
 */
export const bookingStatusParamSchema = {
  params: z.object({
    bookingId: z.string({ message: 'bookingId is required' }).uuid('bookingId must be a valid UUID'),
  }),
};
