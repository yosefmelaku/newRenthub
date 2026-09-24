import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, CreditCard, Wrench, User,
  ChevronDown, CheckCircle2, Clock, AlertCircle, Send,
  Menu, Building, AlertTriangle, CheckSquare, Loader2,
  ShieldAlert, Trash2, X, FileText, Home, MessageSquareText,
} from 'lucide-react';
import type { AppUser, Booking, PropertyListing } from '../../types';
import { TenantSidebar, TENANT_NAV_ITEMS } from '../../components/TenantSidebar';
import { LeaseContractPage } from './LeaseContractPage';
import jsPDF from 'jspdf';

const API_URL = '/api';

// Helper to get auth headers consistently
const getAuthHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return { 'Content-Type': 'application/json' };
    const user = JSON.parse(raw);
    const token = user.token || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

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
        `${API_URL}/tenant/my-rented-properties?tenantId=${encodeURIComponent(user.email ?? '')}`,
        { headers: getAuthHeaders() }
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
      const res = await fetch(`${API_URL}/maintenance`, { 
        headers: getAuthHeaders() 
      });
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

    console.log('🔍 [TenantMaintenance.handleSubmit] Starting submission...');
    
    // Client-side validation
    if (!propertyId)         { setFormError('Please select the property you are renting.');    return; }
    if (!title.trim())       { setFormError('Please enter an issue title.');                   return; }
    if (!description.trim()) { setFormError('Please describe the problem in detail.');         return; }

    // Debug: Check auth token
    try {
      const raw = localStorage.getItem('currentUser');
      console.log('🔍 [TenantMaintenance.handleSubmit] currentUser in localStorage:', raw ? 'EXISTS' : 'MISSING');
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('🔍 [TenantMaintenance.handleSubmit] User data:', {
          id: parsed.id,
          name: parsed.name,
          role: parsed.role,
          hasToken: !!parsed.token,
          tokenPreview: parsed.token ? `${parsed.token.substring(0, 30)}...` : 'none'
        });
      } else {
        console.error('❌ [TenantMaintenance.handleSubmit] No currentUser found in localStorage!');
        setFormError('Authentication error: Please logout and login again.');
        return;
      }
    } catch (err) {
      console.error('❌ [TenantMaintenance.handleSubmit] Error reading localStorage:', err);
    }

    setSubmitting(true);

    try {
      const rawUser = localStorage.getItem('currentUser');
      const storedUser = rawUser ? JSON.parse(rawUser) : null;
      if (!storedUser?.token) {
        const authMessage = 'Your session is missing or expired. Please log out and sign in again before sending this request.';
        setFormError(authMessage);
        triggerToast(authMessage, 'error');
        return;
      }

      const headers = getAuthHeaders();
      console.log('🔍 [TenantMaintenance.handleSubmit] Request headers:', headers);
      
      const payload = {
        property_id:  propertyId,
        issue_title:  title.trim(),
        description:  description.trim(),
        severity,
        tenant_id:    user.email,
        renter_name:  user.name,
        status:       'pending',
        viewable_by:  'owner',
      };
      console.log('🔍 [TenantMaintenance.handleSubmit] Payload:', payload);
      
      const res = await fetch(`${API_URL}/maintenance/submit`, {
        method:  'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      console.log('🔍 [TenantMaintenance.handleSubmit] Response status:', res.status);
      console.log('🔍 [TenantMaintenance.handleSubmit] Response ok:', res.ok);      
      console.log('🔍 [TenantMaintenance.handleSubmit] Response status:', res.status);
      console.log('🔍 [TenantMaintenance.handleSubmit] Response ok:', res.ok);

      if (res.ok || res.status === 201) {
        console.log('✅ [TenantMaintenance.handleSubmit] Success! Request submitted.');
        
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
        console.error('❌ [TenantMaintenance.handleSubmit] Server error response:', body);
        const msg  = body.message || body.error || 'Submission failed. Please try again.';
        console.error('❌ [TenantMaintenance.handleSubmit] Error message:', msg);
        
        // Show specific help for auth errors
        if (msg.includes('authentication') || msg.includes('token') || msg.includes('Unauthorized')) {
          setFormError('Authentication error: Please logout and login again. Your session may have expired.');
        } else {
          setFormError(msg);
        }
        triggerToast(msg, 'error');
      }
    } catch (err: any) {
      console.error('❌ [TenantMaintenance.handleSubmit] Exception:', err);
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
  onPayRent: (details: {
    propertyTitle: string;
    propertyLocation: string;
    propertyImage: string;
    amount: number;
    dueDate: string;
  }) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onLogout,
  onUpdateUser,
  onBrowseMore,
  onPayRent,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState(user.address || '');
  const [phone, setPhone] = useState(user.phone || '');

  // State for lease contract viewing
  const [viewingLeaseContract, setViewingLeaseContract] = useState(false);
  const [currentLease, setCurrentLease] = useState<any>(null);

  // Sample property data for lease viewing
  const sampleProperty = {
    id: '1',
    title: 'Luxury Villa',
    address: '123 Sunrise Valley Lane, Beverly Hills',
    type: 'Villa',
    rent: 2400,
    securityDeposit: 2400,
  };

  // Handle viewing lease contract
  const handleViewContract = () => {
    const lease = {
      id: '1',
      leaseNumber: 'LSE-2027-00124',
      status: 'active' as const,
      property: {
        title: sampleProperty.title,
        address: sampleProperty.address,
        city: 'Los Angeles, CA 90210',
        type: sampleProperty.type,
        image: '/villa.png',
      },
      tenant: {
        name: user.name,
        email: user.email || 'tenant@example.com',
        phone: user.phone || '+1 (555) 987-6543',
      },
      landlord: {
        name: 'Alex Johnson',
        email: 'alex.johnson@renthub.com',
        phone: '+1 (555) 123-4567',
      },
      term: {
        startDate: '2026-01-15',
        endDate: '2027-01-14',
        duration: 12,
      },
      financial: {
        monthlyRent: sampleProperty.rent,
        securityDeposit: sampleProperty.securityDeposit,
        firstMonthRent: sampleProperty.rent,
        totalUpfront: sampleProperty.rent + sampleProperty.securityDeposit,
        paymentDueDay: 1,
      },
      terms: [
        'Tenant agrees to pay rent on or before the 1st day of each month.',
        'Security deposit will be refunded within 30 days of lease termination, minus any deductions for damages.',
        'Tenant is responsible for utilities including electricity, gas, and internet.',
        'Property must be maintained in good condition. Normal wear and tear is expected.',
        'Property Owner will provide 24-hour notice before entering the property except in emergencies.',
      ],
      signatures: {
        tenant: {
          signed: true,
          date: '2026-01-15',
        },
        landlord: {
          signed: true,
          date: '2026-01-15',
        },
      },
      createdAt: '2026-01-15',
      lastUpdated: '2026-01-15',
    };
    setCurrentLease(lease);
    setViewingLeaseContract(true);
  };

  // Handle downloading PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Residential Lease Agreement', 20, 20);
    
    // Lease Details
    doc.setFontSize(12);
    doc.text(`Lease Number: LSE-2027-00124`, 20, 35);
    doc.text(`Property: ${sampleProperty.title}`, 20, 45);
    doc.text(`Address: ${sampleProperty.address}`, 20, 55);
    doc.text(`Type: ${sampleProperty.type}`, 20, 65);
    
    // Parties
    doc.text('PROPERTY OWNER:', 20, 80);
    doc.text(`Name: Alex Johnson`, 25, 88);
    doc.text(`Email: alex.johnson@renthub.com`, 25, 96);
    
    doc.text('TENANT:', 20, 110);
    doc.text(`Name: ${user.name}`, 25, 118);
    doc.text(`Email: ${user.email || 'N/A'}`, 25, 126);
    
    // Terms
    doc.text('LEASE TERMS:', 20, 140);
    doc.text(`Start Date: January 15, 2026`, 25, 148);
    doc.text(`End Date: January 14, 2027`, 25, 156);
    doc.text(`Monthly Rent: $${sampleProperty.rent}`, 25, 164);
    doc.text(`Security Deposit: $${sampleProperty.securityDeposit}`, 25, 172);
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    
    // Save PDF
    doc.save(`lease-contract-${Date.now()}.pdf`);
  };

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
                <button 
                  onClick={() => onPayRent({
                    propertyTitle: 'Luxury Villa',
                    propertyLocation: '123 Sunrise Valley Lane, Beverly Hills',
                    propertyImage: '/villa.png',
                    amount: 2400.00,
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  })}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl mt-4 font-semibold text-sm transition-colors"
                >
                  Pay Now
                </button>
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
            {/* Header */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Lease Agreement</h2>
              <p className="text-sm text-gray-500 mt-1">View your lease agreement and contract details</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Lease Information */}
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold">Lease Term</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Lease Start</p>
                      <p className="text-gray-900 font-semibold">Jan 15, 2026</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Lease End</p>
                      <p className="text-gray-900 font-semibold">Jan 14, 2027</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Monthly Rent</p>
                      <p className="text-gray-900 font-semibold text-lg">$1,200</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Security Deposit</p>
                      <p className="text-gray-900 font-semibold">$2,400</p>
                    </div>
                  </div>
                </div>

                {/* Lease Agreement Actions */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-gray-900">
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold">Contract Status</h4>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900">Contract Signed</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Signed on January 15, 2026</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleViewContract}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition"
                    >
                      <FileText className="h-4 w-4" />
                      View Contract
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl text-sm font-bold transition"
                    >
                      <Send className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'property':
        return (
          <div className="animate-fadeIn space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">My Property</h2>
              <p className="text-sm text-gray-500 mt-1">View your rental property details and owner contact</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Property Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Luxury Villa</h3>
                    <p className="text-emerald-100 text-sm mt-1">123 Sunrise Valley Lane, Beverly Hills</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold">
                    <Building className="h-3 w-3" />
                    Villa
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6 space-y-6">
                {/* Owner Contact */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold">Property Owner</h4>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-900">Alex Johnson</p>
                    <p className="text-xs text-blue-700 mt-0.5">Available Monday - Friday, 9 AM - 5 PM</p>
                  </div>
                  <button
                    onClick={() => alert('Opening chat with owner...')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Message Owner
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onPayRent({
                        propertyTitle: 'Luxury Villa',
                        propertyLocation: '123 Sunrise Valley Lane, Beverly Hills',
                        propertyImage: '/villa.png',
                        amount: 1200.00,
                        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      })}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Rent
                    </button>
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      <Wrench className="h-4 w-4" />
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold">Current Balance: $1,200</h3>
              <button 
                onClick={() => onPayRent({
                  propertyTitle: 'Luxury Villa',
                  propertyLocation: '123 Sunrise Valley Lane, Beverly Hills',
                  propertyImage: '/villa.png',
                  amount: 1200.00,
                  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl text-sm font-semibold w-full transition-colors"
              >
                Pay Rent Now
              </button>
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

  // If viewing lease contract, show LeaseContractPage instead of dashboard
  if (viewingLeaseContract && currentLease) {
    return (
      <LeaseContractPage
        lease={currentLease}
        onBack={() => setViewingLeaseContract(false)}
        onDownload={handleDownloadPDF}
      />
    );
  }

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
