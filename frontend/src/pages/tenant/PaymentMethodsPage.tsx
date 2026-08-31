/**
 * PaymentMethodsPage.tsx
 * 
 * Displays available Ethiopian payment methods for property rental payments.
 * User selects a payment method and proceeds to confirmation.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, CreditCard, Building2, 
  Smartphone, Banknote, ShieldCheck, CheckCircle2 
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: 'telebirr' | 'cbe' | 'bank' | 'awash' | 'dashen' | 'chapa';
  processingTime: string;
  fee: string;
}

interface PaymentMethodsPageProps {
  bookingDetails?: {
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
  rentPaymentDetails?: {
    propertyTitle: string;
    propertyLocation: string;
    propertyImage: string;
    amount: number;
    dueDate: string;
  };
  onBack: () => void;
  onSelectMethod: (methodId: string) => void;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    description: 'Pay instantly using Telebirr mobile wallet',
    icon: 'telebirr',
    processingTime: 'Instant',
    fee: 'No fees',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia mobile banking',
    icon: 'cbe',
    processingTime: 'Instant',
    fee: 'No fees',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer to property owner account',
    icon: 'bank',
    processingTime: '1-2 business days',
    fee: 'No fees',
  },
  {
    id: 'awash_bank',
    name: 'Awash Bank',
    description: 'Pay via Awash Bank mobile or internet banking',
    icon: 'awash',
    processingTime: 'Instant',
    fee: 'No fees',
  },
  {
    id: 'dashen_bank',
    name: 'Dashen Bank',
    description: 'Pay via Dashen Bank mobile or internet banking',
    icon: 'dashen',
    processingTime: 'Instant',
    fee: 'No fees',
  },
  {
    id: 'chapa',
    name: 'Chapa',
    description: 'Pay with Chapa - Multiple payment options',
    icon: 'chapa',
    processingTime: 'Instant',
    fee: '2.5%',
  },
];

const getMethodIcon = (icon: string) => {
  switch (icon) {
    case 'telebirr':
      return <Smartphone className="h-6 w-6" />;
    case 'cbe':
      return <Building2 className="h-6 w-6" />;
    case 'bank':
    case 'awash':
    case 'dashen':
      return <Banknote className="h-6 w-6" />;
    case 'chapa':
      return <CreditCard className="h-6 w-6" />;
    default:
      return <CreditCard className="h-6 w-6" />;
  }
};

export const PaymentMethodsPage: React.FC<PaymentMethodsPageProps> = ({
  bookingDetails,
  onBack,
  onSelectMethod,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Property</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Payment Method</h1>
          <p className="text-gray-600">Select how you'd like to pay for your rental</p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Booking Summary
          </h2>
          <div className="flex gap-4">
            <img
              src={bookingDetails.property.image}
              alt={bookingDetails.property.title}
              className="w-24 h-20 object-cover rounded-xl border border-gray-200"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{bookingDetails.property.title}</h3>
              <p className="text-sm text-gray-500">{bookingDetails.property.location}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {bookingDetails.startDate} to {bookingDetails.endDate} ({bookingDetails.nights} nights)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">${bookingDetails.totalPrice}</p>
            </div>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`
                relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all
                hover:shadow-lg
                ${
                  selectedMethod === method.id
                    ? 'border-emerald-500 shadow-md bg-emerald-50/30'
                    : 'border-gray-200 hover:border-emerald-300'
                }
              `}
            >
              {/* Selected Indicator */}
              {selectedMethod === method.id && (
                <div className="absolute top-4 right-4">
                  <div className="bg-emerald-500 rounded-full p-1">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              {/* Method Icon */}
              <div className={`
                inline-flex p-3 rounded-xl mb-4
                ${selectedMethod === method.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}
              `}>
                {getMethodIcon(method.icon)}
              </div>

              {/* Method Info */}
              <h3 className="font-bold text-gray-900 text-lg mb-1">{method.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{method.description}</p>

              {/* Method Details */}
              <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100">
                <div>
                  <span className="text-gray-500">Processing: </span>
                  <span className="font-semibold text-gray-700">{method.processingTime}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fee: </span>
                  <span className="font-semibold text-gray-700">{method.fee}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Badge */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Secure Payment Processing</h3>
              <p className="text-gray-400 text-sm">
                All transactions are encrypted and secure. Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="
              bg-emerald-600 hover:bg-emerald-700 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white font-bold py-4 px-8 rounded-xl 
              shadow-lg transition-all
              flex items-center gap-2
            "
          >
            <span>Continue to Payment</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
