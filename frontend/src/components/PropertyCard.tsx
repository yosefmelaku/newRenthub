import React from 'react';
import type { PropertyListing } from '../types';
import { Star, MapPin, Bed, Bath, Home } from 'lucide-react';

interface PropertyCardProps {
  property: PropertyListing;
  onClick: () => void;
  onShowOnMap?: (property: PropertyListing) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, onShowOnMap }) => {
  const getPropertyTypeName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div 
      id={`property-card-${property.id}`}
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Property Image Container */}
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        <img 
          src={property.image} 
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-white/95 backdrop-blur-xs text-gray-900 text-[10px] font-sans font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
            <Home className="h-3 w-3 text-emerald-600" />
            {getPropertyTypeName(property.type)}
          </span>
          {property.featured && (
            <span className="bg-emerald-600 text-white text-[9px] font-sans font-bold tracking-wider uppercase px-2 py-1 rounded-md shadow-xs">
              ★ Premium
            </span>
          )}
        </div>

        {/* Map Pin Hover/Shortcut overlay (if map split view is active) */}
        {onShowOnMap && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowOnMap(property);
            }}
            className="absolute top-3 right-3 bg-white/95 hover:bg-white text-emerald-600 hover:text-emerald-700 p-2 rounded-full shadow-md z-10 transition-all duration-200 hover:scale-110 cursor-pointer border border-gray-100 flex items-center justify-center"
            title="Show on map"
          >
            <MapPin className="h-4 w-4" />
          </button>
        )}

        {/* Rating Badge Overlay */}
        <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white text-xs font-sans font-semibold px-2 py-1 rounded-lg flex items-center space-x-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{property.rating.toFixed(2)}</span>
          <span className="text-[10px] text-gray-300 font-normal">({property.reviewsCount})</span>
        </div>
      </div>

      {/* Property Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Location */}
          <div className="flex items-center text-xs text-gray-500 font-sans mb-1.5">
            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          {/* Title */}
          <h3 className="font-sans font-bold text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1 mb-2">
            {property.title}
          </h3>

          {/* Core Features / Specs */}
          <div className="flex items-center space-x-3 text-xs text-gray-500 border-b border-gray-50 pb-3.5 mb-3.5">
            <div className="flex items-center space-x-1">
              <Bed className="h-4 w-4 text-gray-400" />
              <span>{property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bath className="h-4 w-4 text-gray-400" />
              <span>{property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</span>
            </div>
          </div>
        </div>

        {/* Pricing footer */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline">
            <span className="font-sans font-extrabold text-lg text-gray-900">${property.price}</span>
            <span className="text-xs text-gray-500 font-sans ml-1">/ night</span>
          </div>
          <span className="text-xs font-sans font-semibold text-emerald-600 group-hover:underline flex items-center">
            View details &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
