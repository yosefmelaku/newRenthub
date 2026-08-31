import { z } from 'zod';

/**
 * Validation schema for email-based login requests.
 */
export const loginSchema = {
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .trim()
      .email('Invalid email address format'),
    password: z
      .string({ message: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
};
