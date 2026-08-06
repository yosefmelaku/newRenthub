import React, { useState, useEffect } from 'react';
import { PropertyListing } from '../types';
import { X, Calendar, ShieldCheck, MapPin, Bed, Bath, Star, Sparkles, AlertCircle } from 'lucide-react';
import { MapComponent } from './MapComponent';

interface PropertyDetailsModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  onInitiateBooking: (bookingData: {
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
  }) => void;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onInitiateBooking,
}) => {
  // Setup default dates: Tomorrow to 4 days later
  const getTomorrowString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  const getFutureDateString = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getTomorrowString());
  const [endDate, setEndDate] = useState(getFutureDateString(5));
  const [nights, setNights] = useState(4);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      setErrorMsg('Check-out date must be after check-in date');
      setNights(0);
      return;
    }
    
    setErrorMsg('');
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const calculatedNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    setNights(calculatedNights);
  }, [startDate, endDate]);

  if (!property) return null;

  // Price Calculation Breakdown
  const baseTotal = property.price * nights;
  const cleaningFee = nights > 0 ? 75 : 0;
  const serviceFee = nights > 0 ? 55 : 0;
  const taxRate = 0.12; // 12%
  const taxFee = Math.round(baseTotal * taxRate);
  const totalAmount = baseTotal + cleaningFee + serviceFee + taxFee;

  const handleBookClick = () => {
    if (nights <= 0) {
      setErrorMsg('Please select a valid stay duration');
      return;
    }
    onInitiateBooking({
      startDate,
      endDate,
      nights,
      totalPrice: totalAmount,
    });
  };

  return (
    <div id="property-details-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="property-details-modal-content"
        className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] md:max-h-[85vh] animate-scaleUp"
      >
        {/* Left Side: Property Gallery & Details (Col 1-7) */}
        <div className="lg:col-span-7 overflow-y-auto p-6 space-y-6 max-h-[40vh] lg:max-h-full">
          {/* Header row */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                Verified Premium Space
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-extrabold text-gray-900 mt-2">
                {property.title}
              </h2>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                <span>{property.location}</span>
              </div>
            </div>
            <button 
              id="close-details-modal-btn"
              onClick={onClose} 
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Property Image Cover */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-50 border border-gray-100">
            <img 
              src={property.image} 
              alt={property.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg font-sans font-medium flex items-center space-x-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{property.rating.toFixed(2)} rating</span>
              <span className="text-gray-300">({property.reviewsCount} reviews)</span>
            </div>
          </div>

          {/* Key specs */}
          <div className="grid grid-cols-3 gap-3 border-y border-gray-100 py-4 text-center">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-sans font-bold block">Beds</span>
              <span className="font-sans font-extrabold text-gray-900 text-lg flex items-center justify-center gap-1.5 mt-0.5">
                <Bed className="h-4 w-4 text-emerald-600" />
                {property.beds}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-sans font-bold block">Bathrooms</span>
              <span className="font-sans font-extrabold text-gray-900 text-lg flex items-center justify-center gap-1.5 mt-0.5">
                <Bath className="h-4 w-4 text-emerald-600" />
                {property.baths}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-sans font-bold block">Type</span>
              <span className="font-sans font-bold text-gray-900 text-sm block mt-1.5 truncate capitalize">
                {property.type}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-sans font-bold text-gray-900 text-sm uppercase tracking-wider">About this home</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities Grid */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-gray-900 text-sm uppercase tracking-wider">What this place offers</h4>
            <div className="grid grid-cols-2 gap-2">
              {property.amenities?.map((amenity, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600 font-sans bg-gray-50 px-3 py-2 rounded-lg border border-gray-100/50">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Map */}
          <div className="space-y-3 pt-2">
            <h4 className="font-sans font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Location street map</span>
            </h4>
            <div className="rounded-2xl overflow-hidden border border-gray-100">
              <MapComponent
                listings={[property]}
                selectedProperty={property}
                height="220px"
                isSinglePropertyMode={true}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Price Calculator & Booking Widget (Col 8-12) */}
        <div className="lg:col-span-5 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-100 p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] lg:max-h-full">
          <div className="space-y-6">
            {/* Widget Header with Close button (desktop) */}
            <div className="flex justify-between items-center">
              <div className="flex items-baseline">
                <span className="text-2xl font-extrabold text-gray-900 font-sans">${property.price}</span>
                <span className="text-xs text-gray-500 font-sans ml-1">/ night</span>
              </div>
              <button 
                id="close-details-modal-btn-desktop"
                onClick={onClose} 
                className="hidden lg:block p-1.5 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stay Dates form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Select Booking Schedule</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="details-start-date" className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider">Check-in</label>
                  <input
                    id="details-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getTomorrowString()}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-sans text-xs text-gray-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="details-end-date" className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider">Check-out</label>
                  <input
                    id="details-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-sans text-xs text-gray-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div id="date-validation-error" className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            {nights > 0 && (
              <div className="space-y-3" id="invoice-breakdown">
                <h5 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/60 pb-1">Fare Breakdown</h5>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 font-sans">
                    <span>${property.price} &times; {nights} nights</span>
                    <span className="font-semibold">${baseTotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 font-sans">
                    <span>Cleaning Fee</span>
                    <span className="font-semibold">${cleaningFee}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 font-sans">
                    <span>RentHub Service Charge</span>
                    <span className="font-semibold">${serviceFee}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 font-sans">
                    <span>Occupancy Taxes & Fees (12%)</span>
                    <span className="font-semibold">${taxFee}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200/60 pt-3 flex justify-between items-baseline font-sans">
                  <span className="text-sm font-bold text-gray-900">Total Price</span>
                  <span className="text-xl font-extrabold text-emerald-600" id="calculated-total-amount">${totalAmount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Secure Book button & badges */}
          <div className="pt-6 border-t border-gray-200/60 mt-6 space-y-3">
            <button
              id="initiate-booking-btn"
              onClick={handleBookClick}
              disabled={nights <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans font-bold py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors text-center text-sm flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Book with Instant Pay</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Secure Booking Process &bull; 256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
