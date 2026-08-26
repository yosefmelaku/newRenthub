import type { PropertyListing, Booking, PaymentRecord } from '../types';

const API = '/api';

// ── Auth helper ───────────────────────────────────────────────────────────────
// Sends the logged-in user's email as a Bearer token — the backend middleware
// resolves the full user record from the DB via this email.
const authHeaders = (): Record<string, string> => {
  const raw   = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const email = raw ? JSON.parse(raw).email ?? '' : '';
  return {
    'Content-Type':  'application/json',
    ...(email ? { Authorization: `Bearer ${email}` } : {}),
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
