import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, CreditCard, Wrench, MessageSquareText, User,
  ChevronDown, CheckCircle2, Clock, AlertCircle, Send,
  Menu, Building, AlertTriangle, CheckSquare, Loader2,
  ShieldAlert, Trash2, X,
} from 'lucide-react';
import type { AppUser, Booking, PropertyListing } from '../../types';
import { TenantSidebar, TENANT_NAV_ITEMS } from '../../components/TenantSidebar';

const API_URL = '/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MReqStatus = 'pending' | 'in_progress' | 'completed';
type Severity   = 'low' | 'medium' | 'emergency';

interface MReq {
  id: string | number;
  title: string;
  description: string;
  status: MReqStatus;
  property_title?: string;
  severity?: Severity;
  created_at?: string;
  // Flag so we can highlight newly added rows
  isNew?: boolean;
}

interface RentedProperty {
  id: string | number;
  title: string;
  address: string;
  type: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback sample properties — used when the API has no active leases
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_PROPERTIES: RentedProperty[] = [
  { id: 'sample-1', title: 'Luxury Villa',     address: '123 Sunrise Valley Lane, Beverly Hills', type: 'Villa'     },
  { id: 'sample-2', title: 'Downtown Studio',  address: 'Unit B, 88 Commerce Blvd, Chicago',      type: 'Studio'    },
  { id: 'sample-3', title: 'Garden Apartment', address: '9 Palm Street, Unit 7, Miami',            type: 'Apartment' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<MReqStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50   text-amber-700   border-amber-200',   icon: <Clock        className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In Progress', cls: 'bg-blue-50    text-blue-700    border-blue-200',    icon: <AlertCircle  className="h-3.5 w-3.5" /> },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; emoji: string; inactive: string; active: string }> = {
  low:       { label: 'Low',       emoji: '🟢', inactive: 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700', active: 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' },
  medium:    { label: 'Medium',    emoji: '🟡', inactive: 'border-gray-200 text-gray-500 hover:border-amber-400  hover:bg-amber-50  hover:text-amber-700',    active: 'border-amber-400   bg-amber-50   text-amber-700   shadow-sm' },
  emergency: { label: 'Emergency', emoji: '🔴', inactive: 'border-gray-200 text-gray-500 hover:border-rose-400   hover:bg-rose-50   hover:text-rose-700',    active: 'border-rose-500    bg-rose-50    text-rose-700    shadow-sm' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide-in Toast component — fixed top-right corner
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible, onDismiss }) => (
  <div
    role="alert"
    aria-live="polite"
    className={`
      fixed top-5 right-5 z-[9999] flex items-start gap-3
      bg-white border rounded-2xl shadow-2xl px-5 py-4 max-w-sm w-full
      transition-all duration-500 ease-out
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
      ${type === 'success' ? 'border-emerald-300' : 'border-rose-300'}
    `}
  >
    {/* Left accent bar */}
    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

    {/* Icon */}
    <div className={`shrink-0 p-1.5 rounded-full mt-0.5 ${type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
      {type === 'success'
        ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        : <ShieldAlert  className="h-4 w-4 text-rose-600" />}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-bold ${type === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
        {type === 'success' ? 'Request Sent!' : 'Submission Failed'}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{message}</p>
    </div>

    {/* Dismiss button */}
    <button
      onClick={onDismiss}
      className="shrink-0 text-gray-300 hover:text-gray-500 transition mt-0.5"
      aria-label="Dismiss notification"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Maintenance Tab
// ─────────────────────────────────────────────────────────────────────────────

const TenantMaintenanceTab: React.FC<{ user: AppUser }> = ({ user }) => {

  // ── Form state — fully controlled inputs ─────────────────────────────────
  const [propertyId,  setPropertyId]  = useState('');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [severity,    setSeverity]    = useState<Severity>('low');

  // ── Data state ────────────────────────────────────────────────────────────
  const [properties,   setProperties]  = useState<RentedProperty[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [myRequests,   setMyRequests]  = useState<MReq[]>([]);

  // ── Submission state ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');

  // ── Toast notification state ──────────────────────────────────────────────
  // showNotification controls the slide-in; the timer ref lets us cancel
  // auto-dismiss if the user manually closes the toast first.
  const [showNotification, setShowNotification] = useState(false);
  const [toastMsg,         setToastMsg]         = useState('');
  const [toastType,        setToastType]        = useState<'success' | 'error'>('success');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Show a toast and auto-dismiss after 4 seconds. */
  const triggerToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setShowNotification(true);
    // Clear any existing timer before starting a new one
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowNotification(false), 4000);
  }, []);

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowNotification(false);
  };

  // Cleanup on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchRentedProperties = async () => {
    setLoadingProps(true);
    try {
      const res = await fetch(
        `${API_URL}/tenant/my-rented-properties?tenantId=${encodeURIComponent(user.email ?? '')}`
      );
      if (res.ok) {
        const data: RentedProperty[] = await res.json();
        setProperties(data.length > 0 ? data : SAMPLE_PROPERTIES);
      } else {
        setProperties(SAMPLE_PROPERTIES);
      }
    } catch {
      setProperties(SAMPLE_PROPERTIES);
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/maintenance`);
      if (res.ok) setMyRequests(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchRentedProperties();
    fetchMyRequests();
  }, []);

