import { Router } from 'express';
import { login, whoami, logout }                                  from '../controllers/auth.controller';
import { getAllListings, createListing }                          from '../controllers/listings.controller';
import { createBooking, getBookingsByRenter, updateBookingStatus } from '../controllers/bookings.controller';
import { createPayment }                                          from '../controllers/payments.controller';
import { getAllUsers, getUserById, createUser, signupUser, loginUser } from '../controllers/users.controller';
import { getAllMaintenanceRequests, createMaintenanceRequest, submitMaintenanceTicket, getTenantRentedProperties } from '../controllers/maintenance.controller';
import { registerProperty, getOwnerProperties }                   from '../controllers/properties.controller';
import { createLease }                                            from '../controllers/leases.controller';
import {
  getDashboardStats,
  getClassifiedUsers,
  setUserActiveStatus,
  getPendingApprovals,
  setPropertyValidation,
  getAllProperties,
  getRentalsMatrix,
} from '../controllers/admin.controller';
import { loadUserFromHeader, requireSuperadmin } from '../middleware/auth.middleware';
import { signContract }                          from '../controllers/esign.controller';
import prisma                                    from '../lib/prisma';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',   login);
router.post('/auth/logout',  loadUserFromHeader, logout);
router.get( '/auth/me',      loadUserFromHeader, whoami);

// ── Users (public signup / phone login) ──────────────────────────────────────
router.post('/users/signup', signupUser);
router.post('/users/login',  loginUser);
router.get( '/users',        loadUserFromHeader, requireSuperadmin, getAllUsers);
router.get( '/users/:id',    loadUserFromHeader, getUserById);
router.post('/users',        loadUserFromHeader, requireSuperadmin, createUser);

// ── Listings ─────────────────────────────────────────────────────────────────
router.get( '/listings', getAllListings);
router.post('/listings', loadUserFromHeader, createListing);

// ── Bookings ─────────────────────────────────────────────────────────────────
router.post(  '/bookings',                  loadUserFromHeader, createBooking);
router.get(   '/bookings/renter/:renterId', loadUserFromHeader, getBookingsByRenter);
router.patch( '/bookings/:id/status',       loadUserFromHeader, updateBookingStatus);

// ── Payments ─────────────────────────────────────────────────────────────────
router.post('/payments', loadUserFromHeader, createPayment);

// ── Maintenance ───────────────────────────────────────────────────────────────
router.get(  '/maintenance',         loadUserFromHeader, getAllMaintenanceRequests);
router.post( '/maintenance',         loadUserFromHeader, createMaintenanceRequest);
router.post( '/maintenance/submit',  loadUserFromHeader, submitMaintenanceTicket);
router.patch('/maintenance/:id',     loadUserFromHeader, async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;
  try {
    await prisma.maintenanceTicket.update({ where: { id: id as string }, data: { status: status as any } });
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('[PATCH /maintenance/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/tenant/my-rented-properties', loadUserFromHeader, getTenantRentedProperties);

// ── Properties ────────────────────────────────────────────────────────────────
router.post('/properties/register',          loadUserFromHeader, registerProperty);
router.get( '/properties/owner/:ownerId',    loadUserFromHeader, getOwnerProperties);

// ── Leases ────────────────────────────────────────────────────────────────────
router.post('/leases/create', loadUserFromHeader, createLease);

// ── E-Sign ────────────────────────────────────────────────────────────────────
router.post('/esign/sign-contract', loadUserFromHeader, signContract);

// ── Admin — SUPERADMIN only ───────────────────────────────────────────────────
const admin = Router();
admin.use(loadUserFromHeader, requireSuperadmin);   // all admin routes require superadmin

admin.get(   '/stats',                     getDashboardStats);
admin.get(   '/users',                     getClassifiedUsers);
admin.patch( '/users/:id/activate',        setUserActiveStatus);
admin.patch( '/users/:id/deactivate',      setUserActiveStatus);
admin.get(   '/approvals',                 getPendingApprovals);
admin.patch( '/properties/:id/approve',    setPropertyValidation);
admin.patch( '/properties/:id/reject',     setPropertyValidation);
admin.get(   '/properties',                getAllProperties);
admin.get(   '/rentals-matrix',            getRentalsMatrix);

router.use('/admin', admin);

export default router;
