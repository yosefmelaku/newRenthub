/**
 * PaymentConfirmationPage.tsx
 * 
 * Final confirmation page before processing payment.
 * Shows booking details, selected payment method, and processes the payment.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Loader2, AlertCircle,
  CreditCard, Building2, Smartphone, Banknote, Lock
} from 'lucide-react';

interface PaymentConfirmationPageProps {
  bookingDetails: {
    property: {
      id: string;
      title: string;
      image: string;
      location: string;
    };
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
  };
  selectedPaymentMethod: string;
  onBack: () => void;
  onPaymentComplete: () => void;
}

const paymentMethodNames: Record<string, string> = {
  telebirr: 'Telebirr',
  cbe_birr: 'CBE Birr',
  bank_transfer: 'Bank Transfer',
  awash_bank: 'Awash Bank',
  dashen_bank: 'Dashen Bank',
  chapa: 'Chapa',
};

const getPaymentIcon = (methodId: string) => {
  if (methodId === 'telebirr') return <Smartphone className="h-6 w-6" />;
  if (methodId === 'cbe_birr') return <Building2 className="h-6 w-6" />;
  if (methodId === 'chapa') return <CreditCard className="h-6 w-6" />;
  return <Banknote className="h-6 w-6" />;
};

export const PaymentConfirmationPage: React.FC<PaymentConfirmationPageProps> = ({
  bookingDetails,
  selectedPaymentMethod,
  onBack,
  onPaymentComplete,
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const currentUserRaw = localStorage.getItem('currentUser');
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

      if (!currentUser) {
        throw new Error('You must be logged in to complete payment');
      }

      // Step 1: Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          listingId: bookingDetails.property.id,
          listingTitle: bookingDetails.property.title,
          listingImage: bookingDetails.property.image,
          listingLocation: bookingDetails.property.location,
          renterId: currentUser.id,
          renterName: currentUser.name,
          startDate: bookingDetails.startDate,
          endDate: bookingDetails.endDate,
          totalPrice: bookingDetails.totalPrice,
          nights: bookingDetails.nights,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const booking = await bookingResponse.json();

      // Step 2: Create payment record
      const paymentResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          renterId: currentUser.id,
          amount: bookingDetails.totalPrice,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      // Success! Wait a moment then navigate
      await new Promise(resolve => setTimeout(resolve, 1500));
      onPaymentComplete();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            disabled={processing}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Payment Methods</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Payment</h1>
          <p className="text-gray-600">Review your booking details and complete payment</p>
        </div>

        {/* Property & Booking Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Booking Details
          </h2>
          
          <div className="flex gap-4 mb-6">
            <img
              src={bookingDetails.property.image}
              alt={bookingDetails.property.title}
              className="w-28 h-24 object-cover rounded-xl border border-gray-200"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">{bookingDetails.property.title}</h3>
              <p className="text-sm text-gray-500">{bookingDetails.property.location}</p>
              <div className="mt-2 text-sm text-gray-600">
                <p><span className="font-semibold">Check-in:</span> {bookingDetails.startDate}</p>
                <p><span className="font-semibold">Check-out:</span> {bookingDetails.endDate}</p>
                <p><span className="font-semibold">Duration:</span> {bookingDetails.nights} nights</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-gray-900">${bookingDetails.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Payment Method
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              {getPaymentIcon(selectedPaymentMethod)}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {paymentMethodNames[selectedPaymentMethod] || selectedPaymentMethod}
              </p>
              <p className="text-sm text-gray-500">Your selected payment method</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Payment Failed</p>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Lock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Secure Transaction</h3>
              <p className="text-gray-400 text-sm">
                Your payment is processed securely. All transactions are encrypted end-to-end.
              </p>
            </div>
          </div>
        </div>

        {/* Confirm Payment Button */}
        <button
          onClick={handleConfirmPayment}
          disabled={processing}
          className="
            w-full bg-emerald-600 hover:bg-emerald-700 
            disabled:bg-gray-400 disabled:cursor-not-allowed
            text-white font-bold py-4 px-8 rounded-xl 
            shadow-lg transition-all
            flex items-center justify-center gap-3
          "
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>Confirm & Pay ${bookingDetails.totalPrice}</span>
            </>
          )}
        </button>

        {/* Terms Notice */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By confirming, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
