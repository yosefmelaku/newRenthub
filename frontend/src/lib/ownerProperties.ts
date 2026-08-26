import type { PropertyListing } from '../types';

export type PropertyType = 'House' | 'Villa' | 'Office' | 'Studio';
export type PropertyStatus = 'available' | 'applied' | 'rented';

export interface OwnerProperty {
  id: string;
  title: string;
  type: PropertyType;
  city: string;
  subcity: string;
  address: string;
  monthlyRent: number;
  beds: number;
  baths: number;
  officeSqm: number;
  meetingRooms: number;
  parkingSpaces: number;
  imageUrl: string | null;
  tenantUnitCount: number;
  totalUnits: number;
  rentedUnits: number;
  status: PropertyStatus;
}

export const OWNER_STORAGE_KEY = 'renthub_owner_properties';
export const APPLIED_IDS_KEY = 'renthub_applied_property_ids';
export const OCCUPANCY_KEY = 'renthub_property_occupancy';

interface Occupancy {
  rented: number;
  total: number;
}

function loadOccupancy(): Record<string, Occupancy> {
  try {
    const raw = localStorage.getItem(OCCUPANCY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOccupancy(map: Record<string, Occupancy>) {
  try {
    localStorage.setItem(OCCUPANCY_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not persist occupancy:', e);
  }
}

function loadAppliedIds(): string[] {
  try {
    const raw = localStorage.getItem(APPLIED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAppliedIds(ids: string[]) {
  try {
    localStorage.setItem(APPLIED_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Could not persist applied property ids:', e);
  }
}

export function getAppliedPropertyIds(): Set<string> {
  return new Set(loadAppliedIds());
}

export const CITIES = ['Addis Ababa', 'Other'] as const;

export const ADDIS_ABABA_SUBCITIES = [
  'Bole',
  'Kirkos',
  'Yeka',
  'Arada',
  'Addis Ketema',
  'Lideta',
  'Gulele',
  'Kolfe Keranio',
  'Nifas Silk-Lafto',
  'Akaki Kality',
  'Lemi Kura',
] as const;

const SEED_PROPERTIES: OwnerProperty[] = [
  {
    id: 'seed-1',
    title: 'Sunrise Villa Block A',
    type: 'Villa',
    city: 'Other',
    subcity: '',
    address: '12 Hilltop Lane, Beverly Hills, CA',
    monthlyRent: 8500,
    beds: 4,
    baths: 3,
    officeSqm: 0,
    meetingRooms: 0,
    parkingSpaces: 0,
    imageUrl: '/villa.png',
    tenantUnitCount: 2,
    totalUnits: 4,
    rentedUnits: 0,
    status: 'available',
  },
  {
    id: 'seed-2',
    title: 'Downtown Office Suite 4B',
    type: 'Office',
    city: 'Other',
    subcity: '',
    address: '88 Commerce Blvd, Chicago, IL',
    monthlyRent: 4200,
    beds: 0,
    baths: 1,
    officeSqm: 120,
    meetingRooms: 2,
    parkingSpaces: 4,
    imageUrl: '/office.png',
    tenantUnitCount: 1,
    totalUnits: 1,
    rentedUnits: 0,
    status: 'available',
  },
  {
    id: 'seed-3',
    title: 'Garden Studio — Unit 7',
    type: 'Studio',
    city: 'Other',
    subcity: '',
    address: '9 Palm Street, Miami, FL',
    monthlyRent: 1800,
    beds: 1,
    baths: 1,
    officeSqm: 0,
    meetingRooms: 0,
    parkingSpaces: 0,
    imageUrl: null,
    tenantUnitCount: 3,
    totalUnits: 3,
    rentedUnits: 0,
    status: 'available',
  },
];

function normalizeProperty(raw: Partial<OwnerProperty> & { id: string }): OwnerProperty {
  const type = raw.type ?? 'House';
  const isOffice = type === 'Office';

  return {
    id: raw.id,
    title: raw.title ?? '',
    type,
    city: raw.city ?? 'Other',
    subcity: raw.subcity ?? '',
    address: raw.address ?? '',
    monthlyRent: Number(raw.monthlyRent) || 0,
    beds: isOffice ? 0 : Number(raw.beds) || (type === 'Studio' ? 1 : 2),
    baths: isOffice ? Number(raw.baths) || 1 : Number(raw.baths) || 1,
    officeSqm: isOffice ? Number(raw.officeSqm) || 0 : 0,
    meetingRooms: isOffice ? Number(raw.meetingRooms) || 0 : 0,
    parkingSpaces: isOffice ? Number(raw.parkingSpaces) || 0 : 0,
    imageUrl: raw.imageUrl ?? null,
    tenantUnitCount: Number(raw.tenantUnitCount) || Number(raw.totalUnits) || 1,
    totalUnits: Math.max(1, Number(raw.totalUnits) || Number(raw.tenantUnitCount) || 1),
    rentedUnits: Math.max(0, Number(raw.rentedUnits) || 0),
    status: raw.status ?? 'available',
  };
}

export function loadOwnerProperties(): OwnerProperty[] {
  try {
    const raw = localStorage.getItem(OWNER_STORAGE_KEY);
    if (!raw) return SEED_PROPERTIES;
    const parsed = JSON.parse(raw) as Partial<OwnerProperty>[];
    return parsed.map(p => normalizeProperty(p as Partial<OwnerProperty> & { id: string }));
  } catch {
    return SEED_PROPERTIES;
  }
}

export function saveOwnerProperties(list: OwnerProperty[]) {
  try {
    localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not persist properties to localStorage:', e);
  }
}

export function updateOwnerPropertyStatus(propertyId: string, status: PropertyStatus) {
  const list = loadOwnerProperties();
  const next = list.map(p => (p.id === propertyId ? { ...p, status } : p));
  saveOwnerProperties(next);
  return next;
}

export function markPropertyApplied(propertyId: string) {
  updateOwnerPropertyStatus(propertyId, 'applied');
  const ids = loadAppliedIds();
  if (!ids.includes(propertyId)) saveAppliedIds([...ids, propertyId]);
}

export function markPropertyAvailable(propertyId: string) {
  updateOwnerPropertyStatus(propertyId, 'available');
  saveAppliedIds(loadAppliedIds().filter(id => id !== propertyId));
}

function occupancyFor(propertyId: string, fallbackTotal = 1): Occupancy {
  const occ = loadOccupancy();
  const list = loadOwnerProperties();
  const owner = list.find(p => p.id === propertyId);
  const stored = occ[propertyId];
  const total = Math.max(1, stored?.total || owner?.totalUnits || fallbackTotal);
  const rented = stored?.rented ?? owner?.rentedUnits ?? 0;
  return { total, rented };
}

/** Call after a tenant successfully rents one unit/room. */
export function recordRental(propertyId: string, fallbackTotal = 1) {
  const list = loadOwnerProperties();
  const idx = list.findIndex(p => p.id === propertyId);
  const current = occupancyFor(propertyId, idx >= 0 ? list[idx].totalUnits : fallbackTotal);
  const rented = Math.min(current.total, current.rented + 1);
  const nextOcc = { total: current.total, rented };
  const occ = loadOccupancy();
  occ[propertyId] = nextOcc;
  saveOccupancy(occ);

  if (idx >= 0) {
    const full = rented >= current.total;
    list[idx] = {
      ...list[idx],
      rentedUnits: rented,
      totalUnits: current.total,
      status: full ? 'rented' : 'available',
    };
    saveOwnerProperties(list);
  }

  saveAppliedIds(loadAppliedIds().filter(id => id !== propertyId));
}

export function releaseRental(propertyId: string) {
  const current = occupancyFor(propertyId);
  const rented = Math.max(0, current.rented - 1);
  const occ = loadOccupancy();
  occ[propertyId] = { total: current.total, rented };
  saveOccupancy(occ);

  const list = loadOwnerProperties();
  const idx = list.findIndex(p => p.id === propertyId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      rentedUnits: rented,
      status: rented <= 0 ? 'available' : rented >= list[idx].totalUnits ? 'rented' : 'available',
    };
    saveOwnerProperties(list);
  }
  markPropertyAvailable(propertyId);
}

export function applyAvailabilityToListings(listings: PropertyListing[]): PropertyListing[] {
  const appliedIds = getAppliedPropertyIds();
  const occ = loadOccupancy();
  return listings.map(p => {
    const stored = occ[p.id];
    const total = Math.max(1, stored?.total ?? p.totalUnits ?? (p.beds > 0 ? p.beds : 1));
    const rented = stored?.rented ?? p.rentedUnits ?? 0;
    const remaining = Math.max(0, total - rented);
    const availabilityStatus: PropertyListing['availabilityStatus'] =
      remaining <= 0 ? 'rented' : appliedIds.has(p.id) ? 'applied' : 'available';
    return {
      ...p,
      totalUnits: total,
      rentedUnits: rented,
      remainingUnits: remaining,
      availabilityStatus,
    };
  });
}

function typeMap(t: PropertyType): PropertyListing['type'] {
  const m: Record<string, PropertyListing['type']> = {
    House: 'house',
    Villa: 'villa',
    Office: 'office',
    Studio: 'studio',
  };
  return m[t] ?? 'house';
}

function formatLocation(p: OwnerProperty): string {
  if (p.city === 'Addis Ababa' && p.subcity) {
    return `${p.subcity}, Addis Ababa, Ethiopia`;
  }
  return p.address;
}

function buildDescription(p: OwnerProperty): string {
  if (p.type === 'Office') {
    return `${p.type} space in ${formatLocation(p)} — ${p.officeSqm} sqm, ${p.meetingRooms} meeting room(s), ${p.parkingSpaces} parking space(s).`;
  }
  return `${p.type} with ${p.beds} bedroom(s) and ${p.baths} bathroom(s) in ${formatLocation(p)}.`;
}

export function ownerPropertyToListing(p: OwnerProperty): PropertyListing {
  return {
    id: p.id,
    title: p.title,
    description: buildDescription(p),
    location: formatLocation(p),
    price: p.monthlyRent,
    type: typeMap(p.type),
    beds: p.beds,
    baths: p.baths,
    image: p.imageUrl ?? '/villa.png',
    amenities: p.type === 'Office'
      ? [`${p.officeSqm} sqm`, `${p.meetingRooms} Meeting Rooms`, `${p.parkingSpaces} Parking`]
      : [],
    rating: 4.5,
    reviewsCount: 0,
    ownerId: 'local-owner',
    featured: p.tenantUnitCount > 1,
    availabilityStatus: p.rentedUnits >= p.totalUnits ? 'rented' : p.status,
    officeSqm: p.officeSqm,
    meetingRooms: p.meetingRooms,
    parkingSpaces: p.parkingSpaces,
    totalUnits: p.totalUnits,
    rentedUnits: p.rentedUnits,
    remainingUnits: Math.max(0, p.totalUnits - p.rentedUnits),
  };
}

export function loadOwnerListings(): PropertyListing[] {
  return applyAvailabilityToListings(loadOwnerProperties().map(ownerPropertyToListing));
}
