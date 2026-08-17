import React, { useState, useMemo, useRef } from 'react';
import {
  Search, Home, Sparkles, Building2, BedDouble,
  SlidersHorizontal, ChevronDown, MapPin, Bed, Bath,
  SquareStack, Star, Tag, CheckCircle2, X, ArrowRight,
  ShieldCheck, Zap, TrendingUp,
} from 'lucide-react';
import type { PropertyListing } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'all' | 'house' | 'villa' | 'office' | 'studio';
type Availability = 'all' | 'available' | 'rented';
type BudgetKey = 'all' | 'u1k' | 'u3k' | 'u6k' | 'u10k';

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all',    label: 'All Types', icon: <SquareStack className="h-4 w-4" /> },
  { id: 'house',  label: 'Houses',    icon: <Home        className="h-4 w-4" /> },
  { id: 'villa',  label: 'Villas',    icon: <Sparkles    className="h-4 w-4" /> },
  { id: 'office', label: 'Offices',   icon: <Building2   className="h-4 w-4" /> },
  { id: 'studio', label: 'Studios',   icon: <BedDouble   className="h-4 w-4" /> },
];

const BUDGET_OPTIONS: { key: BudgetKey; label: string; max: number }[] = [
  { key: 'all',   label: 'Any Budget',     max: Infinity },
  { key: 'u1k',   label: 'Under $1,000',   max: 1000 },
  { key: 'u3k',   label: 'Under $3,000',   max: 3000 },
  { key: 'u6k',   label: 'Under $6,000',   max: 6000 },
  { key: 'u10k',  label: 'Under $10,000',  max: 10000 },
];

// SQFt is not on PropertyListing — we derive a plausible value for display only
const sqftFromBeds = (beds: number) => beds * 450 + 600;

// A property is "bundle eligible" when its owner offers multi-unit discounts.
// We proxy this with `featured` flag — in production this would be a dedicated
// `bundle_eligible` boolean column returned from the API.
const isBundleEligible = (p: PropertyListing) => !!p.featured;

// ─────────────────────────────────────────────────────────────────────────────
// Category pill
// ─────────────────────────────────────────────────────────────────────────────

