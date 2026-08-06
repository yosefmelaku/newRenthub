import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PropertyListing } from '../types';

// Fix Leaflet's default marker icons reference issue in modern bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to resolve / assign geographical coordinates to any listing
export function getListingCoordinates(listing: PropertyListing): { lat: number; lng: number } {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number' && !isNaN(listing.lat) && !isNaN(listing.lng)) {
    return { lat: listing.lat, lng: listing.lng };
  }

  // Known seed location lookup for precise plotting
  const locationLower = (listing.location || '').toLowerCase();
  if (locationLower.includes('malibu') || locationLower.includes('california beach')) {
    return { lat: 34.0259, lng: -118.7798 };
  }
  if (locationLower.includes('soho') || locationLower.includes('new york') || locationLower.includes('manhattan')) {
    return { lat: 40.7233, lng: -74.0030 };
  }
  if (locationLower.includes('portland') || locationLower.includes('oregon') || locationLower.includes('forest')) {
    return { lat: 45.5152, lng: -122.6784 };
  }
  if (locationLower.includes('chicago') || locationLower.includes('illinois')) {
    return { lat: 41.8781, lng: -87.6298 };
  }
  if (locationLower.includes('joshua tree') || locationLower.includes('desert') || locationLower.includes('mojave')) {
    return { lat: 34.1347, lng: -116.3131 };
  }
  if (locationLower.includes('boston') || locationLower.includes('massachusetts') || locationLower.includes('victorian')) {
    return { lat: 42.3601, lng: -71.0589 };
  }

  // Generative stable deterministic coordinate inside USA limits to ensure custom listings look correct
  let hash = 0;
  const str = (listing.title || '') + (listing.location || '') + (listing.id || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Confined grid bounds for standard USA viewing area (Lat: 32 to 46, Lng: -118 to -74)
  const latRange = 46 - 32;
  const lngRange = 118 - 74;
  const lat = 32 + Math.abs((hash % 1000) / 1000) * latRange;
  const lng = -(74 + Math.abs(((hash >> 8) % 1000) / 1000) * lngRange);
  return { lat, lng };
}

interface MapComponentProps {
  listings: PropertyListing[];
  selectedProperty?: PropertyListing | null;
  onSelectProperty?: (property: PropertyListing) => void;
  height?: string;
  className?: string;
  isSinglePropertyMode?: boolean; // Displays a static circle or high-detail pinpoint
}

export const MapComponent: React.FC<MapComponentProps> = ({
  listings,
  selectedProperty,
  onSelectProperty,
  height = '500px',
  className = '',
  isSinglePropertyMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize map instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([37.0902, -95.7129], 4); // Standard USA view

      // Ultra-premium clean voyager tiles from CartoDB (perfect for high-end Real Estate)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(map);

      // Create feature group for easier batching and coordinate fits
      const markersGroup = L.featureGroup().addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // 2. Clear old markers
    markersGroup.clearLayers();
    markerMapRef.current.clear();

    if (listings.length === 0) return;

    // 3. Draw listings markers
    const bounds: L.LatLngTuple[] = [];

    listings.forEach((listing) => {
      const { lat, lng } = getListingCoordinates(listing);
      const latLng: L.LatLngTuple = [lat, lng];
      bounds.push(latLng);

      const isSelected = selectedProperty?.id === listing.id;

      // Premium visual styling: Custom DivIcon styled as a premium price pill (Airbnb style)
      const priceIcon = L.divIcon({
        className: 'custom-map-price-pill',
        html: `
          <div class="flex items-center justify-center font-sans font-extrabold text-[12px] px-2.5 py-1.5 rounded-xl border-2 shadow-md transition-all duration-300 transform ${
            isSelected
              ? 'bg-emerald-600 text-white border-emerald-400 scale-110 ring-4 ring-emerald-500/30 font-black'
              : 'bg-white text-gray-900 border-gray-100 hover:scale-105 hover:bg-gray-50 hover:border-gray-300'
          }">
            $${listing.price}
          </div>
        `,
        iconSize: [52, 28],
        iconAnchor: [26, 14],
      });

      const marker = L.marker(latLng, { icon: priceIcon });
      
      // Detailed custom HTML popup card
      const popupDiv = document.createElement('div');
      popupDiv.className = 'w-56 p-1 bg-white font-sans';
      popupDiv.innerHTML = `
        <div class="rounded-xl overflow-hidden h-28 bg-gray-50 relative">
          <img src="${listing.image}" alt="${listing.title}" class="w-full h-full object-cover" />
          <div class="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            $${listing.price}/nt
          </div>
        </div>
        <div class="p-2 space-y-1">
          <h4 class="font-extrabold text-xs text-gray-900 line-clamp-1 leading-tight">${listing.title}</h4>
          <p class="text-[10px] text-gray-500 flex items-center">
            <svg class="h-3 w-3 text-emerald-600 mr-0.5 inline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            ${listing.location}
          </p>
          <div class="flex items-center justify-between pt-1 text-[10px] text-gray-400 border-t border-gray-100 mt-1.5">
            <span>${listing.beds} beds &bull; ${listing.baths} baths</span>
            <button class="view-details-action-btn bg-slate-900 hover:bg-emerald-600 text-white font-sans text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer">
              Details
            </button>
          </div>
        </div>
      `;

      // Setup click handler inside popup card
      const actionBtn = popupDiv.querySelector('.view-details-action-btn');
      if (actionBtn && onSelectProperty) {
        actionBtn.addEventListener('click', () => {
          onSelectProperty(listing);
          marker.closePopup();
        });
      }

      // Bind to marker
      marker.bindPopup(popupDiv, {
        closeButton: false,
        className: 'premium-map-popup-container',
        maxWidth: 240,
      });

      marker.addTo(markersGroup);
      markerMapRef.current.set(listing.id, marker);
    });

    // 4. Fitting bounds & zoom settings
    if (bounds.length > 0) {
      if (isSinglePropertyMode && bounds.length === 1) {
        map.setView(bounds[0], 13);
        // Draw a soft visual radius circle around property for high precision aesthetic
        L.circle(bounds[0], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          radius: 600
        }).addTo(markersGroup);
      } else if (selectedProperty) {
        const { lat, lng } = getListingCoordinates(selectedProperty);
        map.setView([lat, lng], 12);
        const marker = markerMapRef.current.get(selectedProperty.id);
        if (marker) {
          setTimeout(() => marker.openPopup(), 100);
        }
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Force recalibrate map layout size at multiple intervals to handle modal animations/rendering delays
    const resizeInterval = setInterval(() => {
      map.invalidateSize();
    }, 250);
    
    // Clear interval after 2.5 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(resizeInterval);
    }, 2500);

    return () => {
      clearInterval(resizeInterval);
      clearTimeout(timeoutId);
    };

  }, [listings, selectedProperty, isSinglePropertyMode]);

  // Selected property popup anchor observer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedProperty) return;

    const marker = markerMapRef.current.get(selectedProperty.id);
    if (marker) {
      const { lat, lng } = getListingCoordinates(selectedProperty);
      map.setView([lat, lng], isSinglePropertyMode ? 14 : 12);
      setTimeout(() => {
        if (marker && !marker.isPopupOpen()) {
          marker.openPopup();
        }
      }, 250);
    }
  }, [selectedProperty, isSinglePropertyMode]);

  // Handle cleanup on full unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height }} id="map-component-wrapper">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-gray-100 z-0" 
        id="leaflet-map-element"
      />
    </div>
  );
};
