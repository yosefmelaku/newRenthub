import React, { useState, useMemo, useRef } from 'react';
import {
  Search, Home, Sparkles, Building2, BedDouble,
  SlidersHorizontal, ChevronDown, MapPin, Bed, Bath,
  SquareStack, Star, Tag, CheckCircle2, X, ArrowRight,
  ShieldCheck, Zap, TrendingUp, Landmark, Phone,
  BadgeCheck, Ruler,
} from 'lucide-react';
import type { PropertyListing } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Category type — includes realestate
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'all' | 'house' | 'villa' | 'office' | 'studio' | 'realestate';
type Availability = 'all' | 'available' | 'rented';
type BudgetKey = 'all' | 'u1k' | 'u3k' | 'u6k' | 'u10k' | 'u20k';

// ─────────────────────────────────────────────────────────────────────────────
// Filter chip definitions
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all',        label: 'All Spaces',      icon: <SquareStack className="h-4 w-4" />, color: 'emerald' },
  { id: 'house',      label: 'Houses',          icon: <Home        className="h-4 w-4" />, color: 'blue'    },
  { id: 'villa',      label: 'Luxury Villas',   icon: <Sparkles    className="h-4 w-4" />, color: 'purple'  },
  { id: 'office',     label: 'Offices',         icon: <Building2   className="h-4 w-4" />, color: 'amber'   },
  { id: 'studio',     label: 'Studios',         icon: <BedDouble   className="h-4 w-4" />, color: 'rose'    },
  { id: 'realestate', label: 'Real Estate',     icon: <Landmark    className="h-4 w-4" />, color: 'indigo'  },
];

