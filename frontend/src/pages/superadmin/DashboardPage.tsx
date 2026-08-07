import React, { useState } from 'react';
import { Database, Users, AlertTriangle, CheckCircle, XCircle, Settings, LayoutDashboard, MoreVertical } from 'lucide-react';
import { Sidebar, type SidebarItem } from '../../components/Sidebar';
import { UserDirectory } from '../../components/superadmin/UserDirectory';
import { PropertyInventory } from '../../components/superadmin/PropertyInventory';
import { SettingsPanel } from '../../components/superadmin/SettingsPanel';
import { MoreUtilities } from '../../components/superadmin/MoreUtilities';

interface SuperAdminDashboardProps {
  userName: string;
  onLogout: () => void;
}

export const DashboardPage: React.FC<SuperAdminDashboardProps> = ({ userName, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { id: 'properties', label: 'Properties', icon: <Database className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
    { id: 'more', label: 'More', icon: <MoreVertical className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50">
      <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          onLogout={onLogout}
          menuItems={menuItems}
          title="RentHub"
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 capitalize">👑 Super Admin: {userName} - {activeSection}</h2>
          <span className="text-sm text-slate-600">⚡ Platform Status: <span className="text-emerald-600 font-bold">OK</span></span>
        </header>

        {activeSection === 'dashboard' && (
            <>
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Volume</h4>
                    <p className="text-2xl font-bold text-slate-900 mt-1">$1.2M Transacted</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Users</h4>
                    <p className="text-2xl font-bold text-slate-900 mt-1">14,205</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Disputes</h4>
                    <p className="text-2xl font-bold text-rose-600 mt-1">4 Urgent</p>
                </div>
                </div>

                {/* Critical Approval Queue */}
                <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> CRITICAL APPROVAL QUEUE</h3>
                
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <span className="text-sm font-semibold">[Owner] Vertex Realty uploaded 15 new Offices</span>
                    <div className="flex gap-2">
                    <button className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-200"><CheckCircle className="h-4 w-4"/> Approve</button>
                    <button className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-rose-200"><XCircle className="h-4 w-4"/> Deny</button>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <span className="text-sm font-semibold">[User ID #991] Reported for fraudulent listing</span>
                    <button className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-rose-200"><XCircle className="h-4 w-4"/> Ban User</button>
                </div>
                </div>
            </>
        )}
        {activeSection === 'users' && <UserDirectory />}
        {activeSection === 'properties' && <PropertyInventory />}
        {activeSection === 'settings' && <SettingsPanel />}
        {activeSection === 'more' && <MoreUtilities />}
      </main>
    </div>
  );
};
