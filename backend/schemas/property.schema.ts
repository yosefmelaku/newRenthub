import { z } from 'zod';

const PROPERTY_TYPES = ['house', 'villa', 'office', 'studio'] as const;

export const createPropertySchema = {
  body: z.object({
    ownerId:       z.string({ message: 'ownerId is required' }).min(1),
    title:         z.string({ message: 'title is required' }).trim().min(2, 'Title must be at least 2 characters'),
    type:          z.enum(PROPERTY_TYPES, { message: `type must be one of: ${PROPERTY_TYPES.join(', ')}` }),
    city:          z.string().trim().min(1, 'City is required'),
    subcity:       z.string().optional().nullable(),
    address:       z.string().trim().min(2, 'Address is required'),
    monthlyRent:   z.coerce.number().positive('Monthly rent must be a positive number'),
    beds:          z.coerce.number().int().min(0).optional().nullable(),
    baths:         z.coerce.number().int().min(0).optional().nullable(),
    officeSqm:     z.coerce.number().int().min(0).optional().nullable(),
    meetingRooms:  z.coerce.number().int().min(0).optional().nullable(),
    parkingSpaces: z.coerce.number().int().min(0).optional().nullable(),
    totalUnits:    z.coerce.number().int().min(1).optional().nullable(),
    imageUrl:      z.string().url('imageUrl must be a valid URL').optional().nullable().or(z.literal('')),
  }),
};

export const updatePropertySchema = {
  body: z.object({
    ownerId:       z.string({ message: 'ownerId is required' }).min(1),
    title:         z.string().trim().min(2).optional(),
    type:          z.enum(PROPERTY_TYPES).optional(),
    city:          z.string().trim().min(1).optional(),
    subcity:       z.string().optional().nullable(),
    address:       z.string().trim().min(2).optional(),
    monthlyRent:   z.coerce.number().positive().optional(),
    beds:          z.coerce.number().int().min(0).optional().nullable(),
    baths:         z.coerce.number().int().min(0).optional().nullable(),
    officeSqm:     z.coerce.number().int().min(0).optional().nullable(),
    meetingRooms:  z.coerce.number().int().min(0).optional().nullable(),
    parkingSpaces: z.coerce.number().int().min(0).optional().nullable(),
    totalUnits:    z.coerce.number().int().min(1).optional().nullable(),
    imageUrl:      z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1, 'Property id is required'),
  }),
};

export const propertyIdParamSchema = {
  params: z.object({
    id: z.string().min(1, 'Property id is required'),
  }),
};

export const ownerIdParamSchema = {
  params: z.object({
    ownerId: z.string().min(1, 'ownerId is required'),
  }),
};

export const rentalDeltaSchema = {
  params: z.object({
    id: z.string().min(1, 'Property id is required'),
  }),
  body: z.object({
    delta: z.coerce.number().int().optional(),
  }),
};
