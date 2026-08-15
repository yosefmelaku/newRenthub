import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Wrench, MessageSquareText, LayoutDashboard, User, Building2, ChevronDown, CheckCircle2, Clock, AlertCircle, Send, ShieldCheck, LogOut, Menu, X, Home, ExternalLink } from 'lucide-react';
import type { AppUser, Booking, PropertyListing } from '../../types';

const API_URL = '/api';

type MReqStatus = 'pending' | 'in_progress' | 'completed';
interface MReq { id: string | number; title: string; description: string; status: MReqStatus; created_at?: string; }

const statusStyle: Record<MReqStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: <AlertCircle className="h-3.5 w-3.5" /> },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const TenantMaintenanceTab: React.FC<{ user: AppUser }> = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState<MReq[]>([]);

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/maintenance`);
      if (res.ok) {
        const all: MReq[] = await res.json();
        // Show only this tenant's requests (filter by renter_id field if available, else show all)
        setMyRequests(all);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          property_id: null,
          status: 'pending',
          viewable_by: 'owner',
          renter_id: user.email,
          renter_name: user.name,
        }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        fetchMyRequests();
      }
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Submit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-500" /> Submit Maintenance Request
        </h3>
        <p className="text-sm text-gray-500">Your request will be sent directly to the property owner.</p>

        {submitted && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Request sent! The owner has been notified.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Issue Title</label>
            <input
              type="text" required
              placeholder="e.g. Leaking faucet in bathroom"
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Description</label>
            <textarea
              required rows={3}
              placeholder="Describe the problem in detail..."
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
          <button
            type="submit" disabled={submitting || !title.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending...' : 'Send Request to Owner'}
          </button>
        </form>
      </div>

      {/* My Tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-800">My Tickets ({myRequests.length})</h4>
        {myRequests.length === 0 ? (
          <p className="text-sm text-gray-400">No requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map(r => {
              const s = statusStyle[r.status] ?? statusStyle.pending;
              return (
                <div key={r.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{r.title}</p>
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

  const sidebarItems: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'lease', label: 'My Lease & Property', icon: <Building2 className="h-5 w-5" /> },
    { id: 'payments', label: 'Payments & Billing', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'maintenance', label: 'Maintenance Requests', icon: <Wrench className="h-5 w-5" /> },
    { id: 'inbox', label: 'Inbox & Notifications', icon: <MessageSquareText className="h-5 w-5" /> },
    { id: 'profile', label: 'Account Settings', icon: <User className="h-5 w-5" /> },
  ];

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

      {/* ════════════════════════════════════════════════
          TOP BAR — full width, single row
          On desktop: logo zone (256px) + header zone (rest)
          On mobile:  hamburger | page title | user avatar
      ════════════════════════════════════════════════ */}
      <div className="flex items-stretch w-full shrink-0 h-16 z-30 relative">

        {/* Logo zone — white, 256px on lg+, full-width-aware on mobile */}
        <div className="flex items-center gap-3 px-5 bg-white border-b border-slate-200 border-r border-slate-100 shrink-0 w-16 lg:w-64">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800 transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo text — visible on lg+, clicking goes back to home/explore */}
          <button
            onClick={onBrowseMore}
            className="hidden lg:flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
            title="Back to Browse Properties"
          >
            <div className="bg-emerald-500 text-white p-1.5 rounded">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              Rent<span className="text-emerald-500">Hub</span>
            </span>
          </button>

          {/* Mobile: shield icon as logo mark, also clickable */}
          <button
            onClick={onBrowseMore}
            className="lg:hidden flex items-center hover:opacity-80 transition"
            title="Back to home"
          >
            <div className="bg-emerald-500 text-white p-1.5 rounded">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Header zone — fills remaining space */}
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
            {/* Name hidden on very small screens */}
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
                  Logout / Switch Account
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ════════════════════════════════════════════════
          BODY — sidebar + content
      ════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Mobile overlay backdrop ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar nav ──
            Desktop: static 256px column
            Mobile:  fixed slide-in drawer from left, z-50
        ── */}
        <aside
          className={`
            bg-[#0e223d] text-slate-300 flex flex-col shrink-0
            fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300
            lg:static lg:translate-x-0 lg:z-auto lg:h-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile drawer header — shows logo + close button */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#1b3252] lg:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-1.5 rounded">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Rent<span className="text-emerald-400">Hub</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#1b3252] text-white'
                    : 'hover:bg-[#1b3252] hover:text-white text-slate-300'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-[#1b3252] my-3" />

            {/* Back to home — lets user browse properties or register another account */}
            <button
              onClick={onBrowseMore}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:bg-[#1b3252] hover:text-white text-slate-400"
            >
              <Home className="h-5 w-5" />
              <span>Browse Properties</span>
            </button>

            {/* Switch / new account — logs out so they can sign in as owner etc. */}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:bg-[#1b3252] hover:text-emerald-400 text-slate-400"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Switch Account</span>
            </button>
          </nav>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-6 py-5 text-slate-400 hover:text-rose-400 transition text-sm font-medium border-t border-[#1b3252]"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </aside>

        {/* ── Main scrollable content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl w-full mx-auto">
            {renderTabContent()}
          </div>
        </main>

      </div>
    </div>
  );
};
