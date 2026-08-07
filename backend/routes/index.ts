import { Router } from 'express';
import { getAllListings, createListing } from '../controllers/listings.controller';
import { createBooking, getBookingsByRenter, updateBookingStatus } from '../controllers/bookings.controller';
import { createPayment } from '../controllers/payments.controller';
import { getAllUsers, getUserById, createUser } from '../controllers/users.controller';
import { getAllMaintenanceRequests, createMaintenanceRequest } from '../controllers/maintenance.controller';
import { registerProperty } from '../controllers/properties.controller';
import { createLease } from '../controllers/leases.controller';
import { getPendingApprovals, getRentalsMatrix } from '../controllers/admin.controller';
import { signContract } from '../controllers/esign.controller';

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
router.patch('/maintenance/:id', async (req, res) => {

  const { id } = req.params;
  const { status } = req.body;
  try {
    const pool = (await import('../database/db')).default;
    await pool.query('UPDATE maintenance_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Properties — owner registration workflow
router.post('/properties/register', registerProperty);

// Leases — tenant booking / lease creation
router.post('/leases/create', createLease);

// E-Sign — tenant contract execution
router.post('/esign/sign-contract', signContract);

// Admin — superadmin-only endpoints
router.get('/admin/approvals', getPendingApprovals);
router.get('/admin/rentals-matrix', getRentalsMatrix);

export default router;