  // ── Submit & reset handler ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!propertyId)         { setFormError('Please select the property you are renting.');    return; }
    if (!title.trim())       { setFormError('Please enter an issue title.');                   return; }
    if (!description.trim()) { setFormError('Please describe the problem in detail.');         return; }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/maintenance/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:  propertyId,
          issue_title:  title.trim(),
          description:  description.trim(),
          severity,
          tenant_id:    user.email,
          renter_name:  user.name,
          status:       'pending',
          viewable_by:  'owner',
        }),
      });

      if (res.ok || res.status === 201) {
        // ── Step 1: Instantly clear all form fields ────────────────────────
        // Setting state back to empty strings removes the text from the
        // controlled inputs immediately — no stale values remain on screen.
        setPropertyId('');
        setTitle('');
        setDescription('');
        setSeverity('low');
        setFormError('');

        // ── Step 2: Optimistically prepend the new ticket to the ledger ───
        // This makes the list update instantly without waiting for a
        // re-fetch, giving the user immediate visual confirmation.
        const selectedProp = properties.find(p => String(p.id) === String(propertyId));
        const optimisticTicket: MReq = {
          id:            `opt-${Date.now()}`,
          title:         title.trim(),
          description:   description.trim(),
          status:        'pending',
          severity,
          property_title: selectedProp ? `${selectedProp.title} — ${selectedProp.address}` : undefined,
          created_at:    new Date().toISOString(),
          isNew:         true,
        };
        setMyRequests(prev => [optimisticTicket, ...prev]);

        // ── Step 3: Fire the slide-in success toast ────────────────────────
        triggerToast(
          'Success! Your request has been sent to the property owner.',
          'success'
        );

        // ── Step 4: Background sync to get the real server-assigned id ────
        // We do this silently so the instant UI update is never blocked.
        setTimeout(fetchMyRequests, 1500);

      } else {
        const body = await res.json().catch(() => ({}));
        const msg  = body.message ?? 'Submission failed. Please try again.';
        setFormError(msg);
        triggerToast(msg, 'error');
      }
    } catch {
      const msg = 'Network error — please check your connection and retry.';
      setFormError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = propertyId && title.trim() && description.trim();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Slide-in Toast — fixed to viewport top-right ── */}
      <Toast
        message={toastMsg}
        type={toastType}
        visible={showNotification}
        onDismiss={dismissToast}
      />

      <div className="animate-fadeIn space-y-6">

        {/* ── Maintenance Request Form ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Card header bar */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3">
            <div className="bg-amber-400/20 p-2 rounded-xl">
              <Wrench className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit Maintenance Request</h3>
              <p className="text-xs text-slate-400">Ticket is routed directly to your property owner</p>
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* Inline form error */}
            {formError && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* ── 1. Property selector ── */}
              <div className="space-y-1.5">
                <label htmlFor="property-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Select Your Rented Property / Space
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    id="property-select"
                    required
                    value={propertyId}
                    onChange={e => { setPropertyId(e.target.value); setFormError(''); }}
                    disabled={loadingProps}
                    className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm appearance-none bg-white
                      focus:outline-none focus:ring-2 transition cursor-pointer
                      ${propertyId
                        ? 'border-emerald-400 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/10'
                        : 'border-gray-200 text-gray-400 focus:border-slate-400 focus:ring-slate-400/10'}
                      ${loadingProps ? 'cursor-wait opacity-60' : ''}`}
                  >
                    <option value="">
                      {loadingProps ? 'Loading your properties…' : '— Select the property this issue relates to —'}
                    </option>
                    {properties.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title} — {p.address}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loadingProps
                      ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
                {propertyId && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> Property selected — ticket will be routed to owner
                  </p>
                )}
              </div>

              {/* ── 2. Issue title — controlled input ── */}
              <div className="space-y-1.5">
                <label htmlFor="issue-title" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Issue Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="issue-title"
                  type="text"
                  required
                  // value bound directly to state — React fully controls this input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setFormError(''); }}
                  placeholder="e.g. Leaking faucet in bathroom"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/10 transition
                    placeholder:text-gray-300"
                />
                {/* Live char counter */}
                <p className={`text-right text-[10px] font-medium ${title.length > 80 ? 'text-rose-500' : 'text-gray-300'}`}>
                  {title.length} / 100
                </p>
              </div>

              {/* ── 3. Description — controlled textarea ── */}
              <div className="space-y-1.5">
                <label htmlFor="issue-desc" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="issue-desc"
                  required
                  rows={4}
                  // value bound directly to state — ensures clearing works
                  value={description}
                  onChange={e => { setDescription(e.target.value); setFormError(''); }}
                  placeholder="Describe the problem — location, when it started, any photos you can attach…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none
                    focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/10 transition
                    placeholder:text-gray-300"
                />
              </div>

              {/* ── 4. Severity selector ── */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(Object.entries(SEVERITY_CONFIG) as [Severity, typeof SEVERITY_CONFIG[Severity]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSeverity(key)}
                      className={`flex items-center justify-center gap-2 border rounded-xl py-2.5 text-sm font-semibold transition-all
                        ${severity === key ? cfg.active : cfg.inactive}`}
                    >
                      <span className="text-base leading-none">{cfg.emoji}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>
                {severity === 'emergency' && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <p className="text-xs text-rose-700 font-semibold">
                      Emergency tickets are flagged for immediate owner response.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Submit button ── */}
              <button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full flex items-center justify-center gap-2.5
                  bg-slate-800 hover:bg-slate-700 active:bg-slate-900
                  disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
                  text-white font-bold py-4 rounded-xl text-sm transition shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending to Owner…</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Maintenance Request to Owner</>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* ── My Tickets Ledger ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Ledger header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-600" />
              My Tickets
              <span className="ml-1 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {myRequests.length}
              </span>
            </h4>
            {myRequests.length > 0 && (
              <button
                onClick={fetchMyRequests}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition"
              >
                Refresh
              </button>
            )}
          </div>

          <div className="p-4">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">No requests submitted yet.</p>
                <p className="text-xs text-gray-300">Your tickets will appear here once submitted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r, i) => {
                  const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                  return (
                    <div
                      key={r.id}
                      // New ticket rows get a brief highlight ring that fades
                      className={`flex items-start justify-between gap-3 border rounded-xl p-4 transition-all duration-700
                        ${i === 0 && r.isNew
                          ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 truncate">{r.title}</p>
                          {r.severity && r.severity !== 'low' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                              ${r.severity === 'emergency'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {SEVERITY_CONFIG[r.severity].emoji} {SEVERITY_CONFIG[r.severity].label}
                            </span>
                          )}
                          {i === 0 && r.isNew && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Just sent
                            </span>
                          )}
                        </div>
                        {r.property_title && (
                          <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                            <Building className="h-3 w-3" /> {r.property_title}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                        {r.created_at && (
                          <p className="text-[10px] text-gray-300">
                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <span className={`flex items-center gap-1 shrink-0 text-xs font-semibold border px-2.5 py-1 rounded-full ${s.cls}`}>
                        {s.icon} {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Property selector — THE FIX ─────────────────────────── */}
          {/*
           * This dropdown solves the core bug: without a property_id the
           * maintenance ticket could not be assigned to the correct owner.
           * The selected value is sent as `property_id` in the POST body
           * so the backend can JOIN to properties → find the owner_id →
           * and route notifications/tickets to the right person.
           */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Select Your Rented Property / Space
              <span className="text-rose-400 ml-1">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                required
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                disabled={loadingProps}
                className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm appearance-none bg-white
                  focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition
                  ${propertyId ? 'border-emerald-400 text-gray-900' : 'border-gray-200 text-gray-400'}
                  ${loadingProps ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                <option value="">
                  {loadingProps ? 'Loading your properties…' : '— Choose the property this issue relates to —'}
                </option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.address}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {loadingProps
                  ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </div>
            {propertyId && (
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckSquare className="h-3 w-3" />
                Property selected — ticket will be routed to the owner
              </p>
            )}
          </div>

          {/* ── 2. Issue title ── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Issue Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" required
              placeholder="e.g. Leaking faucet in bathroom"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
            />
          </div>

          {/* ── 3. Description ── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required rows={3}
              placeholder="Describe the problem in detail — location, when it started, any photos…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none
                focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
            />
          </div>

          {/* ── 4. Severity selector ── */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Severity Level
            </label>
            <div className="flex gap-3">
              {(Object.entries(SEVERITY_CONFIG) as [Severity, typeof SEVERITY_CONFIG[Severity]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeverity(key)}
                  className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2.5 text-sm transition
                    ${severity === key ? cfg.activeCls : cfg.cls}`}
                >
                  <span>{cfg.icon}</span>
                  <span className="font-semibold">{cfg.label}</span>
                </button>
              ))}
            </div>
            {severity === 'emergency' && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Emergency tickets are flagged for immediate owner attention.
              </p>
            )}
          </div>

          {/* ── Submit button ── */}
          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full flex items-center justify-center gap-2
              bg-emerald-600 hover:bg-emerald-700
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              : <><Send className="h-4 w-4" /> Send Maintenance Request to Owner</>}
          </button>
        </form>
      </div>

      {/* ── My Tickets list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-600" />
          My Tickets ({myRequests.length})
        </h4>
        {myRequests.length === 0 ? (
          <p className="text-sm text-gray-400">No requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map(r => {
              const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
              return (
                <div key={r.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">{r.title}</p>
                    {r.property_title && (
                      <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                        <Building className="h-3 w-3" /> {r.property_title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                  </div>
                  <span className={`flex items-center gap-1 shrink-0 text-xs font-semibold border px-2.5 py-1 rounded-full ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardPageProps {
  user: AppUser;
  bookings: Booking[];
  listings: PropertyListing[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  loading: boolean;
  onRefresh: () => void;
  onBrowseMore: () => void;
  onLogout: () => void;
  onUpdateUser: (user: AppUser) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onLogout,
  onUpdateUser,
  onBrowseMore,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState(user.address || '');
  const [phone, setPhone] = useState(user.phone || '');

  const handleUpdateProfile = () => {
    onUpdateUser({ ...user, name, address, phone });
    setEditing(false);
  };
  
  const handleAccountSettingsClick = () => {
    setActiveTab('profile');
    setShowDropdown(false);
  };

  const sidebarItems = TENANT_NAV_ITEMS;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fadeIn space-y-6">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Welcome back, Tenant!</h3>
              <p className="text-gray-500 text-sm mt-1">Today is {new Date().toLocaleDateString()}</p>
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm font-semibold">
                Active lease ends in 45 days.
              </div>
            </div>

            {/* Quick Actions & Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Card */}
              <div className="bg-white rounded-2xl border border-blue-50 p-6 shadow-sm border-l-4 border-l-blue-500">
                <h4 className="font-bold text-blue-900 flex items-center gap-2"><CreditCard className="h-5 w-5"/> NEXT RENT DUE</h4>
                <p className="text-blue-800 mt-2 font-semibold text-lg">$2,400.00 — Due in 5 Days</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl mt-4 font-semibold text-sm">Pay Now</button>
              </div>

              {/* Maintenance Card */}
              <div className="bg-white rounded-2xl border border-amber-50 p-6 shadow-sm border-l-4 border-l-amber-500">
                <h4 className="font-bold text-amber-900 flex items-center gap-2"><Wrench className="h-5 w-5"/> MAINTENANCE STATUS</h4>
                <p className="text-amber-800 mt-2 font-semibold text-lg">Ticket #1042: Clogged Sink</p>
                <p className="text-sm text-amber-600 mt-1">Status: [ Technician Sent ]</p>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-600"/> UPCOMING EVENTS / ALERTS</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Annual fire inspection this Thursday at 10:00 AM</li>
                <li>• Lease renewal window opens next month</li>
              </ul>
            </div>
          </div>
        );
      case 'lease':
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Property Details</h3>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-2">
                  <span className="font-semibold text-gray-800">Address:</span> <span>123 Sunrise Valley Lane</span>
                  <span className="font-semibold text-gray-800">Unit:</span> <span>#4 (Villa)</span>
                  <span className="font-semibold text-gray-800">Type:</span> <span>Luxury Villa</span>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-lg font-bold text-gray-900">Lease Agreement</h3>
                <p className="text-sm text-gray-600">Lease signed on January 15, 2026.</p>
                <button 
                  onClick={() => alert('Opening PDF viewer...')}
                  className="block w-full bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-semibold border border-emerald-200"
                >
                  View Signed Contract
                </button>
                <button 
                  onClick={() => alert('Downloading PDF...')}
                  className="block w-full bg-slate-100 text-slate-800 p-3 rounded-xl text-sm font-semibold"
                >
                  Download PDF
                </button>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h3 className="text-lg font-bold text-gray-900">Owner Contact</h3>
                <p className="text-sm text-gray-600">Property Owner: Alex Johnson</p>
                <button 
                  onClick={() => alert('Opening chat with owner...')}
                  className="block w-full bg-blue-600 text-white p-3 rounded-xl text-sm font-semibold"
                >
                  Message Property Owner
                </button>
              </div>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold">Current Balance: $1,200</h3>
              <button className="bg-emerald-600 text-white p-3 rounded-xl text-sm font-semibold w-full">Pay Rent Now (Stripe/PayPal)</button>
              <h4 className="text-md font-bold mt-4">Transaction History</h4>
              <div className="text-sm text-gray-600">Past Payments Table placeholder...</div>
            </div>
          </div>
        );
      case 'maintenance':
        return (
          <TenantMaintenanceTab user={user} />
        );
      case 'inbox':
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold">Inbox</h3>
              <p className="text-sm">No new messages.</p>
              <h4 className="text-md font-bold mt-4">Alerts</h4>
              <p className="text-sm">Building maintenance scheduled for July 20th.</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-2xl">
              <h3 className="text-lg font-bold mb-4">Account Settings</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!editing} className="w-full border rounded-lg p-2" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} disabled={!editing} className="w-full border rounded-lg p-2" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} className="w-full border rounded-lg p-2" />
                  </div>
                  {editing ? (
                      <button onClick={handleUpdateProfile} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Save</button>
                  ) : (
                      <button onClick={() => setEditing(true)} className="bg-gray-200 px-4 py-2 rounded-lg">Edit</button>
                  )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Close sidebar when a nav item is tapped on mobile
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full font-sans bg-[#f8fafc]" id="renter-dashboard-container">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="flex items-stretch w-full shrink-0 h-16 z-30 relative">

        {/* Logo zone — white, aligns with sidebar width on desktop */}
        <div className="flex items-center gap-3 px-5 bg-white border-b border-slate-200 border-r border-slate-100 shrink-0 w-16 lg:w-64">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800 transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Logo — desktop */}
          <button
            onClick={onBrowseMore}
            className="hidden lg:flex items-center gap-3 hover:opacity-80 transition"
            title="Back to RentHub marketplace"
          >
            <div className="bg-emerald-500 text-white p-1.5 rounded">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              Rent<span className="text-emerald-500">Hub</span>
            </span>
          </button>
        </div>

        {/* Header zone */}
        <header className="flex-1 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
            {sidebarItems.find(item => item.id === activeTab)?.label ?? 'Dashboard'}
          </h2>

          {/* User dropdown */}
          <div
            className="relative flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition px-3 sm:px-4 py-2 rounded-full text-slate-700 font-semibold text-sm cursor-pointer select-none shrink-0 ml-3"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <User className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline truncate max-w-[120px]">{user.name}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-700 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleAccountSettingsClick}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Account settings
                </button>
                <button
                  onClick={onBrowseMore}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Browse Properties
                </button>
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-3 text-sm text-red-600 font-semibold hover:bg-red-50 transition border-t border-gray-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* TenantSidebar handles its own backdrop and drawer logic */}
        <TenantSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onGoHome={onBrowseMore}
          onLogout={onLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl w-full mx-auto">
            {renderTabContent()}
          </div>
        </main>

      </div>
    </div>
  );
};
