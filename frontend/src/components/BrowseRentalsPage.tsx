import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Home, Sparkles, Building2, BedDouble,
  SlidersHorizontal, ChevronDown, MapPin, Bed, Bath,
  SquareStack, Star, Tag, CheckCircle2, X, ArrowRight,
  ShieldCheck, Landmark, Phone, BadgeCheck, Ruler, Clock,
} from 'lucide-react';
import type { PropertyListing } from '../types';
import { loadOwnerListings, applyAvailabilityToListings } from '../lib/ownerProperties';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback mock listings — used only when BOTH API and localStorage are empty
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_LISTINGS: PropertyListing[] = [
  {
    id: 'mock-villa-1',
    title: 'Horizon Luxury Villa — Sunset Ridge',
    description: 'Expansive 5-bedroom villa with private pool and panoramic mountain views.',
    location: 'Beverly Hills, California',
    price: 8500, type: 'villa', beds: 5, baths: 4,
    image: '/villa.png',
    amenities: ['Pool', 'Gym', 'Parking', 'Garden', 'Security'],
    rating: 4.97, reviewsCount: 42, ownerId: 'seed-1', featured: true,
  },
  {
    id: 'mock-office-1',
    title: 'Skyline Corporate Office Suite 12B',
    description: 'Premium open-plan commercial office in downtown. 3 meeting rooms, 24/7 access.',
    location: 'Downtown Chicago, Illinois',
    price: 4200, type: 'office', beds: 0, baths: 2,
    image: '/office.png',
    amenities: ['WiFi', 'Meeting Rooms', 'Parking', 'Security'],
    rating: 4.80, reviewsCount: 18, ownerId: 'seed-2', featured: false,
  },
  {
    id: 'mock-studio-1',
    title: 'Midtown Studio Loft — Unit 7C',
    description: 'Modern furnished studio with all utilities included and rooftop access.',
    location: 'Midtown Manhattan, New York',
    price: 1950, type: 'studio', beds: 1, baths: 1,
    image: '/apartment.png',
    amenities: ['Furnished', 'Utilities', 'Laundry', 'Rooftop'],
    rating: 4.72, reviewsCount: 31, ownerId: 'seed-3', featured: true,
  },
  {
    id: 'mock-house-1',
    title: 'Maple Grove Family Home',
    description: '4-bedroom house with large garden, double garage, top school district.',
    location: 'Austin, Texas',
    price: 3200, type: 'house', beds: 4, baths: 3,
    image: '/villa.png',
    amenities: ['Garden', 'Garage', 'Pet Friendly', 'AC'],
    rating: 4.85, reviewsCount: 27, ownerId: 'seed-4', featured: false,
  },
  {
    id: 'mock-re-1',
    title: 'Prestige Tower — Floor 18 Commercial Unit',
    description: 'Grade-A commercial floor, 2,400 sqm. Ideal for corporate HQ.',
    location: 'Dubai Marina, UAE',
    price: 18500, type: 'realestate', beds: 0, baths: 4,
    image: '/office.png',
    amenities: ['Concierge', 'Parking x6', 'Server Room', 'Boardroom'],
    rating: 4.95, reviewsCount: 9, ownerId: 'seed-5', featured: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'all' | 'house' | 'villa' | 'office' | 'studio' | 'realestate';
type BudgetKey = 'all' | 'u1k' | 'u3k' | 'u6k' | 'u10k' | 'u20k';

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; activeCls: string; hoverCls: string }[] = [
  { id: 'all',        label: 'All Spaces',    icon: <SquareStack className="h-4 w-4" />, activeCls: 'bg-slate-800 text-white border-slate-800',   hoverCls: 'hover:bg-slate-50 hover:text-slate-900' },
  { id: 'house',      label: 'Houses',        icon: <Home        className="h-4 w-4" />, activeCls: 'bg-blue-600 text-white border-blue-600',      hoverCls: 'hover:bg-blue-50 hover:text-blue-700' },
  { id: 'villa',      label: 'Villas',        icon: <Sparkles    className="h-4 w-4" />, activeCls: 'bg-purple-600 text-white border-purple-600',  hoverCls: 'hover:bg-purple-50 hover:text-purple-700' },
  { id: 'office',     label: 'Offices',       icon: <Building2   className="h-4 w-4" />, activeCls: 'bg-amber-500 text-white border-amber-500',    hoverCls: 'hover:bg-amber-50 hover:text-amber-700' },
  { id: 'studio',     label: 'Studios',       icon: <BedDouble   className="h-4 w-4" />, activeCls: 'bg-rose-600 text-white border-rose-600',      hoverCls: 'hover:bg-rose-50 hover:text-rose-700' },
  { id: 'realestate', label: 'Real Estate',   icon: <Landmark    className="h-4 w-4" />, activeCls: 'bg-indigo-600 text-white border-indigo-600',  hoverCls: 'hover:bg-indigo-50 hover:text-indigo-700' },
];

const BUDGET_OPTIONS: { key: BudgetKey; label: string; max: number }[] = [
  { key: 'all',  label: 'Any Budget',    max: Infinity },
  { key: 'u1k',  label: 'Under $1,000',  max: 1000 },
  { key: 'u3k',  label: 'Under $3,000',  max: 3000 },
  { key: 'u6k',  label: 'Under $6,000',  max: 6000 },
  { key: 'u10k', label: 'Under $10,000', max: 10000 },
  { key: 'u20k', label: 'Under $20,000', max: 20000 },
];

const TYPE_BADGE: Record<string, string> = {
  house: 'bg-blue-50 text-blue-700 border-blue-200',
  villa: 'bg-purple-50 text-purple-700 border-purple-200',
  office: 'bg-amber-50 text-amber-700 border-amber-200',
  studio: 'bg-rose-50 text-rose-700 border-rose-200',
  realestate: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  apartment: 'bg-sky-50 text-sky-700 border-sky-200',
};

const typeLabel = (t: string) =>
  ({ house: 'House', villa: 'Villa', office: 'Office', studio: 'Studio', realestate: 'Real Estate', apartment: 'Apartment' }[t]
    ?? t.charAt(0).toUpperCase() + t.slice(1));

const sqftFromBeds = (beds: number) => (beds > 0 ? beds * 450 + 600 : 2400);
const isBundleEligible = (p: PropertyListing) => !!p.featured;
const isRealEstate = (p: PropertyListing) => p.type === 'realestate';
const isOffice = (p: PropertyListing) => p.type === 'office';
const getAvailability = (p: PropertyListing) => p.availabilityStatus ?? 'available';

const AVAILABILITY_BADGE: Record<string, { label: string; cls: string; pulse?: boolean }> = {
  available: { label: 'Available Now', cls: 'bg-emerald-500 text-white', pulse: true },
  applied:   { label: 'Application Pending', cls: 'bg-amber-500 text-white' },
  rented:    { label: 'Rented', cls: 'bg-slate-600 text-white' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Budget dropdown
// ─────────────────────────────────────────────────────────────────────────────

const BudgetDropdown: React.FC<{ value: BudgetKey; onChange: (v: BudgetKey) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = BUDGET_OPTIONS.find(o => o.key === value)?.label ?? 'Budget';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition whitespace-nowrap bg-white
          ${value !== 'all' ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-44">
          {BUDGET_OPTIONS.map(o => (
            <button key={o.key} onClick={() => { onChange(o.key as BudgetKey); setOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition
                ${o.key === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              {o.label}
              {o.key === value && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Agency badge (real estate only)
// ─────────────────────────────────────────────────────────────────────────────

const AgencyBadge: React.FC = () => (
  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
    <BadgeCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-indigo-800">Verified Agency Listing</p>
      <p className="text-[10px] text-indigo-500">Direct agent contact available</p>
    </div>
    <button className="shrink-0 inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition">
      <Phone className="h-2.5 w-2.5" /> Contact
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Property card
// ─────────────────────────────────────────────────────────────────────────────

const RentalCard: React.FC<{ property: PropertyListing; onApply: (p: PropertyListing) => void }> = ({ property, onApply }) => {
  const isRE   = isRealEstate(property);
  const isOff  = isOffice(property);
  const bundle = isBundleEligible(property);
  const sqft   = property.officeSqm && property.officeSqm > 0 ? property.officeSqm : sqftFromBeds(property.beds);
  const badge  = TYPE_BADGE[property.type] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  const catIcon = CATEGORIES.find(c => c.id === property.type)?.icon ?? <SquareStack className="h-3 w-3" />;
  const availability = getAvailability(property);
  const availBadge = AVAILABILITY_BADGE[availability];
  const canApply = availability === 'available';

  return (
    <article className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <div className="relative overflow-hidden bg-slate-100 shrink-0" style={{ aspectRatio: isRE ? '16/9' : '4/3' }}>
        <img src={property.image} alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy" referrerPolicy="no-referrer"
          onError={e => { (e.target as HTMLImageElement).src = '/villa.png'; }} />

        {/* Availability badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${availBadge.cls}`}>
          {availBadge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {!availBadge.pulse && availability === 'applied' && <Clock className="h-3 w-3" />}
          {availability === 'available' && (property.remainingUnits ?? 0) > 0 && (property.totalUnits ?? 1) > 1
            ? `${property.remainingUnits} room${property.remainingUnits === 1 ? '' : 's'} left`
            : availBadge.label}
        </span>

        {/* Type badge */}
        <span className={`absolute top-3 right-3 inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-white/95 backdrop-blur-sm ${badge}`}>
          {catIcon} {typeLabel(property.type)}
        </span>

        {/* RE sqm banner */}
        {isRE && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-900/80 to-transparent px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white text-xs font-bold">
                <Ruler className="h-3.5 w-3.5 text-indigo-300" /> {sqft.toLocaleString()} sqm
              </span>
              <span className="text-[10px] font-semibold text-indigo-200 bg-indigo-800/60 px-2 py-0.5 rounded-full border border-indigo-500/30">Grade-A</span>
            </div>
          </div>
        )}

        {/* Rating */}
        {!isRE && property.reviewsCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/75 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {property.rating.toFixed(1)}
            <span className="text-slate-300 font-normal">({property.reviewsCount})</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <p className="flex items-center gap-1 text-xs text-slate-400 font-medium -mb-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.location}</span>
        </p>

        <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {property.title}
        </h3>

        {isRE && <AgencyBadge />}

        {bundle && !isRE && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-emerald-700">
              Bundle Discount — Rent 2+ units for <span className="font-extrabold">15% off</span>
            </p>
          </div>
        )}

        {isRE && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map(a => (
              <span key={a} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}

        {!isRE && (
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
            {isOff ? (
              <>
                <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-slate-400" /> {property.officeSqm ?? sqft} sqm</span>
                <span className="w-px h-3.5 bg-slate-200" />
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {property.meetingRooms ?? 0} rooms</span>
                <span className="w-px h-3.5 bg-slate-200" />
                <span className="flex items-center gap-1"><SquareStack className="h-3.5 w-3.5 text-slate-400" /> {property.parkingSpaces ?? 0} parking</span>
              </>
            ) : (
              <>
                {property.beds > 0 && <>
                  <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-slate-400" /> {property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</span>
                  <span className="w-px h-3.5 bg-slate-200" />
                </>}
                <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" /> {property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</span>
                <span className="w-px h-3.5 bg-slate-200" />
                <span className="flex items-center gap-1"><SquareStack className="h-3.5 w-3.5 text-slate-400" /> {sqft.toLocaleString()} sqft</span>
              </>
            )}
          </div>
        )}

        {isRE && property.reviewsCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs border-t border-slate-100 pt-3">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-700">{property.rating.toFixed(1)}</span>
            <span className="text-slate-400">({property.reviewsCount} reviews)</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 mt-auto gap-2">
          <div>
            <span className="text-xl font-extrabold text-slate-900">${property.price.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium ml-1">/ mo</span>
            {isRE && <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Commercial lease</p>}
          </div>
          <button onClick={() => canApply && onApply(property)}
            disabled={!canApply}
            className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm shrink-0
              ${!canApply
                ? 'bg-slate-300 cursor-not-allowed'
                : isRE
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {!canApply
              ? (availability === 'applied' ? 'Applied' : 'Fully Rented')
              : (isRE ? 'Request Viewing' : 'Apply to Rent')}
            {canApply && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

interface BrowseRentalsPageProps {
  listings: PropertyListing[];
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  onSelectProperty: (p: PropertyListing) => void;
}

export const BrowseRentalsPage: React.FC<BrowseRentalsPageProps> = ({
  listings,
  searchTerm,
  onSearchTermChange,
  onSelectProperty,
}) => {
  const [category, setCategory] = useState<Category>('all');
  const [budget,   setBudget]   = useState<BudgetKey>('all');

  // Re-read owner localStorage listings on every render so new posts show up
  // immediately without a page reload.
  const [ownerListings, setOwnerListings] = useState<PropertyListing[]>(loadOwnerListings);

  // Poll localStorage every 2 seconds so posts from owner dashboard appear live
  useEffect(() => {
    const id = setInterval(() => setOwnerListings(loadOwnerListings()), 2000);
    return () => clearInterval(id);
  }, []);

  // Merge: API listings + owner local listings + fallback mocks
  // De-duplicate by id so nothing appears twice
  const source = useMemo(() => {
    const apiOrFallback = listings.length > 0 ? listings : MOCK_LISTINGS;
    const merged = [...apiOrFallback];
    ownerListings.forEach(op => {
      const idx = merged.findIndex(p => p.id === op.id);
      if (idx >= 0) merged[idx] = op;
      else merged.unshift(op);
    });
    return applyAvailabilityToListings(merged);
  }, [listings, ownerListings]);

  const clearAll = () => { setCategory('all'); setBudget('all'); onSearchTermChange(''); };

  const budgetMax = BUDGET_OPTIONS.find(b => b.key === budget)?.max ?? Infinity;
  const activeCount = [category !== 'all', budget !== 'all', searchTerm.trim() !== ''].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return source.filter(p => {
      const matchSearch = !q || [p.title, p.location, p.description, ...(p.amenities ?? [])].some(s => s.toLowerCase().includes(q));
      const matchCat    = category === 'all' || p.type === category;
      const matchBudget = p.price <= budgetMax;
      return matchSearch && matchCat && matchBudget;
    });
  }, [source, searchTerm, category, budgetMax]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── TOP FILTER BAR — no dark hero, filter chips right at the top ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

          {/* Row 1: page title + search + budget */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="shrink-0">
              <h1 className="text-xl font-extrabold text-slate-900">Browse Rentals</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
                {ownerListings.length > 0 && (
                  <span className="ml-2 text-emerald-600 font-semibold">· {ownerListings.length} owner-posted</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" value={searchTerm} onChange={e => onSearchTermChange(e.target.value)}
                  placeholder="Search title, city, type..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition" />
                {searchTerm && (
                  <button onClick={() => onSearchTermChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Budget */}
              <BudgetDropdown value={budget} onChange={setBudget} />

              {/* Clear */}
              {activeCount > 0 && (
                <button onClick={clearAll}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2.5 rounded-xl transition whitespace-nowrap">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Row 2: category chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold
                  transition-all whitespace-nowrap focus:outline-none
                  ${category === cat.id ? cat.activeCls : `bg-white text-slate-600 border-slate-200 ${cat.hoverCls}`}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Property grid — immediately visible, no scroll needed ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => (
              <RentalCard key={p.id} property={p} onApply={onSelectProperty} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No properties found</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Try adjusting your filters or broadening your search.
            </p>
            <button onClick={clearAll}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              <X className="h-4 w-4" /> Reset Filters
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
