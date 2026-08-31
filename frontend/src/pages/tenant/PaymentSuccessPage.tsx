/**
 * PaymentSuccessPage.tsx
 * 
 * Success confirmation page shown after successful payment.
 */

import React from 'react';
import { CheckCircle2, Home, FileText } from 'lucide-react';

interface PaymentSuccessPageProps {
  onGoToDashboard: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  onGoToDashboard,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-slate-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full">
              <div className="bg-emerald-500 p-3 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-8">
            Your booking has been confirmed. You'll receive a confirmation email shortly.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onGoToDashboard}
              className="
                w-full bg-emerald-600 hover:bg-emerald-700
                text-white font-bold py-4 px-6 rounded-xl
                shadow-lg transition-all
                flex items-center justify-center gap-2
              "
            >
              <Home className="h-5 w-5" />
              <span>Go to Dashboard</span>
            </button>

            <button
              onClick={onGoToDashboard}
              className="
                w-full bg-white hover:bg-gray-50
                border-2 border-gray-200 
                text-gray-700 font-semibold py-4 px-6 rounded-xl
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <FileText className="h-5 w-5" />
              <span>View Booking Details</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@renthub.com" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            support@renthub.com
          </a>
        </p>
      </div>
    </div>
  );
};
