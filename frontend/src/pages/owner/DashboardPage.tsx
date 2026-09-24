import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Menu, 
  Bell, 
  Lightbulb,
  Briefcase,
  Wrench,
  Calendar,
  ChevronDown,
  CreditCard,
  PenTool,
  Building2
} from 'lucide-react';
import { Sidebar, type SidebarItem } from '../../components/Sidebar';
import { AccountingPage } from './AccountingPage';
import { TaxReportingPage } from './TaxReportingPage';
import { RentGatewayPage } from './RentGatewayPage';
import { ESignPage } from './ESignPage';
import { FindTenantsPage } from './FindTenantsPage';
import type { Applicant } from './FindTenantsPage';
import { MaintenancePage } from './MaintenancePage';
import { MyPropertiesPage } from './MyPropertiesPage';
import type { AppUser } from '../../types';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem('currentUser');
    console.log('🔍 [getAuthHeaders] Raw localStorage:', raw);
    
    if (!raw) {
      console.error('❌ [getAuthHeaders] No currentUser in localStorage');
      return { 'Content-Type': 'application/json' };
    }
    
    const user = JSON.parse(raw);
    console.log('🔍 [getAuthHeaders] Parsed user:', user);
    
    const token = user.token || '';
    console.log('🔍 [getAuthHeaders] Token exists:', !!token, token ? `(${token.substring(0, 30)}...)` : '');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    
    console.log('🔍 [getAuthHeaders] Final headers:', headers);
    return headers;
  } catch (err) {
    console.error('❌ [getAuthHeaders] Error:', err);
    return { 'Content-Type': 'application/json' };
  }
};

interface DashboardPageProps {
  user: AppUser;
  onLogout: () => void;
  onUpdateUser: (user: AppUser) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (window.location.pathname === '/owner/settings') return 'account-settings';
    if (window.location.pathname === '/owner/help') return 'help';
    return 'dashboard';
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [openAddProperty, setOpenAddProperty] = useState(false);

  // Debug: Log user on mount
  useEffect(() => {
    console.log('🔍 [OwnerDashboard] User prop:', user);
    console.log('🔍 [OwnerDashboard] localStorage:', localStorage.getItem('currentUser'));
  }, [user]);

