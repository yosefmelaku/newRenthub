import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  UserCheck,
  Flag,
  Loader2,
  Search,
  Calendar,
  Clock,
} from 'lucide-react';

const API_URL = '/api';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return { 'Content-Type': 'application/json' };
    const user = JSON.parse(raw);
    const token = user.token || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  category: string;
}

interface Lease {
  leaseId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  property: Property;
}

interface Tenant {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  activeLeases: Lease[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatLeaseCountdown = (endDate: string): string => {
  const days = calculateDaysRemaining(endDate);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  if (days <= 30) return `${days} days left`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month left';
  return `${months} months left`;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Row Component
// ─────────────────────────────────────────────────────────────────────────────

interface TenantRowProps {
  tenant: Tenant;
}

const TenantRow: React.FC<TenantRowProps> = ({ tenant }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const activeLease = tenant.activeLeases[0];
  const daysRemaining = activeLease ? calculateDaysRemaining(activeLease.endDate) : null;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      {/* Tenant Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {getInitials(tenant.fullName)}
          </div>
          
          {/* Name & Contact */}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {tenant.fullName}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                {tenant.email}
              </span>
              {tenant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  {tenant.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Rented Space */}
      <td className="px-6 py-4">
        {activeLease ? (
          <div className="space-y-1">
            <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              {activeLease.property.title}
            </p>
            <p className="text-xs text-gray-500">
              {activeLease.property.address}, {activeLease.property.city}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              {activeLease.property.category}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No active lease</span>
        )}
      </td>

      {/* Lease Status */}
      <td className="px-6 py-4">
        {activeLease ? (
          <div className="space-y-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                daysRemaining && daysRemaining > 30
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : daysRemaining && daysRemaining > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatLeaseCountdown(activeLease.endDate)}
            </span>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start: {new Date(activeLease.startDate).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                End: {new Date(activeLease.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    console.log('View profile:', tenant.id);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    console.log('Flag account:', tenant.id);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  Flag Account
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const TenantDirectory: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/admin/tenants`, {
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          setTenants(data.tenants || []);
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.error || 'Failed to load tenants');
        }
      } catch (err) {
        console.error('[TenantDirectory.fetchTenants]', err);
        setError('Network error — please check your connection');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  // Filter tenants based on search term
  const filteredTenants = tenants.filter((tenant) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = tenant.fullName.toLowerCase().includes(term);
    const matchesEmail = tenant.email.toLowerCase().includes(term);
    const matchesPhone = tenant.phone?.toLowerCase().includes(term);
    const matchesProperty = tenant.activeLeases.some((lease) =>
      lease.property.title.toLowerCase().includes(term)
    );
    return matchesName || matchesEmail || matchesPhone || matchesProperty;
  });

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tenant Directory</h2>
              <p className="text-sm text-emerald-100">
                Active marketplace tenants with lease information
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-xl">
            <p className="text-2xl font-bold text-white">{tenants.length}</p>
            <p className="text-xs text-emerald-100">Total Tenants</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or property..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading tenants...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
              <Flag className="h-6 w-6 text-rose-600" />
            </div>
            <p className="text-sm text-rose-600 font-semibold">{error}</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {searchTerm.trim() ? 'No tenants found matching your search' : 'No tenants registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Tenant Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Rented Space
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Lease Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTenants.map((tenant) => (
                  <TenantRow key={tenant.id} tenant={tenant} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filteredTenants.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing {filteredTenants.length} of {tenants.length} tenants
              {searchTerm.trim() && ' (filtered)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
