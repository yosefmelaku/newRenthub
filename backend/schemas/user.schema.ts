import { z } from 'zod';

/**
 * Validation schema for public user registration (signup).
 */
export const signupSchema = {
  body: z.object({
    name: z.string({ message: 'name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    phone: z.string({ message: 'phone is required' }).trim().min(5, 'Phone number must be at least 5 digits'),
    password: z.string({ message: 'password is required' }).min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['renter', 'owner']).optional(),
  }),
};

/**
 * Validation schema for phone-based login.
 */
export const phoneLoginSchema = {
  body: z.object({
    phone: z.string({ message: 'phone is required' }).trim().min(5, 'Phone number must be at least 5 digits'),
    password: z.string({ message: 'password is required' }).min(1, 'Password cannot be empty'),
  }),
};

/**
 * Validation schema for admin quick user creation (without password).
 */
export const adminCreateUserSchema = {
  body: z.object({
    name: z.string({ message: 'name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: z.string({ message: 'email is required' }).trim().email('Invalid email address format'),
    role: z.enum(['renter', 'owner']).optional(),
  }),
};

/**
 * Validation schema for user ID route parameter validation.
 */
export const userIdParamSchema = {
  params: z.object({
    id: z.string({ message: 'User ID is required' }).uuid('User ID must be a valid UUID'),
  }),
};
