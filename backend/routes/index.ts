import { Router } from 'express';
import { getAllListings, createListing } from '../controllers/listings.controller';
import { createBooking, getBookingsByRenter, updateBookingStatus } from '../controllers/bookings.controller';
import { createPayment } from '../controllers/payments.controller';

import { getAllUsers, getUserById, createUser } from '../controllers/users.controller';
import { getAllMaintenanceRequests, createMaintenanceRequest } from '../controllers/maintenance.controller';

const router = Router();

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);

// Listings
router.get('/listings', getAllListings);
router.post('/listings', createListing);

// Bookings
router.post('/bookings', createBooking);
router.get('/bookings/renter/:renterId', getBookingsByRenter);
router.patch('/bookings/:id/status', updateBookingStatus);

// Payments
router.post('/payments', createPayment);

// Maintenance Requests
router.get('/maintenance', getAllMaintenanceRequests);
router.post('/maintenance', createMaintenanceRequest);
router.post('/payments', createPayment);

export default router;
