import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, Settings, MoreVertical,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Home,
  FileText, RefreshCw,
} from 'lucide-react';
import { Sidebar, type SidebarItem } from '../../components/Sidebar';
import { UserDirectory }      from '../../components/superadmin/UserDirectory';
import { PropertyInventory }  from '../../components/superadmin/PropertyInventory';
import { SettingsPanel }      from '../../components/superadmin/SettingsPanel';
import {
  fetchAdminStats, fetchPendingApprovals, approveProperty, rejectProperty,
  type AdminStats,
} from '../../lib/api';

interface Props {
  userName: string;
  onLogout: () => void;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-extrabold mt-1 ${color ?? 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Dashboard overview panel ──────────────────────────────────────────────────
function DashboardOverview({ userName }: { userName: string }) {
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([fetchAdminStats(), fetchPendingApprovals()]);
      setStats(s);
      setApprovals(a.pendingProperties ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string, title: string) => {
    try {
      await approveProperty(id);
      setActionMsg(`✅ "${title}" approved.`);
      load();
    } catch { setActionMsg('Failed to approve.'); }
  };

  const handleReject = async (id: string, title: string) => {
    try {
      await rejectProperty(id);
      setActionMsg(`❌ "${title}" rejected.`);
      load();
    } catch { setActionMsg('Failed to reject.'); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome back, {userName} 👑</h2>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening on RentHub today.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold">
          {actionMsg}
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users"       value={stats.totalUsers}         sub={`${stats.totalTenants} tenants · ${stats.totalOwners} owners`} />
          <StatCard label="Total Properties"  value={stats.totalProperties}    sub={`${stats.approvedProperties} approved`} />
          <StatCard label="Pending Approval"  value={stats.pendingProperties}  color={stats.pendingProperties > 0 ? 'text-amber-600' : undefined} sub="Awaiting review" />
          <StatCard label="Active Leases"     value={stats.activeLeases}       color="text-emerald-600" sub="Currently rented" />
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Failed to load stats. Check your backend connection.</p>
      )}

      {/* Pending approval queue */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Property Approval Queue</h3>
          {approvals.length > 0 && (
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {approvals.length} pending
            </span>
          )}
        </div>

        {approvals.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            {loading ? 'Loading…' : '✅ No properties pending approval.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {approvals.map((p) => (
              <div key={p.propertyId} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.category} · {p.address}, {p.city} · <span className="font-medium">{p.ownerName}</span>
                  </p>
                  <p className="text-xs text-slate-400">${Number(p.rent_amount).toLocaleString()}/mo</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(p.propertyId, p.title)}
                    className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.propertyId, p.title)}
                    className="flex items-center gap-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard shell ──────────────────────────────────────────────────────
export const DashboardPage: React.FC<Props> = ({ userName, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems: SidebarItem[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'users',      label: 'Users',        icon: <Users           className="h-5 w-5" /> },
    { id: 'properties', label: 'Properties',   icon: <Building2       className="h-5 w-5" /> },
    { id: 'rentals',    label: 'Rentals',       icon: <Home            className="h-5 w-5" /> },
    { id: 'settings',   label: 'Settings',      icon: <Settings        className="h-5 w-5" /> },
    { id: 'more',       label: 'Utilities',     icon: <MoreVertical    className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
        menuItems={menuItems}
        title="RentHub"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {activeSection === 'dashboard'  && <DashboardOverview userName={userName} />}
        {activeSection === 'users'      && <UserDirectory />}
        {activeSection === 'properties' && <PropertyInventory />}
        {activeSection === 'rentals'    && <RentalsMatrix />}
        {activeSection === 'settings'   && <SettingsPanel />}
        {activeSection === 'more'       && <UtilitiesPanel />}
      </main>
    </div>
  );
};

// ── Rentals matrix panel ──────────────────────────────────────────────────────
function RentalsMatrix() {
  const [leases, setLeases]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../lib/api').then(({ fetchRentalsMatrix }) => {
      fetchRentalsMatrix()
        .then(d => setLeases(d.rentalsMatrix ?? []))
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-slate-900">Active Rentals Matrix</h2>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Tenant</th>
              <th className="px-5 py-3 text-left">Property</th>
              <th className="px-5 py-3 text-left">Owner</th>
              <th className="px-5 py-3 text-left">Monthly Rent</th>
              <th className="px-5 py-3 text-left">Start</th>
              <th className="px-5 py-3 text-left">End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : leases.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No active leases found.</td></tr>
            ) : leases.map((l) => (
              <tr key={l.leaseId} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold text-slate-900">{l.tenantName}<br/><span className="text-xs text-slate-400 font-normal">{l.tenantEmail}</span></td>
                <td className="px-5 py-3 text-slate-700">{l.propertyTitle}<br/><span className="text-xs text-slate-400">{l.propertyLocation}</span></td>
                <td className="px-5 py-3 text-slate-700">{l.ownerName}</td>
                <td className="px-5 py-3 font-semibold">${Number(l.monthlyRent).toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(l.leaseStartDate).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(l.leaseEndDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Utilities panel ───────────────────────────────────────────────────────────
function UtilitiesPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-slate-900">System Utilities</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Audit Trails',         icon: FileText,   desc: 'View system-wide activity log.' },
          { name: 'Maintenance Tickets',  icon: AlertTriangle, desc: 'Review all open tickets.' },
          { name: 'Platform Settings',    icon: Settings,   desc: 'Configure global settings.' },
          { name: 'User Analytics',       icon: TrendingUp, desc: 'Growth and engagement metrics.' },
        ].map(item => (
          <button
            key={item.name}
            className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition text-left"
          >
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <item.icon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