  // Poll for new maintenance requests every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/maintenance', {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data: { status: string }[] = await res.json();
          setNewRequestCount(data.filter(r => r.status === 'pending' || r.status === 'NEW').length);
        }
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAccountSettingsClick = () => {
    setActiveSection('account-settings');
    setShowDropdown(false);
    window.history.pushState({}, '', '/owner/settings');
  };

  const handleHelpClick = () => {
    setActiveSection('help');
    setShowDropdown(false);
    window.history.pushState({}, '', '/owner/help');
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/owner/settings') setActiveSection('account-settings');
      else if (window.location.pathname === '/owner/help') setActiveSection('help');
      else setActiveSection('dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeSection !== 'my-properties') setOpenAddProperty(false);
  }, [activeSection]);

  const menuItems: SidebarItem[] = [
    { id: 'dashboard',      label: 'Dashboard',         icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'my-properties',  label: 'My Properties',     icon: <Building2       className="h-5 w-5" /> },
    { id: 'accounting',     label: 'Rental Accounting', icon: <Briefcase       className="h-5 w-5" /> },
    { id: 'tax-reporting',  label: 'Tax Reporting',     icon: <FileText        className="h-5 w-5" /> },
    { id: 'rent-gateway',   label: 'Collect Rent',      icon: <CreditCard      className="h-5 w-5" /> },
    { id: 'tenants',        label: 'Find Tenants',      icon: <Users           className="h-5 w-5" /> },
    { id: 'maintenance',    label: 'Maintenance',       icon: <Wrench          className="h-5 w-5" /> },
    { id: 'e-sign',         label: 'E-Sign',            icon: <PenTool         className="h-5 w-5" /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-8 space-y-8 animate-fadeIn bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900">Hello {user.name},</h1>
            <div className="grid grid-cols-3 gap-6">
              {[
                { title: 'Rent received', amount: 'USD0.00', sub: 'Received last month' },
                { title: 'Upcoming payments', amount: 'USD0.00', sub: '0 payment' },
                { title: 'Rent overdue', amount: 'USD0.00', sub: '0 overdue' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="text-gray-500 text-sm font-semibold">{card.title}</h4>
                  <p className="text-3xl font-bold mt-2 text-gray-900">{card.amount}</p>
                  <p className="text-gray-400 text-sm mt-1">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'my-properties':
        return <MyPropertiesPage user={user} openAddProperty={openAddProperty} />;
      case 'accounting':
        return <AccountingPage />;
      case 'tax-reporting':
        return <TaxReportingPage />;
      case 'rent-gateway':
        return <RentGatewayPage />;
      case 'tenants':
        return (
          <FindTenantsPage
            onNavigateToESign={(_applicant: Applicant) => setActiveSection('e-sign')}
            onPostNewListing={() => {
              setOpenAddProperty(true);
              setActiveSection('my-properties');
            }}
          />
        );
      case 'maintenance':
        return <MaintenancePage />;
      case 'e-sign':
        return <ESignPage />;
      case 'account-settings':
        return (
          <div className="p-8 space-y-6 animate-fadeIn bg-gray-50 min-h-screen">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your account preferences and profile details.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
                <input value={user.name} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input value={user.email || ''} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
              </div>
              <p className="text-xs text-gray-500">Contact support to change protected account details.</p>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="p-8 space-y-6 animate-fadeIn bg-gray-50 min-h-screen">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
              <p className="text-sm text-gray-500 mt-1">Find answers and get support for your RentHub account.</p>
            </div>
            <div className="grid gap-4 max-w-3xl md:grid-cols-2">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="font-bold text-gray-900">Getting started</h2>
                <p className="text-sm text-gray-500 mt-2">Add a property, review applications, and manage your rental payments from the sidebar.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="font-bold text-gray-900">Need more help?</h2>
                <p className="text-sm text-gray-500 mt-2">Contact RentHub support for assistance with your account or property management tools.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="p-8">Section: {activeSection}</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      {/* Top Banner */}
      <div className="bg-orange-400 text-white text-center py-2 text-sm font-semibold">
        Trial ends in 1 day. <a href="#" className="underline">Upgrade Now</a>
      </div>
      
      <div className="flex flex-1">
        <Sidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
            onLogout={onLogout}
            menuItems={menuItems}
            title="RentHub"
        />
        <div className="flex-1 bg-white">
            <header className="border-b px-8 py-4 flex justify-between items-center bg-white">
                <Menu className="h-6 w-6 text-gray-400" />
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-gray-400">
                        <button
                          onClick={() => setShowCalendarModal(true)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="View calendar & schedule"
                        >
                          <Calendar className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setShowNotificationsModal(true)}
                          className="relative text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Notifications & maintenance requests"
                        >
                          <Bell className="h-5 w-5" />
                          {newRequestCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {newRequestCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setShowTipsModal(true)}
                          className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Tips & suggestions"
                        >
                          <Lightbulb className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <div 
                            className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-semibold text-sm cursor-pointer"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            {user.name}
                            <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                                <button onClick={handleAccountSettingsClick} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">Account settings</button>
                                <button onClick={handleHelpClick} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">Help</button>
                                <button onClick={onLogout} className="block w-full text-left px-4 py-3 text-sm text-red-600 font-semibold hover:bg-red-50">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {renderContent()}
        </div>
        {showNewRequestModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">New Maintenance Request</h2>
                <button onClick={() => setShowNewRequestModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Title" className="w-full border p-3 rounded-lg" />
                <select className="w-full border p-3 rounded-lg">
                  <option>Select Property</option>
                </select>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Viewable by</label>
                  <select className="w-full border p-3 rounded-lg">
                    <option>Tenants</option>
                    <option>Property Owner</option>
                  </select>
                </div>
                <textarea placeholder="Description" className="w-full border p-3 rounded-lg"></textarea>
                <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold" onClick={() => setShowNewRequestModal(false)}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCalendarModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Calendar & Schedule</h2>
                </div>
                <button onClick={() => setShowCalendarModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">Upcoming Events</h3>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <p className="font-semibold text-gray-900">Rent Collection - Villa Horizon</p>
                      <p className="text-sm text-gray-500">Tomorrow, 9:00 AM</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <p className="font-semibold text-gray-900">Property Inspection - Studio C</p>
                      <p className="text-sm text-gray-500">Friday, 2:00 PM</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <p className="font-semibold text-gray-900">Lease Renewal - Apartment A</p>
                      <p className="text-sm text-gray-500">Next Monday, 10:00 AM</p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                  View Full Calendar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNotificationsModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                  {newRequestCount > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {newRequestCount} new
                    </span>
                  )}
                </div>
                <button onClick={() => setShowNotificationsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <div className="space-y-3">
                {newRequestCount > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 cursor-pointer hover:bg-rose-100 transition-colors"
                    onClick={() => {
                      setShowNotificationsModal(false);
                      setActiveSection('maintenance');
                    }}>
                    <div className="flex items-start gap-3">
                      <Wrench className="h-5 w-5 text-rose-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-rose-900">{newRequestCount} New Maintenance Request{newRequestCount !== 1 ? 's' : ''}</p>
                        <p className="text-sm text-rose-700 mt-1">Click to view and respond</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Payment Received</p>
                      <p className="text-sm text-blue-700 mt-1">$2,500 from Villa Horizon tenant</p>
                      <p className="text-xs text-blue-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <PenTool className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">Contract Signed</p>
                      <p className="text-sm text-emerald-700 mt-1">New lease agreement for Apartment A</p>
                      <p className="text-xs text-emerald-500 mt-1">Yesterday</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">New Tenant Application</p>
                      <p className="text-sm text-gray-700 mt-1">Application received for Studio C</p>
                      <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                onClick={() => setShowNotificationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tips Modal */}
        {showTipsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTipsModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Tips & Suggestions</h2>
                </div>
                <button onClick={() => setShowTipsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5" />
                    Maximize Your Rental Income
                  </h3>
                  <p className="text-sm text-amber-800">
                    Properties with professional photos get 40% more inquiries. Upload high-quality images to attract more tenants.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    Tax Deduction Reminder
                  </h3>
                  <p className="text-sm text-emerald-800">
                    Don't forget to log your maintenance expenses! These are tax-deductible and can save you money at year-end.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5" />
                    Tenant Screening Best Practice
                  </h3>
                  <p className="text-sm text-blue-800">
                    Always verify employment and previous rental history. Our verification tools can help streamline this process.
                  </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5" />
                    Automate Rent Collection
                  </h3>
                  <p className="text-sm text-indigo-800">
                    Set up automatic rent collection to ensure timely payments and reduce manual follow-ups with tenants.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5" />
                    Property Maintenance Schedule
                  </h3>
                  <p className="text-sm text-purple-800">
                    Create a regular maintenance schedule to prevent costly repairs and keep your properties in top condition.
                  </p>
                </div>
              </div>
              <button 
                className="w-full mt-6 bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                onClick={() => setShowTipsModal(false)}
              >
                Got It!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
