import React, { useState } from 'react';
import type { PropertyListing } from '../types';
import { X, CreditCard, ShieldCheck, AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react';
import { createBooking, createCheckoutSession } from '../lib/api';

interface CheckoutPaymentModalProps {
  property: PropertyListing;
  bookingDetails: {
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
  };
  onClose: () => void;
  onPaymentSuccess: (paymentData: {
    cardholderName: string;
    cardNumberMasked: string;
  }) => void; // Kept signature for backwards compat/callbacks
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  property,
  bookingDetails,
  onClose,
}) => {
  const [status, setStatus] = useState<'form' | 'processing'>('form');
  const [processingStep, setProcessingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUserRaw = localStorage.getItem('currentUser');
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

  const handlePayRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('You must be logged in to confirm bookings.');
      return;
    }

    setErrorMsg('');
    setStatus('processing');

    try {
      // Step 1: Create pending booking record in the database
      setProcessingStep('Creating lease reservation locally...');
      const booking = await createBooking({
        listingId: property.id,
        listingTitle: property.title,
        listingImage: property.image,
        listingLocation: property.location,
        renterId: currentUser.email!,
        renterName: currentUser.name,
        startDate: bookingDetails.startDate,
        endDate: bookingDetails.endDate,
        totalPrice: bookingDetails.totalPrice,
        nights: bookingDetails.nights,
      });

      // Step 2: Call server checkout session API
      setProcessingStep('Generating secure Stripe Checkout Session...');
      const session = await createCheckoutSession(booking.id);

      // Step 3: Redirect user to Stripe hosted environment
      setProcessingStep('Redirecting to secure gateway...');
      window.location.href = session.url;

    } catch (err: any) {
      console.error('Checkout redirect failed:', err);
      setErrorMsg(err.message || 'An error occurred while establishing payment. Please check availability and try again.');
      setStatus('form');
    }
  };

  return (
    <div id="checkout-payment-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
      <div 
        id="checkout-payment-modal-content"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp border border-gray-100"
      >
        {/* Header row */}
        <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-500/15 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Secure Gateway Redirect</h3>
              <p className="text-[10px] text-gray-400 font-mono">100% Encrypted Connection</p>
            </div>
          </div>
          <button 
            id="close-checkout-modal-btn"
            onClick={onClose} 
            disabled={status === 'processing'}
            className="p-1.5 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'form' && (
          <form onSubmit={handlePayRedirect} className="p-6 space-y-6">
            {/* Booking Summary Card */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex gap-3">
                <img 
                  src={property.image} 
                  alt={property.title} 
                  referrerPolicy="no-referrer"
                  className="h-14 w-20 object-cover rounded-lg border border-gray-200/50 shrink-0" 
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{property.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{property.location}</p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    {bookingDetails.startDate} to {bookingDetails.endDate} ({bookingDetails.nights} {bookingDetails.nights === 1 ? 'night' : 'nights'})
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200/50 pt-2.5 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Charge</span>
                <span className="text-lg font-extrabold text-gray-900">${bookingDetails.totalPrice}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div id="checkout-error-panel" className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* PCI Compliance Notice */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-gray-800">PCI-DSS Regulatory Compliance</h5>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    To guarantee absolute financial data integrity, RentHub never collects, stores, or transmits credit card numbers on our servers.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200/50 pt-2.5 text-[10px] text-gray-400 font-mono">
                Clicking check out will redirect you to Stripe's payment gate (PCI DSS Level 1 Certified).
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Supports Visa, Mastercard, AMEX</span>
              </div>
              <button
                id="submit-payment-btn"
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md cursor-pointer transition-colors text-sm text-center flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {status === 'processing' && (
          <div id="checkout-processing-panel" className="p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
            <div className="space-y-2">
              <h4 className="font-extrabold text-gray-900 text-base">Initializing Secure Session</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {processingStep}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
