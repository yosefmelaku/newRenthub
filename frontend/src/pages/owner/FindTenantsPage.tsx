import React, { useState, useMemo } from 'react';
import {
  Search, Users, FileText, Clock, Plus, X,
  Mail, Phone, Home, CheckCircle2, AlertCircle,
  TrendingUp, ShieldCheck, PenTool, ChevronRight,
  Star, Calendar, CreditCard, Smartphone, Building2,
  DollarSign, Zap, Lock, ArrowRight, CheckSquare2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ScreeningStatus = 'Under Review' | 'Screening Passed' | 'Interview Scheduled' | 'Action Required';
type ActiveFilter    = 'all' | 'listings' | 'applications' | 'screenings';
type PaymentMethod   = 'stripe' | 'telebirr' | 'cbe' | 'dashen' | 'mpesa' | 'cash';
type PaymentStep     = 'select' | 'confirm' | 'processing' | 'done';

interface Applicant {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  property: string;
  propertyType: string;
  appliedDate: string;
  status: ScreeningStatus;
  creditScore: number;
  creditVerified: boolean;
  idVerified: boolean;
  incomeRatio: number;
  monthlyIncome: number;
  monthlyRent: number;
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock applicant data
// ─────────────────────────────────────────────────────────────────────────────

const APPLICANTS: Applicant[] = [
  {
    id: '1', name: 'Sarah Miller', initials: 'SM',
    email: 'sarah.miller@example.com', phone: '+1 (555) 234-5678',
    property: 'Premium Villa Room 4', propertyType: 'Villa',
    appliedDate: 'July 27, 2026', status: 'Screening Passed',
    creditScore: 748, creditVerified: true, idVerified: true,
    incomeRatio: 0.24, monthlyIncome: 12500, monthlyRent: 3000,
    notes: 'Excellent rental history. No prior evictions. Employed 5+ years.',
  },
  {
    id: '2', name: 'Mark Davis', initials: 'MD',
    email: 'mark.davis@example.com', phone: '+1 (555) 345-6789',
    property: 'Downtown Office B', propertyType: 'Office',
    appliedDate: 'July 26, 2026', status: 'Under Review',
    creditScore: 682, creditVerified: true, idVerified: false,
    incomeRatio: 0.31, monthlyIncome: 9800, monthlyRent: 3000,
    notes: 'ID verification pending. Background check in progress.',
  },
  {
    id: '3', name: 'Elena Rodriguez', initials: 'ER',
    email: 'elena.rod@example.com', phone: '+1 (555) 456-7890',
    property: 'Studio C', propertyType: 'Studio',
    appliedDate: 'July 25, 2026', status: 'Interview Scheduled',
    creditScore: 711, creditVerified: true, idVerified: true,
    incomeRatio: 0.28, monthlyIncome: 6400, monthlyRent: 1800,
    notes: 'Interview set for Aug 3. References confirmed.',
  },
  {
    id: '4', name: 'James Okafor', initials: 'JO',
    email: 'james.o@example.com', phone: '+1 (555) 567-8901',
    property: 'Premium Villa Room 4', propertyType: 'Villa',
    appliedDate: 'July 24, 2026', status: 'Action Required',
    creditScore: 610, creditVerified: false, idVerified: true,
    incomeRatio: 0.41, monthlyIncome: 7300, monthlyRent: 3000,
    notes: 'Credit check returned incomplete. Awaiting supplemental docs.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Payment method config
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  logo: React.ReactNode;
  tag?: string;
  tagColor?: string;
  fields: { id: string; label: string; placeholder: string; type: string }[];
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'stripe',
    name: 'Card / Stripe',
    description: 'Visa · Mastercard · Amex',
    logo: <CreditCard className="h-6 w-6 text-indigo-600" />,
    tag: 'International',
    tagColor: 'bg-indigo-50 text-indigo-700',
    fields: [
      { id: 'cardName',   label: 'Cardholder Name',   placeholder: 'John Doe',            type: 'text'   },
      { id: 'cardNumber', label: 'Card Number',        placeholder: '4242 4242 4242 4242', type: 'text'   },
      { id: 'expiry',     label: 'Expiry',             placeholder: 'MM / YY',             type: 'text'   },
      { id: 'cvv',        label: 'CVV',                placeholder: '•••',                 type: 'password'},
    ],
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    description: 'Ethio Telecom Mobile Money',
    logo: <Smartphone className="h-6 w-6 text-green-600" />,
    tag: 'Ethiopia',
    tagColor: 'bg-green-50 text-green-700',
    fields: [
      { id: 'phone', label: 'Telebirr Phone Number', placeholder: '+251 9XX XXX XXX', type: 'tel' },
    ],
  },
  {
    id: 'cbe',
    name: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia',
    logo: <Building2 className="h-6 w-6 text-amber-600" />,
    tag: 'Ethiopia',
    tagColor: 'bg-amber-50 text-amber-700',
    fields: [
      { id: 'accountNo', label: 'CBE Account Number', placeholder: '1000XXXXXXXXXX', type: 'text' },
      { id: 'pin',       label: 'Transaction PIN',    placeholder: '••••',           type: 'password' },
    ],
  },
  {
    id: 'dashen',
    name: 'Dashen Bank',
    description: 'Dashen Mobile Banking',
    logo: <DollarSign className="h-6 w-6 text-blue-600" />,
    tag: 'Ethiopia',
    tagColor: 'bg-blue-50 text-blue-700',
    fields: [
      { id: 'accountNo', label: 'Dashen Account Number', placeholder: '00100XXXXXXXXX', type: 'text' },
      { id: 'pin',       label: 'Transaction PIN',       placeholder: '••••',            type: 'password' },
    ],
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Safaricom Mobile Money',
    logo: <Zap className="h-6 w-6 text-emerald-600" />,
    tag: 'East Africa',
    tagColor: 'bg-emerald-50 text-emerald-700',
    fields: [
      { id: 'phone', label: 'M-Pesa Phone Number', placeholder: '+254 7XX XXX XXX', type: 'tel' },
    ],
  },
  {
    id: 'cash',
    name: 'Cash / Bank Transfer',
    description: 'Manual confirmation by owner',
    logo: <DollarSign className="h-6 w-6 text-zinc-500" />,
    fields: [
      { id: 'ref', label: 'Reference / Receipt Number', placeholder: 'e.g. TXN-123456', type: 'text' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Payment Modal
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  applicant: Applicant;
  onClose: () => void;
  /** Called after payment confirmed — triggers E-Sign navigation */
  onPaymentComplete: (applicant: Applicant, method: PaymentMethod) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ applicant, onClose, onPaymentComplete }) => {
  const [step,           setStep]           = useState<PaymentStep>('select');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [fieldValues,    setFieldValues]    = useState<Record<string, string>>({});
  const [agreed,         setAgreed]         = useState(false);
  const [fieldError,     setFieldError]     = useState('');

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const depositAmt = applicant.monthlyRent * 2; // security deposit = 2 months rent

  const handleConfirm = () => {
    if (!agreed) { setFieldError('You must agree to the payment terms.'); return; }
    const missing = method?.fields.find(f => !fieldValues[f.id]?.trim());
    if (missing) { setFieldError(`Please fill in: ${missing.label}`); return; }
    setFieldError('');
    setStep('processing');
    // Simulate async payment processing (1.8 s)
    setTimeout(() => setStep('done'), 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-900 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" />
              {step === 'done' ? 'Payment Confirmed' : 'Collect Security Deposit'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{applicant.name} · {applicant.property}</p>
          </div>
          {step !== 'processing' && step !== 'done' && (
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Amount summary */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Security Deposit</p>
              <p className="text-2xl font-extrabold text-zinc-900 mt-1">${depositAmt.toLocaleString()}</p>
              <p className="text-xs text-zinc-400 mt-0.5">2 months · ${applicant.monthlyRent.toLocaleString()}/mo</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Property</p>
              <p className="text-sm font-semibold text-zinc-800 mt-1">{applicant.property}</p>
              <p className="text-xs text-zinc-500">{applicant.propertyType}</p>
            </div>
          </div>

          {/* ── STEP: SELECT METHOD ── */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Payment Method</p>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMethod(m.id); setFieldValues({}); setFieldError(''); }}
                    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border text-left transition-all
                      ${selectedMethod === m.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="shrink-0">{m.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900">{m.name}</span>
                        {m.tag && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.tagColor}`}>{m.tag}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>
                    </div>
                    {selectedMethod === m.id && <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedMethod}
                onClick={() => setStep('confirm')}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed
                  text-white font-bold text-sm py-3.5 rounded-xl transition mt-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── STEP: CONFIRM / FILL FIELDS ── */}
          {step === 'confirm' && method && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {method.logo}
                <div>
                  <p className="text-sm font-bold text-zinc-900">{method.name}</p>
                  <p className="text-xs text-zinc-400">{method.description}</p>
                </div>
                <button onClick={() => setStep('select')} className="ml-auto text-xs text-indigo-600 hover:underline font-semibold">
                  Change
                </button>
              </div>

              {/* Dynamic payment fields */}
              {method.fields.map(f => (
                <div key={f.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={fieldValues[f.id] ?? ''}
                    onChange={e => setFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm
                      focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                  />
                </div>
              ))}

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group mt-1">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer shrink-0" />
                <span className="text-xs text-zinc-500 leading-relaxed">
                  I confirm this security deposit payment of <span className="font-bold text-zinc-800">${depositAmt.toLocaleString()}</span> for
                  <span className="font-bold text-zinc-800"> {applicant.property}</span> on behalf of
                  <span className="font-bold text-zinc-800"> {applicant.name}</span>. This transaction is final upon confirmation.
                </span>
              </label>

              {fieldError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{fieldError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('select')}
                  className="flex-1 border border-zinc-200 text-zinc-600 font-semibold text-sm rounded-xl py-3 hover:bg-zinc-50 transition">
                  Back
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl py-3 transition flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" /> Confirm Payment
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: PROCESSING ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="font-bold text-zinc-900">Processing Payment…</p>
              <p className="text-sm text-zinc-400">Verifying with {method?.name}. Do not close this window.</p>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center text-center gap-5 py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center">
                <CheckSquare2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Payment Received!</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  ${depositAmt.toLocaleString()} security deposit collected from{' '}
                  <span className="font-bold text-zinc-800">{applicant.name}</span> via{' '}
                  <span className="font-bold text-zinc-800">{method?.name}</span>.
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm w-full space-y-1.5">
                {[
                  ['Transaction ID', `TXN-${Date.now().toString().slice(-8)}`],
                  ['Amount',         `$${depositAmt.toLocaleString()}`],
                  ['Method',         method?.name ?? ''],
                  ['Date',           new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-zinc-400 font-medium">{k}</span>
                    <span className="font-bold text-zinc-800">{v}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onPaymentComplete(applicant, selectedMethod!)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-4 rounded-xl transition"
              >
                <PenTool className="h-4 w-4" />
                Proceed to E-Sign Contract
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ScreeningStatus, string> = {
  'Screening Passed':    'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Under Review':        'bg-blue-100    text-blue-800    border-blue-200',
  'Interview Scheduled': 'bg-orange-100  text-orange-800  border-orange-200',
  'Action Required':     'bg-rose-100    text-rose-800    border-rose-200',
};

const StatusBadge: React.FC<{ status: ScreeningStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

const ScoreMeter: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-semibold text-zinc-600">
      <span>{label}</span><span>{value} / {max}</span>
    </div>
    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Applicant Drawer
// ─────────────────────────────────────────────────────────────────────────────

interface DrawerProps {
  applicant: Applicant;
  onClose: () => void;
  onOpenPayment: (applicant: Applicant) => void;
  onDecline: (id: string) => void;
}

const ApplicantDrawer: React.FC<DrawerProps> = ({ applicant: a, onClose, onOpenPayment, onDecline }) => {
  const ratioGood = a.incomeRatio <= 0.33;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {a.initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{a.name}</h2>
              <p className="text-xs text-zinc-400">{a.propertyType} application</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Section 1: Details */}
          <div className="px-6 py-5 space-y-4 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Applicant Details</h3>
            {[
              { icon: <Mail     className="h-4 w-4" />, label: 'Email',    value: a.email },
              { icon: <Phone    className="h-4 w-4" />, label: 'Phone',    value: a.phone },
              { icon: <Home     className="h-4 w-4" />, label: 'Property', value: a.property },
              { icon: <Calendar className="h-4 w-4" />, label: 'Applied',  value: a.appliedDate },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500 shrink-0">{row.icon}</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{row.label}</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-0.5">{row.value}</p>
                </div>
              </div>
            ))}
            <StatusBadge status={a.status} />
          </div>

          {/* Section 2: Screening */}
          <div className="px-6 py-5 space-y-4 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Screening Criteria</h3>
            <ScoreMeter label="Credit Score" value={a.creditScore} max={850}
              color={a.creditScore >= 700 ? 'bg-emerald-500' : a.creditScore >= 650 ? 'bg-amber-400' : 'bg-rose-500'} />
            <ScoreMeter label={`Income-to-Rent (${Math.round(a.incomeRatio * 100)}%)`}
              value={Math.round(a.incomeRatio * 100)} max={50}
              color={ratioGood ? 'bg-emerald-500' : 'bg-amber-400'} />
            <div className="space-y-2 pt-1">
              {[
                { label: 'Credit Report Verified',     pass: a.creditVerified },
                { label: 'Identity Document Verified', pass: a.idVerified },
                { label: 'Income-to-Rent ≤ 33%',       pass: ratioGood },
              ].map(c => (
                <div key={c.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${c.pass ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  {c.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  <span className={`text-sm font-semibold ${c.pass ? 'text-emerald-800' : 'text-rose-700'}`}>{c.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Monthly Income</p>
                <p className="text-lg font-extrabold text-zinc-900 mt-1">${a.monthlyIncome.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Monthly Rent</p>
                <p className="text-lg font-extrabold text-zinc-900 mt-1">${a.monthlyRent.toLocaleString()}</p>
              </div>
            </div>
            {a.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-blue-800">{a.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Actions — Accept opens Payment Modal first */}
        <div className="px-6 py-5 border-t border-zinc-100 space-y-3 bg-white">
          <button
            onClick={() => onOpenPayment(a)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
              text-white font-bold text-sm py-3.5 rounded-xl transition shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Accept & Collect Deposit
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { onDecline(a.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 border-2 border-rose-500 text-rose-600
              hover:bg-rose-50 font-bold text-sm py-3.5 rounded-xl transition"
          >
            <X className="h-4 w-4" /> Decline Application
          </button>
        </div>
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

interface FindTenantsPageProps {
  onNavigateToESign?: (applicant: Applicant) => void;
}

export const FindTenantsPage: React.FC<FindTenantsPageProps> = ({ onNavigateToESign }) => {

  const [activeFilter,      setActiveFilter]      = useState<ActiveFilter>('all');
  const [searchQuery,       setSearchQuery]        = useState('');
  // selectedApplicant: null = drawer closed; Applicant object = drawer open
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  // paymentApplicant: null = payment modal closed; Applicant = modal open
  const [paymentApplicant,  setPaymentApplicant]  = useState<Applicant | null>(null);
  // statusOverrides tracks local status changes (decline → 'Action Required')
  const [statusOverrides,   setStatusOverrides]   = useState<Record<string, ScreeningStatus>>({});

  const allApplicants = useMemo(
    () => APPLICANTS.map(a => ({ ...a, status: statusOverrides[a.id] ?? a.status })),
    [statusOverrides]
  );

  const counts = useMemo(() => ({
    listings:     4,
    applications: allApplicants.length,
    screenings:   allApplicants.filter(a => a.status === 'Under Review' || a.status === 'Interview Scheduled').length,
  }), [allApplicants]);

  const filtered = useMemo(() => {
    let list = allApplicants;
    if (activeFilter === 'applications') list = list.filter(a => a.status !== 'Screening Passed');
    if (activeFilter === 'screenings')   list = list.filter(a => a.status === 'Under Review' || a.status === 'Interview Scheduled');
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) || a.property.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
    return list;
  }, [allApplicants, activeFilter, searchQuery]);

  /** Decline: mark status as Action Required client-side */
  const handleDecline = (id: string) =>
    setStatusOverrides(prev => ({ ...prev, [id]: 'Action Required' }));

  /** "Accept & Collect Deposit" → open Payment Modal */
  const handleOpenPayment = (applicant: Applicant) => {
    setSelectedApplicant(null); // close drawer
    setPaymentApplicant(applicant); // open payment modal
  };

  /** Payment complete → update status to 'Screening Passed' then navigate to E-Sign */
  const handlePaymentComplete = (applicant: Applicant, _method: PaymentMethod) => {
    setStatusOverrides(prev => ({ ...prev, [applicant.id]: 'Screening Passed' }));
    setPaymentApplicant(null);
    if (onNavigateToESign) onNavigateToESign(applicant);
  };

  const METRIC_CARDS = [
    { id: 'listings',     label: 'Active Listings',    value: counts.listings,     icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'applications', label: 'New Applications',   value: counts.applications, icon: Users,    color: 'text-blue-600   bg-blue-50'   },
    { id: 'screenings',   label: 'Pending Screenings', value: counts.screenings,   icon: Clock,    color: 'text-amber-600  bg-amber-50'  },
  ] as const;

  return (
    <div className="p-6 sm:p-8 bg-zinc-50 min-h-screen font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Find Tenants & Tenant Screening</h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage applications, screen tenants, and collect deposits.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
          <Plus className="h-4 w-4" /> Post New Listing
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {METRIC_CARDS.map(card => {
          const Icon     = card.icon;
          const isActive = activeFilter === card.id;
          return (
            <button key={card.id}
              onClick={() => setActiveFilter(prev => prev === card.id ? 'all' : card.id as ActiveFilter)}
              className={`flex items-center gap-4 p-6 rounded-xl border text-left transition-all
                ${isActive ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-zinc-200 shadow-sm hover:border-indigo-300 hover:shadow-md'}`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : card.color}`}>
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : ''}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isActive ? 'text-indigo-100' : 'text-zinc-500'}`}>{card.label}</p>
                <p className={`text-3xl font-bold mt-0.5 ${isActive ? 'text-white' : 'text-zinc-900'}`}>{card.value}</p>
              </div>
              {isActive && <Star className="h-4 w-4 text-white/60 ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Recent Applications</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {activeFilter !== 'all' && <span className="text-indigo-600 font-semibold"> · filtered</span>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input type="text" placeholder="Search by name, property, or email..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 border border-zinc-200 rounded-xl text-sm w-full sm:w-72
                focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                {['Applicant', 'Property', 'Applied', 'Credit', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-3.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-zinc-400 font-semibold">No applicants match your filter.</p>
                    <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                      className="mt-2 text-xs text-indigo-600 hover:underline font-semibold">Clear filters</button>
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id} onClick={() => setSelectedApplicant(a)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{a.initials}</div>
                      <div>
                        <p className="font-semibold text-zinc-900 text-sm">{a.name}</p>
                        <p className="text-xs text-zinc-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700 font-medium">{a.property}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{a.appliedDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${a.creditScore >= 700 ? 'bg-emerald-500' : a.creditScore >= 650 ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ width: `${(a.creditScore / 850) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-zinc-600">{a.creditScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-6 py-4"><ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-indigo-500 transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400">Click any row to view screening details and collect deposit.</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>{allApplicants.filter(a => a.status === 'Screening Passed').length} passed screening</span>
          </div>
        </div>
      </div>

      {/* Applicant detail drawer */}
      {selectedApplicant && (
        <ApplicantDrawer
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onOpenPayment={handleOpenPayment}
          onDecline={handleDecline}
        />
      )}

      {/* Payment modal — shown after clicking Accept in drawer */}
      {paymentApplicant && (
        <PaymentModal
          applicant={paymentApplicant}
          onClose={() => setPaymentApplicant(null)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export type { Applicant };
