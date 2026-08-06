import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PropertyListing, Booking, PaymentRecord } from '../types';

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAVX1PgbhY9T5rFdDfgjMHZx06J58hdKgU",
  authDomain: "gleaming-shard-fpnh2.firebaseapp.com",
  projectId: "gleaming-shard-fpnh2",
  storageBucket: "gleaming-shard-fpnh2.firebasestorage.app",
  messagingSenderId: "343794993929",
  appId: "1:343794993929:web:044e92406137f1295721d8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Custom database ID is required as per configuration
export const db = getFirestore(app, "ai-studio-3989344e-e0d4-4cd8-a251-7d3ef62f7aee");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed listings with mock properties if empty
const PRE_SEEDED_LISTINGS: PropertyListing[] = [
  {
    id: "listing_1",
    title: "Minimalist Ocean View Villa",
    description: "Perched high on the cliffs overlooking the sea, this architectural masterpiece offers unmatched panoramic views, a private infinity pool, and pristine minimalist interiors designed for tranquility.",
    location: "Malibu, California",
    price: 450,
    type: "villa",
    beds: 3,
    baths: 3.5,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Ocean View", "Infinity Pool", "Fast Wi-Fi", "Chef's Kitchen", "Hot Tub", "AC", "Private Parking"],
    rating: 4.92,
    reviewsCount: 48,
    ownerId: "owner_default",
    featured: true,
    lat: 34.0259,
    lng: -118.7798
  },
  {
    id: "listing_2",
    title: "Industrial Loft in Historic Center",
    description: "Featuring 14-foot exposed brick walls, timber ceilings, and massive factory windows, this stylish downtown loft combines vintage industrial character with ultra-modern high-end comforts.",
    location: "SoHo, New York",
    price: 220,
    type: "apartment",
    beds: 1,
    baths: 1.5,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    amenities: ["City View", "Workspace", "Fast Wi-Fi", "Gym", "Elevator", "Heated Floors", "Washer/Dryer"],
    rating: 4.85,
    reviewsCount: 124,
    ownerId: "owner_default",
    featured: true,
    lat: 40.7233,
    lng: -74.0030
  },
  {
    id: "listing_3",
    title: "Mid-Century Modern Forest House",
    description: "Nestled among towering pines, this architectural gem features walls of glass that dissolve the boundary between indoors and nature. Complete with a wood-burning fireplace and wrap-around deck.",
    location: "Portland, Oregon",
    price: 185,
    type: "house",
    beds: 2,
    baths: 2,
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Forest View", "Fireplace", "Outdoor Deck", "Fast Wi-Fi", "Hot Tub", "BBQ Grill", "Pet Friendly"],
    rating: 4.79,
    reviewsCount: 62,
    ownerId: "owner_default",
    featured: false,
    lat: 45.5152,
    lng: -122.6784
  },
  {
    id: "listing_4",
    title: "Sleek Penthouse Studio",
    description: "Experience the pinnacle of urban living. This sleek penthouse studio features premium finishes, an integrated smart home system, and a magnificent private terrace with views across the skyline.",
    location: "Downtown Chicago, Illinois",
    price: 140,
    type: "studio",
    beds: 1,
    baths: 1,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Skyline View", "Smart Home", "Rooftop Access", "Fast Wi-Fi", "Gym", "Concierge", "AC"],
    rating: 4.68,
    reviewsCount: 37,
    ownerId: "owner_default",
    featured: false,
    lat: 41.8781,
    lng: -87.6298
  },
  {
    id: "listing_5",
    title: "Architectural Desert Oasis",
    description: "A striking geometric villa designed to capture the mystical light of the Mojave Desert. Features a stark modern aesthetic, a salt-water soaking pool, and an open sky lounge for stargazing.",
    location: "Joshua Tree, California",
    price: 380,
    type: "villa",
    beds: 2,
    baths: 2,
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Desert View", "Plunge Pool", "Star Lounge", "Fast Wi-Fi", "AC", "Fire Pit", "Solar Powered"],
    rating: 4.95,
    reviewsCount: 89,
    ownerId: "owner_default",
    featured: true,
    lat: 34.1347,
    lng: -116.3131
  },
  {
    id: "listing_6",
    title: "Charming Victorian Townhouse",
    description: "A beautiful historic townhouse boasting preserved period detail paired seamlessly with elegant modern updates. Located in a quiet, tree-lined residential neighborhood steps from top restaurants.",
    location: "Boston, Massachusetts",
    price: 210,
    type: "house",
    beds: 3,
    baths: 2.5,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Garden Patio", "Workspace", "Fast Wi-Fi", "Library", "Fireplace", "AC", "Walking Distance"],
    rating: 4.88,
    reviewsCount: 53,
    ownerId: "owner_default",
    featured: false,
    lat: 42.3601,
    lng: -71.0589
  }
];

