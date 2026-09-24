import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { User, ShieldAlert, ToggleLeft, ToggleRight, RefreshCw, Search } from 'lucide-react';
import { fetchClassifiedUsers, activateUser, deactivateUser, type AdminUser } from '../../lib/api';

const ROLE_TABS = [
  { id: 'all',        label: '👥 All' },
  { id: 'tenant',     label: '🔑 Tenants' },
  { id: 'owner',      label: '💼 Owners' },
  { id: 'superadmin', label: '👑 Admins' },
];

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'border border-rose-400 text-rose-600 bg-rose-50',
  owner:      'bg-blue-100 text-blue-700',
  tenant:     'bg-emerald-50 text-emerald-700',
};

export const UserDirectory: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search,    setSearch]    = useState('');
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 [UserDirectory] Fetching users...');
      const data = await fetchClassifiedUsers();
      console.log('✅ [UserDirectory] Received users:', data);
      console.log('📊 [UserDirectory] User count:', data.users?.length);
      setUsers(data.users ?? []);
    } catch (e) {
      console.error('❌ [UserDirectory] Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(u => {
      const roleMatch = activeTab === 'all' || String(u.role).toLowerCase() === activeTab;
      if (!roleMatch) return false;
      if (!term) return true;
      return [u.name, u.email, u.phone ?? ''].some(s => s.toLowerCase().includes(term));
    });
  }, [users, search, activeTab]);

  const handleToggle = async (u: AdminUser) => {
    try {
      if (u.is_active) {
        await deactivateUser(u.id);
        setActionMsg(`Account "${u.name}" deactivated.`);
      } else {
        await activateUser(u.id);
        setActionMsg(`Account "${u.name}" activated.`);
      }
      load();
    } catch (e: any) {
      setActionMsg(e.message || 'Action failed.');
    }
    setTimeout(() => setActionMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">User Directory</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-sm font-semibold">
          {actionMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-100 shrink-0">
          {ROLE_TABS.map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveTab(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === btn.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Metrics</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Loading users…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No users found.</td></tr>
            ) : filtered.map((u) => {
              const roleKey = String(u.role).toLowerCase();
              return (
                <tr key={u.id} className={`hover:bg-slate-50 ${!u.is_active ? 'opacity-60' : ''}`}>
                  {/* User details */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-slate-400 text-xs truncate">{u.email}</p>
                        {u.phone && <p className="text-slate-400 text-xs">{u.phone}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[roleKey] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Metrics */}
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {roleKey === 'owner' ? (
                      <span>📦 <strong>{u.total_uploads}</strong> properties</span>
                    ) : (
                      <span>🔑 <strong>{u.active_leases}</strong> active leases</span>
                    )}
                    <br />
                    <span className="text-slate-400">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </td>

                  {/* Active status */}
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="KYC verification (stub)"
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-100 text-slate-700 flex items-center gap-1 hover:bg-slate-100 transition"
                      >
                        <ShieldAlert size={12} /> KYC
                      </button>
                      <button
                        onClick={() => handleToggle(u)}
                        title={u.is_active ? 'Deactivate account' : 'Activate account'}
                        className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition font-semibold ${
                          u.is_active
                            ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active
                          ? <><ToggleLeft  size={12} /> Deactivate</>
                          : <><ToggleRight size={12} /> Activate</>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
};
