import React, { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { fetchAllAdminProperties, approveProperty, rejectProperty, type AdminProperty } from '../../lib/api';

const STATUS_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'PENDING',  label: '⏳ Pending' },
  { id: 'APPROVED', label: '✅ Approved' },
  { id: 'REJECTED', label: '❌ Rejected' },
];

const VALIDATION_STYLE: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-600 border border-rose-200',
};

export const PropertyInventory: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [activeTab,  setActiveTab]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [actionMsg,  setActionMsg]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAdminProperties();
      setProperties(data.properties ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter(p => {
      const statusMatch = activeTab === 'all' || p.validation === activeTab;
      if (!statusMatch) return false;
      if (!term) return true;
      return [p.title, p.address, p.city, p.ownerName].some(s => s?.toLowerCase().includes(term));
    });
  }, [properties, search, activeTab]);

  const handleApprove = async (id: string, title: string) => {
    try { await approveProperty(id); setActionMsg(`✅ "${title}" approved.`); load(); }
    catch { setActionMsg('Approve failed.'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleReject = async (id: string, title: string) => {
    try { await rejectProperty(id); setActionMsg(`❌ "${title}" rejected.`); load(); }
    catch { setActionMsg('Reject failed.'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">Property Inventory</h2>
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
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, city or owner…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Property</th>
              <th className="px-5 py-3 text-left">Owner</th>
              <th className="px-5 py-3 text-left">Rent</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No properties found.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.category} · {p.address}, {p.city}</p>
                  {(p.bedrooms || p.bathrooms) && (
                    <p className="text-xs text-slate-400">{p.bedrooms}bd · {p.bathrooms}ba</p>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-700">
                  <p className="font-medium">{p.ownerName}</p>
                  <p className="text-xs text-slate-400">{p.ownerEmail}</p>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-900">
                  ${Number(p.rent_amount).toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span>
                  {p.active_leases > 0 && (
                    <p className="text-xs text-emerald-600 font-normal mt-0.5">{p.active_leases} active lease(s)</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${VALIDATION_STYLE[p.validation] ?? ''}`}>
                    {p.validation === 'APPROVED' && <CheckCircle size={11} />}
                    {p.validation === 'REJECTED' && <XCircle    size={11} />}
                    {p.validation === 'PENDING'  && <Clock      size={11} />}
                    {p.validation}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {p.validation === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(p.id, p.title)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold transition flex items-center gap-1"
                      >
                        <CheckCircle size={11} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(p.id, p.title)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold transition flex items-center gap-1"
                      >
                        <XCircle size={11} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {properties.length} properties
          </div>
        )}
      </div>
    </div>
  );
};