const CategoryPill: React.FC<{
  item: (typeof CATEGORIES)[number];
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
      text-sm font-semibold transition-all duration-150 whitespace-nowrap
      focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
      ${active
        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
      }
    `}
  >
    {item.icon}
    {item.label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown (Budget / Availability)
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}

const FilterDropdown: React.FC<DropdownProps> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.key === value)?.label ?? label;

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold
          transition-all duration-150 whitespace-nowrap bg-white
          focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
          ${value !== 'all'
            ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
            : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }
        `}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {selected}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-44 overflow-hidden">
          {options.map(o => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false); }}
              className={`
                flex items-center justify-between w-full px-4 py-2.5 text-sm text-left
                transition-colors
                ${o.key === value
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
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
// Rental card
// ─────────────────────────────────────────────────────────────────────────────

interface RentalCardProps {
  property: PropertyListing;
  onApply: (property: PropertyListing) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ property, onApply }) => {
  const bundle = isBundleEligible(property);
  const sqft   = sqftFromBeds(property.beds);

  const typeLabel = property.type.charAt(0).toUpperCase() + property.type.slice(1);

  return (
    <article className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 flex flex-col overflow-hidden">

      {/* ── Cover image ── */}
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-100 shrink-0">
        <img
          src={property.image}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Available Now badge */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Available Now
        </span>

        {/* Type badge */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
          {typeLabel}
        </span>

        {/* Rating overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/75 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {property.rating.toFixed(1)}
          <span className="text-slate-300 font-normal">({property.reviewsCount})</span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-slate-400 font-medium -mb-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.location}</span>
        </p>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {property.title}
        </h3>

        {/* ── Bundle Discount Notice ── */}
        {bundle && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-emerald-700 leading-snug">
              Bundle Discount Eligible — Rent 2+ units for{' '}
              <span className="text-emerald-600 font-extrabold">15% off</span>
            </p>
          </div>
        )}

        {/* ── Property specs row ── */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium border-t border-slate-50 pt-3">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5 text-slate-400" />
            {property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}
          </span>
          <span className="w-px h-3.5 bg-slate-200" />
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

        {/* ── Pricing + CTA ── */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div>
            <span className="text-xl font-extrabold text-slate-900">
              ${property.price.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">/ mo</span>
          </div>

          <button
            onClick={() => onApply(property)}
            className="
              inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700
              active:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5
              rounded-xl transition-colors duration-150 shadow-sm
              focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
            "
          >
            Apply to Rent
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface BrowseRentalsPageProps {
  /** Live listings from App-level state (fetched from the API) */
  listings: PropertyListing[];
  /** Lifted search term so Navbar stays in sync */
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  /** Open the property details / booking flow */
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

  // Derived filter state for the clear-all badge count
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
    return listings.filter(p => {
      const matchSearch = !q || [p.title, p.location, p.description, ...(p.amenities ?? [])]
        .some(s => s.toLowerCase().includes(q));
      const matchCat    = category === 'all' || p.type === category;
      const matchBudget = p.price <= budgetMax;
      // availability: treat all listings as 'available' unless we have a status field
      const matchAvail  = availability === 'all' || availability === 'available';
      return matchSearch && matchCat && matchBudget && matchAvail;
    });
  }, [listings, searchTerm, category, budgetMax, availability]);

  const bundleCount = filtered.filter(isBundleEligible).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ══════════════════════════════════════════════════════════════════
          HERO BAND
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-10 pb-16 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Listings · Secure Applications
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Browse Available Rentals
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Discover houses, villas, offices, and studios. Filter by budget, type, and availability — then apply in seconds.
          </p>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {[
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Verified Owners' },
              { icon: <Zap         className="h-3.5 w-3.5" />, label: 'Instant Applications' },
              { icon: <TrendingUp  className="h-3.5 w-3.5" />, label: 'Bundle Discounts Available' },
            ].map(t => (
              <span key={t.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <span className="text-emerald-400">{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SMART FILTER BAR
          Sticky so it stays visible while scrolling the grid
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">

          {/* Row 1: Search + dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2">

            {/* Global search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => onSearchTermChange(e.target.value)}
                placeholder="Search houses, offices, studios, or cities..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchTermChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterDropdown
                label="Budget Range"
                value={budget}
                options={BUDGET_OPTIONS.map(o => ({ key: o.key, label: o.label }))}
                onChange={v => setBudget(v as BudgetKey)}
              />
              <FilterDropdown
                label="Availability"
                value={availability}
                options={[
                  { key: 'all',       label: 'All Statuses' },
                  { key: 'available', label: 'Available Now' },
                  { key: 'rented',    label: 'Rented / Unavailable' },
                ]}
                onChange={v => setAvailability(v as Availability)}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition"
                >
                  <X className="h-3 w-3" />
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Category quick-filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map(cat => (
              <CategoryPill
                key={cat.id}
                item={cat}
                active={category === cat.id}
                onClick={() => setCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RESULTS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {filtered.length === 0
              ? 'No listings match'
              : `${filtered.length} ${filtered.length === 1 ? 'Property' : 'Properties'} Available`}
          </h2>
          {bundleCount > 0 && (
            <p className="text-xs font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {bundleCount} listing{bundleCount > 1 ? 's' : ''} with Bundle Discount
            </p>
          )}
        </div>
        <p className="text-xs text-slate-400 font-mono">Sort: Recommended</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PROPERTY DISCOVERY GRID
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filtered.map(p => (
              <RentalCard
                key={p.id}
                property={p}
                onApply={onSelectProperty}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
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
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              <X className="h-4 w-4" /> Reset All Filters
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