// Helper to seed listings if collection is empty
export async function seedDatabaseIfEmpty() {
  const collectionPath = 'listings';
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    if (querySnapshot.empty) {
      console.log("No listings found in Firestore. Seeding default properties...");
      for (const listing of PRE_SEEDED_LISTINGS) {
        await setDoc(doc(db, collectionPath, listing.id), listing);
      }
      console.log("Database seeded successfully!");
    }
  } catch (err) {
    console.warn("Could not seed database (probably permissions or offline), using memory listings instead:", err);
  }
}

// LocalStorage helpers for robust offline and permission fallbacks
function getLocalListingsOnly(): PropertyListing[] {
  try {
    const stored = localStorage.getItem('local_listings');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalListingsOnly(listings: PropertyListing[]) {
  try {
    localStorage.setItem('local_listings', JSON.stringify(listings));
  } catch (e) {
    console.error('Failed to write listings to localStorage:', e);
  }
}

function getLocalListingsWithFallback(): PropertyListing[] {
  const userAdded = getLocalListingsOnly();
  const merged = [...PRE_SEEDED_LISTINGS];
  for (const l of userAdded) {
    if (!merged.some(m => m.id === l.id)) {
      merged.push(l);
    }
  }
  return merged;
}

const PRE_SEEDED_BOOKINGS: Booking[] = [
  {
    id: "booking_pre_1",
    listingId: "listing_1",
    listingTitle: "Minimalist Ocean View Villa",
    listingImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    listingLocation: "Malibu, California",
    renterId: "yosefmelaku9876@gmail.com",
    renterName: "Yosef Melaku",
    startDate: "2026-07-10",
    endDate: "2026-07-15",
    totalPrice: 2250,
    nights: 5,
    status: "approved",
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "booking_pre_2",
    listingId: "listing_2",
    listingTitle: "Industrial Loft in Historic Center",
    listingImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    listingLocation: "SoHo, New York",
    renterId: "yosefmelaku9876@gmail.com",
    renterName: "Yosef Melaku",
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    totalPrice: 660,
    nights: 3,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const PRE_SEEDED_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay_pre_1",
    bookingId: "booking_pre_1",
    renterId: "yosefmelaku9876@gmail.com",
    amount: 2250,
    transactionId: "TXN_PRESEED_9876",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "success",
    cardholderName: "Yosef Melaku",
    cardNumberMasked: "•••• •••• •••• 4321"
  }
];

function getLocalBookingsOnly(): Booking[] {
  try {
    const stored = localStorage.getItem('local_bookings');
    if (!stored) {
      localStorage.setItem('local_bookings', JSON.stringify(PRE_SEEDED_BOOKINGS));
      return PRE_SEEDED_BOOKINGS;
    }
    return JSON.parse(stored);
  } catch (e) {
    return PRE_SEEDED_BOOKINGS;
  }
}

function saveLocalBookingsOnly(bookings: Booking[]) {
  try {
    localStorage.setItem('local_bookings', JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to write bookings to localStorage:', e);
  }
}

function getLocalPaymentsOnly(): PaymentRecord[] {
  try {
    const stored = localStorage.getItem('local_payments');
    if (!stored) {
      localStorage.setItem('local_payments', JSON.stringify(PRE_SEEDED_PAYMENTS));
      return PRE_SEEDED_PAYMENTS;
    }
    return JSON.parse(stored);
  } catch (e) {
    return PRE_SEEDED_PAYMENTS;
  }
}

function saveLocalPaymentsOnly(payments: PaymentRecord[]) {
  try {
    localStorage.setItem('local_payments', JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to write payments to localStorage:', e);
  }
}

// Listing operations
export async function getAllListings(): Promise<PropertyListing[]> {
  const collectionPath = 'listings';
  try {
    await seedDatabaseIfEmpty();
    const querySnapshot = await getDocs(collection(db, collectionPath));
    if (querySnapshot.empty) {
      return getLocalListingsWithFallback();
    }
    const listings: PropertyListing[] = [];
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() } as PropertyListing);
    });
    // Merge any locally added listings that are only in localStorage
    const localList = getLocalListingsOnly();
    const merged = [...listings];
    for (const l of localList) {
      if (!merged.some(m => m.id === l.id)) {
        merged.push(l);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Firestore fetch failed, falling back to local storage listings:", err);
    return getLocalListingsWithFallback();
  }
}

export async function createListing(listing: Omit<PropertyListing, 'id' | 'rating' | 'reviewsCount'>): Promise<PropertyListing> {
  const collectionPath = 'listings';
  const listingId = "listing_" + Date.now();
  const newListing: PropertyListing = {
    ...listing,
    id: listingId,
    rating: 5.0,
    reviewsCount: 0
  };
  try {
    await setDoc(doc(db, collectionPath, listingId), newListing);
    // Also save locally as backup
    const localList = getLocalListingsOnly();
    localList.push(newListing);
    saveLocalListingsOnly(localList);
    return newListing;
  } catch (err) {
    console.warn("Firestore write failed, saving to localStorage as fallback:", err);
    const localList = getLocalListingsOnly();
    localList.push(newListing);
    saveLocalListingsOnly(localList);
    return newListing;
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  const collectionPath = 'listings';
  try {
    await deleteDoc(doc(db, collectionPath, listingId));
  } catch (err) {
    console.warn("Firestore delete failed, deleting from localStorage instead:", err);
  }
  // Always delete from local storage to keep in sync
  const localList = getLocalListingsOnly();
  const filtered = localList.filter(l => l.id !== listingId);
  saveLocalListingsOnly(filtered);
}

// Booking operations
export async function getBookingsByRenter(renterId: string): Promise<Booking[]> {
  const collectionPath = 'bookings';
  try {
    const q = query(collection(db, collectionPath), where('renterId', '==', renterId));
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    // Merge local bookings
    const localBookings = getLocalBookingsOnly().filter(b => b.renterId === renterId);
    const merged = [...bookings];
    for (const b of localBookings) {
      if (!merged.some(m => m.id === b.id)) {
        merged.push(b);
      }
    }
    return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.warn("Firestore bookings fetch failed, falling back to local storage bookings:", err);
    return getLocalBookingsOnly()
      .filter(b => b.renterId === renterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getBookingsByOwner(ownerId: string): Promise<Booking[]> {
  const collectionPath = 'bookings';
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    // Merge local bookings
    const localBookings = getLocalBookingsOnly();
    const merged = [...bookings];
    for (const b of localBookings) {
      if (!merged.some(m => m.id === b.id)) {
        merged.push(b);
      }
    }
    // Find listings owned by this owner
    const ownerListings = await getAllListings();
    const ownerListingIds = new Set(ownerListings.filter(l => l.ownerId === ownerId).map(l => l.id));
    
    return merged
      .filter(b => ownerListingIds.has(b.listingId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.warn("Firestore owner bookings fetch failed, falling back to local storage bookings:", err);
    const localBookings = getLocalBookingsOnly();
    const ownerListings = getLocalListingsWithFallback();
    const ownerListingIds = new Set(ownerListings.filter(l => l.ownerId === ownerId).map(l => l.id));
    return localBookings
      .filter(b => ownerListingIds.has(b.listingId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  const collectionPath = 'bookings';
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    const localBookings = getLocalBookingsOnly();
    const merged = [...bookings];
    for (const b of localBookings) {
      if (!merged.some(m => m.id === b.id)) {
        merged.push(b);
      }
    }

    return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.warn('Firestore all-bookings fetch failed, falling back to local storage bookings:', err);
    return getLocalBookingsOnly().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'paymentStatus'>): Promise<Booking> {
  const collectionPath = 'bookings';
  const bookingId = "booking_" + Date.now();
  const newBooking: Booking = {
    ...booking,
    id: bookingId,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, collectionPath, bookingId), newBooking);
    // Save to local storage as well
    const localBookings = getLocalBookingsOnly();
    localBookings.push(newBooking);
    saveLocalBookingsOnly(localBookings);
    return newBooking;
  } catch (err) {
    console.warn("Firestore write booking failed, saving to localStorage:", err);
    const localBookings = getLocalBookingsOnly();
    localBookings.push(newBooking);
    saveLocalBookingsOnly(localBookings);
    return newBooking;
  }
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  const collectionPath = 'bookings';
  try {
    await updateDoc(doc(db, collectionPath, bookingId), { status });
  } catch (err) {
    console.warn("Firestore updateBookingStatus failed, updating local storage:", err);
  }
  // Always update in local storage to keep in sync
  const localBookings = getLocalBookingsOnly();
  const updated = localBookings.map(b => b.id === bookingId ? { ...b, status } : b);
  saveLocalBookingsOnly(updated);
}

export async function updateBookingPaymentStatus(bookingId: string, paymentStatus: Booking['paymentStatus']): Promise<void> {
  const collectionPath = 'bookings';
  try {
    await updateDoc(doc(db, collectionPath, bookingId), { paymentStatus, status: 'approved' });
  } catch (err) {
    console.warn("Firestore updateBookingPaymentStatus failed, updating local storage:", err);
  }
  // Always update in local storage to keep in sync
  const localBookings = getLocalBookingsOnly();
  const updated = localBookings.map(b => b.id === bookingId ? { ...b, paymentStatus, status: 'approved' as const } : b);
  saveLocalBookingsOnly(updated);
}

// Payment operations
export async function createPaymentRecord(payment: Omit<PaymentRecord, 'id' | 'transactionId' | 'timestamp' | 'status'>): Promise<PaymentRecord> {
  const collectionPath = 'payments';
  const paymentId = "pay_" + Date.now();
  const newPayment: PaymentRecord = {
    ...payment,
    id: paymentId,
    transactionId: "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    timestamp: new Date().toISOString(),
    status: 'success'
  };
  try {
    await setDoc(doc(db, collectionPath, paymentId), newPayment);
    // Save to local storage as well
    const localPayments = getLocalPaymentsOnly();
    localPayments.push(newPayment);
    saveLocalPaymentsOnly(localPayments);
    // Automatically update associated booking's payment status to paid!
    await updateBookingPaymentStatus(payment.bookingId, 'paid');
    return newPayment;
  } catch (err) {
    console.warn("Firestore write payment failed, saving to localStorage:", err);
    const localPayments = getLocalPaymentsOnly();
    localPayments.push(newPayment);
    saveLocalPaymentsOnly(localPayments);
    // Automatically update associated booking's payment status to paid!
    await updateBookingPaymentStatus(payment.bookingId, 'paid');
    return newPayment;
  }
}

export async function getPaymentsByRenter(renterId: string): Promise<PaymentRecord[]> {
  const collectionPath = 'payments';
  try {
    const q = query(collection(db, collectionPath), where('renterId', '==', renterId));
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() } as PaymentRecord);
    });
    // Merge local payments
    const localPayments = getLocalPaymentsOnly().filter(p => p.renterId === renterId);
    const merged = [...payments];
    for (const p of localPayments) {
      if (!merged.some(m => m.id === p.id)) {
        merged.push(p);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Firestore payments fetch failed, falling back to local storage payments:", err);
    return getLocalPaymentsOnly().filter(p => p.renterId === renterId);
  }
}
