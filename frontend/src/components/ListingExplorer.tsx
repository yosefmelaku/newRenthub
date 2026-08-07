import React, { useState, useMemo } from 'react';
import type { PropertyListing } from '../types';
import { PropertyCard } from './PropertyCard';
import { Search, SlidersHorizontal, Check, Building, Compass, Sparkles, Home, Bed, ShieldCheck, Zap, LayoutGrid } from 'lucide-react';
import { MapComponent } from './MapComponent';

interface ListingExplorerProps {
  listings: PropertyListing[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectProperty: (property: PropertyListing) => void;
}

export const ListingExplorer: React.FC<ListingExplorerProps> = ({ listings, searchTerm, onSearchTermChange, onSelectProperty }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('split');
  const [hoveredProperty, setHoveredProperty] = useState<PropertyListing | null>(null);
  const [mapSelectedProperty, setMapSelectedProperty] = useState<PropertyListing | null>(null);

  const handleShowOnMap = (property: PropertyListing) => {
    setMapSelectedProperty(property);
    // Smoothly scroll to the map container on smaller screens so it is fully visible
    const mapEl = document.getElementById('map-split-explorer');
    if (mapEl) {
      const mapContainer = mapEl.querySelector('#map-component-wrapper');
      if (mapContainer) {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(item => {
      item.amenities?.forEach(amenity => set.add(amenity));
    });
    return Array.from(set).sort();
  }, [listings]);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const clearFilters = () => {
    onSearchTermChange('');
    setSelectedType('all');
    setMaxPrice(3000);
    setSelectedAmenities([]);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((property) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        property.title.toLowerCase().includes(normalizedSearch) ||
        property.location.toLowerCase().includes(normalizedSearch) ||
        property.id?.toLowerCase().includes(normalizedSearch) ||
        property.description.toLowerCase().includes(normalizedSearch) ||
        property.amenities?.some((amenity) => amenity.toLowerCase().includes(normalizedSearch));
      
      const matchesType = selectedType === 'all' || property.type === selectedType;
      const matchesPrice = property.price <= maxPrice;
      const matchesAmenities = selectedAmenities.every(
        (amenity) => property.amenities?.includes(amenity)
      );

      return matchesSearch && matchesType && matchesPrice && matchesAmenities;
    });
  }, [listings, searchTerm, selectedType, maxPrice, selectedAmenities]);

  const propertyTypes = ['all', 'house', 'apartment', 'villa', 'studio'];

  return (
    <div className="space-y-6" id="listing-explorer-container">
      {/* Hero Section */}
      <div className="bg-radial from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden" id="explorer-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/40 via-transparent to-transparent opacity-60"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 font-mono text-xs px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Property & Tenancy Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight leading-none text-white">
            Portal Properties
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Review your tenancy details, available properties, and active booking records. Log in to your secure tenant or owner profile to manage bookings and pay rent directly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { title: 'Verified Tenancy', description: 'Review your personal rental contracts and booking slots.', icon: ShieldCheck },
              { title: 'Secure Transactions', description: 'Complete rent and deposit payments with end-to-end encryption.', icon: Zap },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{item.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Search and Quick Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="explorer-search-input"
              type="text"
              placeholder="Search homes by title, city, state, or location..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-sans text-sm placeholder:text-gray-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Property Type Selector */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {propertyTypes.map((type) => {
              const getIcon = () => {
                switch (type) {
                  case 'house': return <Home className="h-3.5 w-3.5" />;
                  case 'apartment': return <Building className="h-3.5 w-3.5" />;
                  case 'villa': return <Sparkles className="h-3.5 w-3.5" />;
                  case 'studio': return <Bed className="h-3.5 w-3.5" />;
                  default: return <Compass className="h-3.5 w-3.5" />;
                }
              };

              return (
                <button
                  key={type}
                  id={`filter-type-${type}`}
                  onClick={() => setSelectedType(type)}
                  className={`px-3.5 py-2.5 rounded-xl font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedType === type
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {getIcon()}
                  <span>{type === 'all' ? 'All Types' : type}</span>
                </button>
              );
            })}

            {/* Detailed Filter Toggle Button */}
            <button
              id="filter-details-toggle"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-semibold transition-all ${
                showFilters || selectedAmenities.length > 0 || maxPrice < 500
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedAmenities.length > 0 || maxPrice < 500) && (
                <span className="bg-emerald-600 text-white h-4 px-1.5 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {selectedAmenities.length + (maxPrice < 500 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {showFilters && (
          <div className="border-t border-gray-100 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn" id="advanced-filters-panel">
            {/* Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-sans">Max Price Per Night</label>
                <span className="text-sm font-extrabold text-emerald-600 font-sans">${maxPrice}</span>
              </div>
              <input
                id="price-range-slider"
                type="range"
                min="50"
                max="3000"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>$50</span>
                <span>$1500</span>
                <span>$3000+</span>
              </div>
            </div>

            {/* Amenities Selectors */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-sans block">Verified Amenities</label>
              <div className="flex flex-wrap gap-1.5">
                {allAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      id={`amenity-chip-${amenity.replace(/\s+/g, '-')}`}
                      onClick={() => toggleAmenity(amenity)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : null}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 lg:col-span-3 flex justify-end items-center space-x-3 pt-2 border-t border-gray-50">
              <button
                id="clear-filters-btn"
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                id="close-filters-btn"
                onClick={() => setShowFilters(false)}
                className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Apply & Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listing Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-xl font-sans font-extrabold text-gray-900">
            {filteredListings.length === 0 ? 'No Properties Match' : `Available Spaces (${filteredListings.length})`}
          </h2>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-gray-400 hidden md:inline">Sort: Recommended</span>
            
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid View</span>
              </button>
              <button
                id="view-mode-split"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Map Explorer</span>
              </button>
            </div>
          </div>
        </div>

        {filteredListings.length > 0 ? (
          viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="map-split-explorer">
              {/* Listings column */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] lg:max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredListings.map((property) => (
                  <div
                    key={property.id}
                    onMouseEnter={() => setHoveredProperty(property)}
                    onMouseLeave={() => setHoveredProperty(null)}
                    className="transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <PropertyCard
                      property={property}
                      onClick={() => onSelectProperty(property)}
                      onShowOnMap={handleShowOnMap}
                    />
                  </div>
                ))}
              </div>

              {/* Sticky Map Component */}
              <div className="lg:col-span-5 h-[400px] lg:h-[750px] lg:sticky lg:top-4 z-10">
                <MapComponent
                  listings={filteredListings}
                  selectedProperty={hoveredProperty || mapSelectedProperty}
                  onSelectProperty={onSelectProperty}
                  height="100%"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="listings-grid">
              {filteredListings.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => onSelectProperty(property)}
                  onShowOnMap={handleShowOnMap}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4" id="empty-search-state">
            <div className="bg-gray-100 p-4 rounded-full inline-block text-gray-400">
              <Compass className="h-8 w-8" />
            </div>
            <h3 className="font-sans font-bold text-gray-800 text-lg">No properties found</h3>
            <p className="text-gray-500 text-sm">
              We couldn't find any premium properties matching your exact filter parameters. Try removing some amenities or broadening your search range.
            </p>
            <button
              id="empty-reset-filters-btn"
              onClick={clearFilters}
              className="bg-emerald-600 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 shadow-xs transition-colors"
            >
              Reset Search Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
