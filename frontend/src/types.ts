export type UserRole = 'renter' | 'owner' | 'super-admin';

export interface AppUser {
  name: string;
  email?: string;
  role: UserRole;
  address?: string;
  phone?: string;
}

export type PropertyAvailabilityStatus = 'available' | 'applied' | 'rented';

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number; // per night
  type: 'house' | 'apartment' | 'villa' | 'studio' | 'office' | 'realestate';
  beds: number;
  baths: number;
  image: string;
  amenities: string[];
  rating: number;
  reviewsCount: number;
  ownerId: string;
  featured?: boolean;
  availabilityStatus?: PropertyAvailabilityStatus;
  officeSqm?: number;
  meetingRooms?: number;
  parkingSpaces?: number;
  totalUnits?: number;
  rentedUnits?: number;
  remainingUnits?: number;
  lat?: number;
  lng?: number;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle?: string; // Cache for easy dashboard rendering
  listingImage?: string; // Cache for easy dashboard rendering
  listingLocation?: string; // Cache for easy dashboard rendering
  renterId: string;
  renterName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalPrice: number;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  createdAt: string;
  paymentStatus: 'paid' | 'unpaid';
  nights: number;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  renterId: string;
  amount: number;
  cardholderName: string;
  cardNumberMasked: string;
  transactionId: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface OwnerStats {
  totalEarnings: number;
  occupancyRate: number;
  totalBookings: number;
  activeListingsCount: number;
}
