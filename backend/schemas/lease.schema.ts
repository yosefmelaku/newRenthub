import { z } from 'zod';

/**
 * Validation schema for lease creation requests.
 * Uses z.coerce.date() and .refine() to enforce chronological correctness.
 */
export const createLeaseSchema = {
  body: z
    .object({
      propertyId: z.string({ message: 'propertyId is required' }).uuid('propertyId must be a valid UUID'),
      tenantId: z.string({ message: 'tenantId is required' }).uuid('tenantId must be a valid UUID'),
      tenantName: z.string({ message: 'tenantName is required' }).trim().min(2, 'tenantName must be at least 2 characters'),
      tenantEmail: z.string({ message: 'tenantEmail is required' }).trim().email('Invalid email address format'),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      monthlyRent: z.coerce.number().positive('monthlyRent must be a positive number'),
    })
    .refine((data) => data.startDate < data.endDate, {
      message: 'startDate must be before endDate',
      path: ['startDate'],
    }),
};
