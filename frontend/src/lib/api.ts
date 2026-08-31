import type { PropertyListing, Booking, PaymentRecord } from '../types';

// ── Owner Property type (mirrors backend mapToClient output) ─────────────────
export interface OwnerProperty {
  id:             string;
  title:          string;
  type:           'house' | 'villa' | 'office' | 'studio';
  city:           string;
  subcity:        string;
  address:        string;
  monthlyRent:    number;
  beds:           number;
  baths:          number;
  officeSqm:      number;
  meetingRooms:   number;
  parkingSpaces:  number;
  imageUrl:       string | null;
  totalUnits:     number;
  rentedUnits:    number;
  tenantUnitCount: number;
  status:         'available' | 'applied' | 'rented';
  validation:     string;
  ownerId:        string;
  createdAt:      string;
}

export interface CreatePropertyPayload {
  ownerId:        string;
  title:          string;
  type:           'house' | 'villa' | 'office' | 'studio';
  city:           string;
  subcity?:       string;
  address:        string;
  monthlyRent:    number;
  beds?:          number;
  baths?:         number;
  officeSqm?:     number;
  meetingRooms?:  number;
  parkingSpaces?: number;
  totalUnits?:    number;
  imageUrl?:      string | null;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;


const API = '/api';

// ── Auth helper ───────────────────────────────────────────────────────────────
// Sends the logged-in user's email as a Bearer token — the backend middleware
// resolves the full user record from the DB via this email.
const authHeaders = (): Record<string, string> => {
  const raw   = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const token = raw ? JSON.parse(raw).token ?? '' : '';
  return {
    'Content-Type':  'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function emailLogin(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ success: boolean; user: any }>(res);
}

// ── Listings ──────────────────────────────────────────────────────────────────

export async function getAllListings(): Promise<PropertyListing[]> {
  const res = await fetch(`${API}/listings`);
  return handleResponse<PropertyListing[]>(res);
}

export async function createListing(listing: Omit<PropertyListing, 'id' | 'rating' | 'reviewsCount'>): Promise<PropertyListing> {
  const res = await fetch(`${API}/listings`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(listing),
  });
  return handleResponse<PropertyListing>(res);
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getBookingsByRenter(renterId: string): Promise<Booking[]> {
  const res = await fetch(`${API}/bookings/renter/${encodeURIComponent(renterId)}`, {
    headers: authHeaders(),
  });
  return handleResponse<Booking[]>(res);
}

export async function createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'paymentStatus'>): Promise<Booking> {
  const res = await fetch(`${API}/bookings`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(booking),
  });
  return handleResponse<Booking>(res);
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<void> {
  const res = await fetch(`${API}/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
  });
  await handleResponse<void>(res);
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function createPaymentRecord(
  payment: Omit<PaymentRecord, 'id' | 'transactionId' | 'timestamp' | 'status'>
): Promise<PaymentRecord> {
  const res = await fetch(`${API}/payments`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payment),
  });
  return handleResponse<PaymentRecord>(res);
}

export async function createCheckoutSession(bookingId: string): Promise<{ sessionId: string; url: string; isSandbox: boolean }> {
  const res = await fetch(`${API}/payments/checkout-session`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ bookingId }),
  });
  return handleResponse<{ sessionId: string; url: string; isSandbox: boolean }>(res);
}

export async function verifySandboxPayment(bookingId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/payments/verify-sandbox`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ bookingId, sessionId }),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

export async function checkPaymentStatus(bookingId: string): Promise<{ bookingId: string; paymentStatus: string; status: string }> {
  const res = await fetch(`${API}/payments/status/${encodeURIComponent(bookingId)}`, {
    headers: authHeaders(),
  });
  return handleResponse<{ bookingId: string; paymentStatus: string; status: string }>(res);
}

// ── Admin — Dashboard Stats ───────────────────────────────────────────────────

export interface AdminStats {
  totalUsers:        number;
  totalTenants:      number;
  totalOwners:       number;
  totalProperties:   number;
  pendingProperties: number;
  approvedProperties:number;
  activeLeases:      number;
  totalTickets:      number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API}/admin/stats`, { headers: authHeaders() });
  return handleResponse<AdminStats>(res);
}

// ── Admin — Users ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id:            string;
  name:          string;
  email:         string;
  phone?:        string;
  role:          string;
  is_active:     boolean;
  created_at:    string;
  total_uploads: number;
  active_leases: number;
}

export async function fetchClassifiedUsers(role?: string, search?: string): Promise<{ count: number; users: AdminUser[] }> {
  const params = new URLSearchParams();
  if (role)   params.set('role',   role);
  if (search) params.set('search', search);
  const url = `${API}/admin/users${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<{ count: number; users: AdminUser[] }>(res);
}

export async function activateUser(userId: string): Promise<void> {
  const res = await fetch(`${API}/admin/users/${userId}/activate`, {
    method: 'PATCH', headers: authHeaders(),
  });
  await handleResponse<void>(res);
}

export async function deactivateUser(userId: string): Promise<void> {
  const res = await fetch(`${API}/admin/users/${userId}/deactivate`, {
    method: 'PATCH', headers: authHeaders(),
  });
  await handleResponse<void>(res);
}

// ── Admin — Properties ────────────────────────────────────────────────────────

export interface AdminProperty {
  id:            string;
  title:         string;
  category:      string;
  address:       string;
  city:          string;
  rent_amount:   number;
  validation:    string;
  bedrooms?:     number;
  bathrooms?:    number;
  image_url?:    string;
  created_at:    string;
  active_leases: number;
  ownerId:       string;
  ownerName:     string;
  ownerEmail:    string;
}

export async function fetchAllAdminProperties(status?: string, search?: string): Promise<{ count: number; properties: AdminProperty[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const url = `${API}/admin/properties${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<{ count: number; properties: AdminProperty[] }>(res);
}

export async function fetchPendingApprovals(): Promise<{ count: number; pendingProperties: any[] }> {
  const res = await fetch(`${API}/admin/approvals`, { headers: authHeaders() });
  return handleResponse<{ count: number; pendingProperties: any[] }>(res);
}

export async function approveProperty(propertyId: string): Promise<void> {
  const res = await fetch(`${API}/admin/properties/${propertyId}/approve`, {
    method: 'PATCH', headers: authHeaders(),
  });
  await handleResponse<void>(res);
}

export async function rejectProperty(propertyId: string): Promise<void> {
  const res = await fetch(`${API}/admin/properties/${propertyId}/reject`, {
    method: 'PATCH', headers: authHeaders(),
  });
  await handleResponse<void>(res);
}

// ── Admin — Rentals Matrix ────────────────────────────────────────────────────

export async function fetchRentalsMatrix(): Promise<{ count: number; rentalsMatrix: any[] }> {
  const res = await fetch(`${API}/admin/rentals-matrix`, { headers: authHeaders() });
  return handleResponse<{ count: number; rentalsMatrix: any[] }>(res);
}

// ── Auth Logout ───────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  try {
    const res = await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    await handleResponse<void>(res);
  } catch (e) {
    console.error('Backend logout failed', e);
  }
}

// ── Owner Properties CRUD ─────────────────────────────────────────────────────

export async function fetchOwnerProperties(ownerId: string): Promise<{ count: number; bulkDiscountEligible: boolean; properties: OwnerProperty[] }> {
  const res = await fetch(`${API}/properties/owner/${encodeURIComponent(ownerId)}`, {
    headers: authHeaders(),
  });
  return handleResponse<{ count: number; bulkDiscountEligible: boolean; properties: OwnerProperty[] }>(res);
}

export async function createOwnerProperty(payload: CreatePropertyPayload): Promise<{ property: OwnerProperty }> {
  const res = await fetch(`${API}/properties`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ property: OwnerProperty }>(res);
}

export async function updateOwnerProperty(id: string, payload: UpdatePropertyPayload): Promise<{ property: OwnerProperty }> {
  const res = await fetch(`${API}/properties/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ property: OwnerProperty }>(res);
}

export async function deleteOwnerProperty(id: string, ownerId: string): Promise<void> {
  const res = await fetch(`${API}/properties/${encodeURIComponent(id)}?ownerId=${encodeURIComponent(ownerId)}`, {
    method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ ownerId }),
  });
  await handleResponse<void>(res);
}

export async function recordPropertyRental(id: string, delta: 1 | -1): Promise<{ property: OwnerProperty }> {
  const res = await fetch(`${API}/properties/${encodeURIComponent(id)}/rent`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ delta }),
  });
  return handleResponse<{ property: OwnerProperty }>(res);
}

