import { z } from 'zod';


 
export const createListingSchema = {
  body: z.object({
    title: z.string({ message: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().optional().nullable(),
    location: z.string().trim().optional().nullable(),
    price: z.coerce.number().positive('Price must be a positive number').optional().nullable(),
    type: z.string().trim().optional().nullable(),
    beds: z.coerce.number().int('Beds must be an integer').nonnegative().optional().nullable(),
    baths: z.coerce.number().int('Baths must be an integer').nonnegative().optional().nullable(),
    image: z.string().url('Image must be a valid URL').or(z.string().max(0)).optional().nullable(),
    amenities: z.array(z.string()).optional(),
    rating: z.coerce.number().min(0).max(5).optional().nullable(),
    reviewsCount: z.coerce.number().int().nonnegative().optional().nullable(),
    ownerId: z.string().uuid('ownerId must be a valid UUID').optional().nullable(),
    featured: z.boolean().optional(),
  }),
};
