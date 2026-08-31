import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { verifySandboxPayment, checkPaymentStatus } from '../../lib/api';

interface PaymentRedirectPageProps {
  onFinish: () => void;
}

export const PaymentRedirectPage: React.FC<PaymentRedirectPageProps> = ({ onFinish }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Read query params
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('booking_id') || '';
  const sessionId = params.get('session_id') || '';
  const statusParam = params.get('status') || '';

  useEffect(() => {
    if (statusParam === 'cancel') {
      setStatus('failed');
      setErrorMsg('The payment checkout was cancelled by the user. You can retry from your dashboard.');
      return;
    }

    if (!bookingId) {
      setStatus('failed');
      setErrorMsg('No booking identification returned from the payment gateway.');
      return;
    }

    const performVerification = async () => {
      try {
        if (sessionId.startsWith('mock_session_')) {
          // Development / Sandbox process
          const res = await verifySandboxPayment(bookingId, sessionId);
          if (res.success) {
            setStatus('success');
          } else {
            setStatus('failed');
            setErrorMsg(res.message || 'Sandbox verification failed.');
          }
        } else {
          // Stripe webhook verification polling:
          // Since webhooks execute out-of-band and might take brief moments,
          // the client queries the status API periodically.
          let verified = false;
          for (let i = 0; i < 6; i++) {
            const res = await checkPaymentStatus(bookingId);
            if (res.paymentStatus === 'paid') {
              verified = true;
              break;
            }
            // Wait 1.5 seconds before polling again
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          if (verified) {
            setStatus('success');
          } else {
            setStatus('failed');
            setErrorMsg('We are waiting for signature approval from your bank. Please check your bookings ledger shortly.');
          }
        }
      } catch (err: any) {
        console.error('Payment verification failed:', err);
        setStatus('failed');
        setErrorMsg(err.message || 'An error occurred while verifying the payment with the server.');
      }
    };

    performVerification();
  }, [bookingId, sessionId, statusParam]);

  const handleReturn = () => {
    // Clear URL parameters
    window.history.replaceState({}, '', '/');
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-scaleUp">
        {status === 'verifying' && (
          <div className="space-y-6 flex flex-col items-center justify-center py-6">
            <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
            <div className="space-y-2">
              <h3 className="font-sans font-bold text-xl">Securing Stay Details</h3>
              <p className="text-sm text-slate-400">
                Verifying transaction authentication and confirming lease placement. Please wait...
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>PCI-DSS Validation Pipeline</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full text-emerald-400">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-bold text-2xl">Payment Verified</h3>
              <p className="text-sm text-slate-400">
                Your payment cleared successfully! The reservation dates are locked and the host has been notified.
              </p>
            </div>
            <button
              onClick={handleReturn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold py-3.5 px-6 rounded-2xl shadow-lg transition duration-200 cursor-pointer flex items-center justify-center space-x-2 text-sm animate-pulse"
            >
              <span>Go to My Bookings</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-full text-rose-400">
              <XCircle className="h-16 w-16" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-bold text-2xl">Checkout Failed</h3>
              <p className="text-sm text-rose-300 bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-2xl mx-auto max-w-xs">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={handleReturn}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold py-3.5 px-6 rounded-2xl shadow-md transition duration-200 cursor-pointer text-sm"
            >
              Return to RentHub
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