const BUDGET_OPTIONS: { key: BudgetKey; label: string; max: number }[] = [
  { key: 'all',   label: 'Any Budget',      max: Infinity },
  { key: 'u1k',   label: 'Under $1,000',    max: 1000 },
  { key: 'u3k',   label: 'Under $3,000',    max: 3000 },
  { key: 'u6k',   label: 'Under $6,000',    max: 6000 },
  { key: 'u10k',  label: 'Under $10,000',   max: 10000 },
  { key: 'u20k',  label: 'Under $20,000',   max: 20000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Local fallback mock listings — shown when API returns nothing
// Includes one of every category so all filter chips are demonstrable
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_LISTINGS: PropertyListing[] = [
  {
    id: 'mock-villa-1',
    title: 'Horizon Luxury Villa — Sunset Ridge',
    description: 'Expansive 5-bedroom villa with private pool, panoramic mountain views, and fully landscaped garden.',
    location: 'Beverly Hills, California',
    price: 8500,
    type: 'villa',
    beds: 5, baths: 4,
    image: '/villa.png',
    amenities: ['Pool', 'Gym', 'Parking', 'Garden', 'Security'],
    rating: 4.97, reviewsCount: 42,
    ownerId: 'owner-seed-1', featured: true,
  },
  {
    id: 'mock-office-1',
    title: 'Skyline Corporate Office Suite 12B',
    description: 'Premium open-plan commercial office in the heart of downtown. 3 meeting rooms, high-speed fibre, 24/7 access.',
    location: 'Downtown Chicago, Illinois',
    price: 4200,
    type: 'office',
    beds: 0, baths: 2,
    image: '/office.png',
    amenities: ['WiFi', 'Meeting Rooms', 'Parking', 'Security', 'Reception'],
    rating: 4.80, reviewsCount: 18,
    ownerId: 'owner-seed-2', featured: false,
  },
  {
    id: 'mock-studio-1',
    title: 'Midtown Studio Loft — Unit 7C',
    description: 'Modern fully-furnished studio with all utilities included. Shared laundry and rooftop terrace access.',
    location: 'Midtown Manhattan, New York',
    price: 1950,
    type: 'studio',
    beds: 1, baths: 1,
    image: '/apartment.png',
    amenities: ['Furnished', 'Utilities Included', 'Laundry', 'Rooftop'],
    rating: 4.72, reviewsCount: 31,
    ownerId: 'owner-seed-3', featured: true,
  },
  {
    id: 'mock-house-1',
    title: 'Maple Grove Family Home',
    description: '4-bedroom detached house in a quiet residential neighbourhood. Large garden, double garage, and top-rated school district.',
    location: 'Austin, Texas',
    price: 3200,
    type: 'house',
    beds: 4, baths: 3,
    image: '/villa.png',
    amenities: ['Garden', 'Garage', 'Pet Friendly', 'Air Conditioning'],
    rating: 4.85, reviewsCount: 27,
    ownerId: 'owner-seed-4', featured: false,
  },
  {
    id: 'mock-realestate-1',
    title: 'Prestige Tower — Floor 18 Commercial Unit',
    description: 'Grade-A commercial real estate floor. Ideal for corporate HQ or investment. 2,400 sqm, full fitout available, panoramic city views.',
    location: 'Dubai Marina, UAE',
    price: 18500,
    type: 'realestate',
    beds: 0, baths: 4,
    image: '/office.png',
    amenities: ['Lobby Concierge', 'Parking x6', 'Server Room', 'Boardroom', 'Fit-out Available'],
    rating: 4.95, reviewsCount: 9,
    ownerId: 'owner-seed-5', featured: true,
  },
  {
    id: 'mock-realestate-2',
    title: 'Greenfield Business Park — Unit B3',
    description: 'Mixed-use commercial real estate park. Retail ground floor with 3 upper residential floors. Strong rental yield asset.',
    location: 'Canary Wharf, London',
    price: 12000,
    type: 'realestate',
    beds: 2, baths: 3,
    image: '/apartment.png',
    amenities: ['Loading Bay', 'CCTV', 'On-site Management', 'EV Charging', 'Green Roof'],
    rating: 4.88, reviewsCount: 14,
    ownerId: 'owner-seed-6', featured: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const sqftFromBeds = (beds: number) => (beds > 0 ? beds * 450 + 600 : 2400);
const isBundleEligible = (p: PropertyListing) => !!p.featured;
const isRealEstate = (p: PropertyListing) => p.type === 'realestate';

// Type badge styles per category
const TYPE_BADGE: Record<string, string> = {
  house:      'bg-blue-50   text-blue-700   border-blue-200',
  villa:      'bg-purple-50 text-purple-700 border-purple-200',
  office:     'bg-amber-50  text-amber-700  border-amber-200',
  studio:     'bg-rose-50   text-rose-700   border-rose-200',
  realestate: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  apartment:  'bg-sky-50    text-sky-700    border-sky-200',
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    house: 'House', villa: 'Villa', office: 'Office',
    studio: 'Studio', realestate: 'Real Estate', apartment: 'Apartment',
  };
  return map[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
};

// ─────────────────────────────────────────────────────────────────────────────
// Category filter chip
// ─────────────────────────────────────────────────────────────────────────────

const CategoryPill: React.FC<{
  item: (typeof CATEGORIES)[number];
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => {
  const activeMap: Record<string, string> = {
    emerald: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 border-emerald-600',
    blue:    'bg-blue-600    text-white shadow-sm shadow-blue-200    border-blue-600',
    purple:  'bg-purple-600  text-white shadow-sm shadow-purple-200  border-purple-600',
    amber:   'bg-amber-500   text-white shadow-sm shadow-amber-200   border-amber-500',
    rose:    'bg-rose-600    text-white shadow-sm shadow-rose-200    border-rose-600',
    indigo:  'bg-indigo-600  text-white shadow-sm shadow-indigo-200  border-indigo-600',
  };
  const hoverMap: Record<string, string> = {
    emerald: 'hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50',
    blue:    'hover:border-blue-300    hover:text-blue-700    hover:bg-blue-50',
    purple:  'hover:border-purple-300  hover:text-purple-700  hover:bg-purple-50',
    amber:   'hover:border-amber-300   hover:text-amber-700   hover:bg-amber-50',
    rose:    'hover:border-rose-300    hover:text-rose-700    hover:bg-rose-50',
    indigo:  'hover:border-indigo-300  hover:text-indigo-700  hover:bg-indigo-50',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold
        transition-all duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
        ${active
          ? activeMap[item.color]
          : `bg-white text-slate-600 border-slate-200 ${hoverMap[item.color]}`
        }`}
    >
      {item.icon}
      {item.label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter dropdown
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string; value: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}

const FilterDropdown: React.FC<DropdownProps> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.key === value)?.label ?? label;

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold
          transition-all whitespace-nowrap bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
          ${value !== 'all' ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {selected}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-48 overflow-hidden">
          {options.map(o => (
            <button key={o.key} onClick={() => { onChange(o.key); setOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors
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
// Real Estate agency badge strip (shown only on realestate cards)
// ─────────────────────────────────────────────────────────────────────────────

const AgencyBadge: React.FC = () => (
  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
    <BadgeCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-indigo-800 leading-none">Verified Agency Listing</p>
      <p className="text-[10px] text-indigo-500 mt-0.5 truncate">Direct agent contact available</p>
    </div>
    <button className="shrink-0 inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition">
      <Phone className="h-2.5 w-2.5" /> Contact
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Property card
// ─────────────────────────────────────────────────────────────────────────────

interface RentalCardProps {
  property: PropertyListing;
  onApply: (p: PropertyListing) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ property, onApply }) => {
  const bundle      = isBundleEligible(property);
  const isRE        = isRealEstate(property);
  const sqft        = sqftFromBeds(property.beds);
  const badgeCls    = TYPE_BADGE[property.type] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  const label       = typeLabel(property.type);

  return (
    <article className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">

      {/* ── Cover image ── */}
      <div className="relative overflow-hidden bg-slate-100 shrink-0" style={{ aspectRatio: isRE ? '16/9' : '4/3' }}>
        <img src={property.image} alt={property.title} referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />

        {/* Available badge */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Available Now
        </span>

        {/* Type badge */}
        <span className={`absolute top-3 right-3 inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-white/95 backdrop-blur-sm ${badgeCls}`}>
          {CATEGORIES.find(c => c.id === property.type)?.icon ?? <SquareStack className="h-3 w-3" />}
          {label}
        </span>

        {/* Real estate: large sqm banner across bottom */}
        {isRE && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-900/80 to-transparent px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white text-xs font-bold">
                <Ruler className="h-3.5 w-3.5 text-indigo-300" />
                {sqft.toLocaleString()} sqm total floor area
              </span>
              <span className="text-[10px] font-semibold text-indigo-200 bg-indigo-800/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Grade-A Commercial
              </span>
            </div>
          </div>
        )}

        {/* Rating */}
        {!isRE && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/75 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {property.rating.toFixed(1)}
            <span className="text-slate-300 font-normal">({property.reviewsCount})</span>
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-slate-400 font-medium -mb-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.location}</span>
        </p>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {property.title}
        </h3>

        {/* Real estate agency badge strip */}
        {isRE && <AgencyBadge />}

        {/* Bundle discount notice */}
        {bundle && !isRE && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-emerald-700 leading-snug">
              Bundle Discount Eligible — Rent 2+ units for{' '}
              <span className="font-extrabold">15% off</span>
            </p>
          </div>
        )}

        {/* Amenities strip for real estate */}
        {isRE && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map(a => (
              <span key={a} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {a}
              </span>
            ))}
            {property.amenities.length > 4 && (
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                +{property.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Specs row (hidden for RE — they have sqm in image overlay) */}
        {!isRE && (
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium border-t border-slate-50 pt-3">
            {property.beds > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-slate-400" />
                  {property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}
                </span>
                <span className="w-px h-3.5 bg-slate-200" />
              </>
            )}
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-slate-400" />
              {property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}
            </span>
            <span className="w-px h-3.5 bg-slate-200" />
            <span className="flex items-center gap-1">
              <SquareStack className="h-3.5 w-3.5 text-slate-400" />
              {sqft.toLocaleString()} sqft
            </span>
          </div>
        )}

        {/* Rating row for RE */}
        {isRE && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-50 pt-3">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-700">{property.rating.toFixed(1)}</span>
            <span className="text-slate-400">({property.reviewsCount} verified reviews)</span>
          </div>
        )}

        {/* Pricing + CTA */}
        <div className="flex items-center justify-between pt-1 mt-auto gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900">${property.price.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-medium">/ mo</span>
            </div>
            {isRE && (
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Commercial lease terms apply</p>
            )}
          </div>

          <button onClick={() => onApply(property)}
            className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl
              transition-colors shadow-sm focus:outline-none focus-visible:ring-2 shrink-0
              ${isRE
                ? 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500'
              }`}
          >
            {isRE ? 'Request Viewing' : 'Apply to Rent'}
            <ArrowRight className="h-3.5 w-3.5" />
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
  const [category,     setCategory]     = useState<Category>('all');
  const [budget,       setBudget]       = useState<BudgetKey>('all');
  const [availability, setAvailability] = useState<Availability>('all');

  // Use live API listings; fall back to mock data when the API returns nothing
  const source = listings.length > 0 ? listings : MOCK_LISTINGS;

  const activeFilterCount = [
    category !== 'all',
    budget !== 'all',
    availability !== 'all',
    searchTerm.trim() !== '',
  ].filter(Boolean).length;

  const clearAll = () => {
    setCategory('all');
    setBudget('all');
    setAvailability('all');
    onSearchTermChange('');
  };

  const budgetMax = BUDGET_OPTIONS.find(b => b.key === budget)?.max ?? Infinity;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return source.filter(p => {
      const matchSearch = !q || [p.title, p.location, p.description, ...(p.amenities ?? [])]
        .some(s => s.toLowerCase().includes(q));
      const matchCat    = category === 'all' || p.type === category;
      const matchBudget = p.price <= budgetMax;
      const matchAvail  = availability === 'all' || availability === 'available';
      return matchSearch && matchCat && matchBudget && matchAvail;
    });
  }, [source, searchTerm, category, budgetMax, availability]);

  const bundleCount   = filtered.filter(isBundleEligible).length;
  const realEstCount  = filtered.filter(isRealEstate).length;
  const usingFallback = listings.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/8 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Listings · Secure Applications · Agency Listings
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Browse Available Rentals
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Discover houses, villas, offices, studios, and premium real estate. Filter by budget, type, and availability — apply in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {[
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Verified Owners' },
              { icon: <Zap         className="h-3.5 w-3.5" />, label: 'Instant Applications' },
              { icon: <Landmark    className="h-3.5 w-3.5" />, label: 'Real Estate Agencies' },
              { icon: <TrendingUp  className="h-3.5 w-3.5" />, label: 'Bundle Discounts' },
            ].map(t => (
              <span key={t.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <span className="text-emerald-400">{t.icon}</span>{t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">

          {/* Row 1: search + dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={searchTerm} onChange={e => onSearchTermChange(e.target.value)}
                placeholder="Search houses, offices, studios, cities, or agencies..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition" />
              {searchTerm && (
                <button onClick={() => onSearchTermChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterDropdown label="Budget Range" value={budget}
                options={BUDGET_OPTIONS.map(o => ({ key: o.key, label: o.label }))}
                onChange={v => setBudget(v as BudgetKey)} />
              <FilterDropdown label="Availability" value={availability}
                options={[
                  { key: 'all',       label: 'All Statuses' },
                  { key: 'available', label: 'Available Now' },
                  { key: 'rented',    label: 'Rented / Unavailable' },
                ]}
                onChange={v => setAvailability(v as Availability)} />
              {activeFilterCount > 0 && (
                <button onClick={clearAll}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition">
                  <X className="h-3 w-3" /> Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Row 2: category chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <CategoryPill key={cat.id} item={cat} active={category === cat.id}
                onClick={() => setCategory(cat.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {filtered.length === 0
              ? 'No listings match your filters'
              : `${filtered.length} ${filtered.length === 1 ? 'Property' : 'Properties'} Available`}
          </h2>
          <div className="flex flex-wrap gap-3 mt-1">
            {bundleCount > 0 && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {bundleCount} listing{bundleCount > 1 ? 's' : ''} with Bundle Discount
              </p>
            )}
            {realEstCount > 0 && (
              <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                <Landmark className="h-3 w-3" />
                {realEstCount} Real Estate listing{realEstCount > 1 ? 's' : ''} available
              </p>
            )}
            {usingFallback && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                ⚡ Showing sample listings — connect the backend for live data
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono">Sort: Recommended</p>
      </div>

      {/* ── Property grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filtered.map(p => (
              <RentalCard key={p.id} property={p} onApply={onSelectProperty} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No properties found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Try adjusting your filters or broadening your search to see more available rentals.
              </p>
            </div>
            <button onClick={clearAll}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm">
              <X className="h-4 w-4" /> Reset All Filters
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
