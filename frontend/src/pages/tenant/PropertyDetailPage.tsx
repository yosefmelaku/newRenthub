/**
 * PropertyDetailPage.tsx - Detailed Property View
 * 
 * Clear sections showing:
 * - Property Photos
 * - Property Information
 * - Amenities
 * - Rent Amount & Fees
 * - Availability
 * - Owner Details
 * - Apply Button
 */

import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, Bed, Bath, Square, Car, Wifi, Coffee,
  Tv, Wind, Shield, CheckCircle, DollarSign, Calendar,
  User, Phone, Mail, Building, Star, Heart
} from 'lucide-react';

interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  images: string[];
  type: 'apartment' | 'house' | 'villa' | 'studio' | 'office';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  parking: number;
  rent: number;
  securityDeposit: number;
  available: boolean;
  availableFrom: string;
  amenities: string[];
  owner: {
    name: string;
    phone: string;
    email: string;
    properties: number;
    rating: number;
  };
  rating: number;
  reviews: number;
}

interface PropertyDetailPageProps {
  property: PropertyDetail;
  onBack: () => void;
  onApply: () => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  property,
  onBack,
  onApply,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const amenityIcons: Record<string, React.ReactNode> = {
    'WiFi': <Wifi className="h-5 w-5" />,
    'Parking': <Car className="h-5 w-5" />,
    'Air Conditioning': <Wind className="h-5 w-5" />,
    'Kitchen': <Coffee className="h-5 w-5" />,
    'TV': <Tv className="h-5 w-5" />,
    'Security': <Shield className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Properties</span>
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Heart className={`h-6 w-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={property.images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-2 capitalize">
                    {property.type}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    {property.address}, {property.city}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">{property.rating}</span>
                  <span className="text-gray-500 text-sm">({property.reviews})</span>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-4 gap-4 py-6 border-y border-gray-100">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Bed className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Bath className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Square className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.sqft}</p>
                  <p className="text-sm text-gray-500">Sq Ft</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Car className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{property.parking}</p>
                  <p className="text-sm text-gray-500">Parking</p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">About This Property</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      {amenityIcons[amenity] || <CheckCircle className="h-5 w-5" />}
                    </div>
                    <span className="text-gray-700 font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Property Owner</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{property.owner.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-gray-600">{property.owner.rating} rating</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{property.owner.properties} properties</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {property.owner.phone}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {property.owner.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                  <p className="text-4xl font-bold text-gray-900">${property.rent}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Security Deposit: <span className="font-semibold text-gray-700">${property.securityDeposit}</span>
                  </p>
                </div>

                {/* Availability */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Availability</p>
                  {property.available ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">Available Now</p>
                        <p className="text-xs text-gray-500">Move in from {property.availableFrom}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700">Coming Soon</p>
                        <p className="text-xs text-gray-500">Available from {property.availableFrom}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Monthly Breakdown */}
                <div className="mb-6 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Monthly Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Rent</span>
                      <span className="font-semibold">${property.rent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilities</span>
                      <span className="font-semibold">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee</span>
                      <span className="font-semibold">$50</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-bold text-gray-900">Total Monthly</span>
                      <span className="font-bold text-gray-900">${property.rent + 50}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={onApply}
                  disabled={!property.available}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Building className="h-5 w-5" />
                  Apply for This Property
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Application will be reviewed within 24-48 hours
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h4 className="font-bold text-emerald-900 mb-3">Need Help?</h4>
                <p className="text-sm text-emerald-700 mb-4">
                  Our team is here to assist you with any questions about this property.
                </p>
                <button className="w-full bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-semibold py-2.5 rounded-lg transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock Property Data for Testing
export const mockProperty: PropertyDetail = {
  id: '1',
  title: 'Modern Downtown Apartment',
  description: 'Beautiful modern apartment in the heart of downtown. Features include hardwood floors, stainless steel appliances, and stunning city views. Close to restaurants, shopping, and public transportation.',
  address: '123 Main Street, Apt 4B',
  city: 'New York',
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  ],
  type: 'apartment',
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1200,
  parking: 1,
  rent: 2500,
  securityDeposit: 2500,
  available: true,
  availableFrom: 'January 1, 2027',
  amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Kitchen', 'TV', 'Security'],
  owner: {
    name: 'John Smith',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@email.com',
    properties: 12,
    rating: 4.8,
  },
  rating: 4.7,
  reviews: 24,
};
