import React, { useState } from 'react';
import { Calendar, CreditCard, Receipt, FileText, Compass, AlertCircle, RefreshCw, Star, MapPin, ChevronDown, ChevronUp, Bed, Bath, Sparkles, Building2, Wrench, MessageSquareText, LayoutDashboard, User } from 'lucide-react';
import { Sidebar, SidebarItem } from '../../components/Sidebar';
import { AppUser, Booking, PropertyListing } from '../../types';

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
  bookings,
  listings,
  loading,
  onLogout,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const sidebarItems: SidebarItem[] = [
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
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold">Submit Maintenance Ticket</h3>
              <input className="w-full border p-2 rounded-lg" placeholder="Issue Category (e.g., Plumbing)"/>
              <textarea className="w-full border p-2 rounded-lg" placeholder="Describe the issue..."></textarea>
              <button className="bg-emerald-600 text-white p-3 rounded-xl text-sm font-semibold w-full">Submit Request</button>
              <h4 className="text-md font-bold mt-4">Status Tracker</h4>
              <div className="h-2 w-full bg-gray-200 rounded-full mt-2"><div className="h-2 bg-emerald-500 rounded-full w-1/2"></div></div>
            </div>
          </div>
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

  return (
    <div className="flex flex-col lg:flex-row bg-[#f8fafc] min-h-[90vh] rounded-3xl overflow-hidden border border-slate-200/60 shadow-lg font-sans" id="renter-dashboard-container">
      <Sidebar 
        activeSection={activeTab} 
        onSectionChange={setActiveTab} 
        onLogout={onLogout} 
        menuItems={sidebarItems} 
        title="RentHub" 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {sidebarItems.find(item => item.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full text-slate-700 font-semibold text-sm cursor-pointer relative" onClick={() => setShowDropdown(!showDropdown)}>
              <User className="h-5 w-5"/>
              {user.name}
              <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              
              {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                      <button onClick={handleAccountSettingsClick} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">Account settings</button>
                      <button onClick={onLogout} className="block w-full text-left px-4 py-3 text-sm text-red-600 font-semibold hover:bg-red-50">Logout</button>
                  </div>
              )}
          </div>
        </header>

        <main className="p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};
