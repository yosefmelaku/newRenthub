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

interface DashboardPageProps {
  user: AppUser;
  onLogout: () => void;
  onUpdateUser: (user: AppUser) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newRequestCount, setNewRequestCount] = useState(0);

  // Poll for new maintenance requests every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/maintenance');
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
  };

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
        return <MyPropertiesPage user={user} />;
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
          />
        );
      case 'maintenance':
        return <MaintenancePage />;
      case 'e-sign':
        return <ESignPage />;
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
                        <Calendar className="h-5 w-5" />
                        <button
                          onClick={() => setActiveSection('maintenance')}
                          className="relative text-gray-400 hover:text-gray-700 transition"
                          title="Maintenance requests"
                        >
                          <Bell className="h-5 w-5" />
                          {newRequestCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {newRequestCount}
                            </span>
                          )}
                        </button>
                        <Lightbulb className="h-5 w-5" />
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
                                <button className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">Help</button>
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
      </div>
    </div>
  );
};
