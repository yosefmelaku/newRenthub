import React from 'react';
import { AlertTriangle, CheckCircle, MoreVertical, DollarSign, Users } from 'lucide-react';

// Define Types
interface Owner {
  id: string;
  name: string;
  email: string;
  listings: {
    total: number;
    villas: number;
    offices: number;
    studios: number;
  };
  packageTier: 'Basic' | 'Growth' | 'Enterprise';
  usageLimit: number;
  discountRate: number; // 0 for no discount
  revenue: {
    gross: number;
    net: number;
  };
}

const mockOwners: Owner[] = [
  { id: '1', name: 'Vertex Realty', email: 'contact@vertex.com', listings: { total: 15, villas: 5, offices: 6, studios: 4 }, packageTier: 'Enterprise', usageLimit: 20, discountRate: 15, revenue: { gross: 5000, net: 4250 } },
  { id: '2', name: 'Urban Living', email: 'info@urban.com', listings: { total: 9, villas: 2, offices: 1, studios: 6 }, packageTier: 'Growth', usageLimit: 10, discountRate: 10, revenue: { gross: 3000, net: 2700 } },
  { id: '3', name: 'Compact Spaces', email: 'hello@compact.com', listings: { total: 3, villas: 0, offices: 0, studios: 3 }, packageTier: 'Basic', usageLimit: 5, discountRate: 0, revenue: { gross: 1000, net: 1000 } },
];

export const OwnerDiscountMonitor: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Top Bulk Uploaders</p>
            <p className="text-2xl font-bold text-slate-900">12 Property Owners</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Discounted Revenue</p>
            <p className="text-2xl font-bold text-slate-900">$12,450</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Package Limit Alerts</p>
            <p className="text-2xl font-bold text-rose-600">3 Owners</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Owner Info</th>
              <th className="px-6 py-4 text-left">Active Listings</th>
              <th className="px-6 py-4 text-left">Package Tier</th>
              <th className="px-6 py-4 text-left">Usage</th>
              <th className="px-6 py-4 text-left">Discount</th>
              <th className="px-6 py-4 text-left">Revenue</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockOwners.map((owner) => {
              const usagePercent = (owner.listings.total / owner.usageLimit) * 100;
              return (
                <tr key={owner.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{owner.name}</p>
                    <p className="text-slate-500 text-xs">{owner.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {owner.listings.total} Properties 
                    <span className="block text-xs text-slate-500">{owner.listings.villas} Villas, {owner.listings.offices} Offices, {owner.listings.studios} Studios</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${owner.packageTier === 'Enterprise' ? 'bg-purple-50 text-purple-700' : owner.packageTier === 'Growth' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {owner.packageTier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{owner.listings.total} / {owner.usageLimit}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {owner.discountRate > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-100">
                            <CheckCircle className="h-3 w-3" /> {owner.discountRate}% Off
                        </span>
                    ) : <span className="text-slate-400 text-xs">None</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-semibold">
                    ${owner.revenue.net} <span className="text-xs text-slate-400 line-through font-normal">${owner.revenue.gross}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-slate-400 hover:text-slate-900"><MoreVertical className="h-5 w-5"/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
