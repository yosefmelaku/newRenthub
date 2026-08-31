import { Router } from 'express';
import { login, whoami, logout }                                  from '../controllers/auth.controller';
import { getAllListings, createListing }                          from '../controllers/listings.controller';
import { createBooking, getBookingsByRenter, updateBookingStatus } from '../controllers/bookings.controller';
import { createPayment, createCheckoutSession, verifySandbox, handleWebhook, getPaymentStatus, confirmPayment } from '../controllers/payments.controller';
import { getAllUsers, getUserById, createUser, signupUser, loginUser } from '../controllers/users.controller';
import { getAllMaintenanceRequests, createMaintenanceRequest, submitMaintenanceTicket, getTenantRentedProperties } from '../controllers/maintenance.controller';
import { createProperty, getOwnerProperties, updateProperty, deleteProperty, recordRentalOnProperty, registerProperty } from '../controllers/properties.controller';
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

// Reusable Zod input validation middleware and schemas
import { validate } from '../middleware/validate.middleware';
import {
  loginSchema,
  signupSchema,
  phoneLoginSchema,
  adminCreateUserSchema,
  userIdParamSchema,
  createListingSchema,
  createPaymentSchema,
  createLeaseSchema,
  checkoutSessionSchema,
  verifySandboxSchema,
  bookingStatusParamSchema,
  createPropertySchema,
  updatePropertySchema,
  propertyIdParamSchema,
  ownerIdParamSchema,
  rentalDeltaSchema,
} from '../schemas';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',   validate(loginSchema), login);
router.post('/auth/logout',  loadUserFromHeader, logout);
router.get( '/auth/me',      loadUserFromHeader, whoami);

// ── Users (public signup / phone login) ──────────────────────────────────────
router.post('/users/signup', validate(signupSchema), signupUser);
router.post('/users/login',  validate(phoneLoginSchema), loginUser);
router.get( '/users',        loadUserFromHeader, requireSuperadmin, getAllUsers);
router.get( '/users/:id',    loadUserFromHeader, validate(userIdParamSchema), getUserById);
router.post('/users',        loadUserFromHeader, requireSuperadmin, validate(adminCreateUserSchema), createUser);

// ── Listings ─────────────────────────────────────────────────────────────────
router.get( '/listings', getAllListings);
router.post('/listings', loadUserFromHeader, validate(createListingSchema), createListing);

// ── Bookings ─────────────────────────────────────────────────────────────────
router.post(  '/bookings',                  loadUserFromHeader, createBooking);
router.get(   '/bookings/renter/:renterId', loadUserFromHeader, getBookingsByRenter);
router.patch( '/bookings/:id/status',       loadUserFromHeader, updateBookingStatus);

// ── Payments ─────────────────────────────────────────────────────────────────
router.post('/payments/checkout-session', loadUserFromHeader, validate(checkoutSessionSchema), createCheckoutSession);
router.post('/payments/verify-sandbox', loadUserFromHeader, validate(verifySandboxSchema), verifySandbox);
router.post('/payments/confirm', loadUserFromHeader, confirmPayment);
router.get('/payments/status/:bookingId', loadUserFromHeader, validate(bookingStatusParamSchema), getPaymentStatus);
router.post('/payments/webhook', handleWebhook);
router.post('/payments', loadUserFromHeader, validate(createPaymentSchema), createPayment);

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
router.post(  '/properties',                  loadUserFromHeader, validate(createPropertySchema), createProperty);
router.get(   '/properties/owner/:ownerId',   loadUserFromHeader, validate(ownerIdParamSchema), getOwnerProperties);
router.patch( '/properties/:id',              loadUserFromHeader, validate(updatePropertySchema), updateProperty);
router.delete('/properties/:id',              loadUserFromHeader, validate(propertyIdParamSchema), deleteProperty);
router.patch( '/properties/:id/rent',         loadUserFromHeader, validate(rentalDeltaSchema), recordRentalOnProperty);
// Legacy route kept for backward compat
router.post(  '/properties/register',         loadUserFromHeader, registerProperty);

// ── Leases ────────────────────────────────────────────────────────────────────
router.post('/leases/create', loadUserFromHeader, validate(createLeaseSchema), createLease);

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
