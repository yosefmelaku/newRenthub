import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const PropertyInventory: React.FC = () => {
  const [filter, setFilter] = useState('all');
  
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['all', 'villas', 'offices', 'studios', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`capitalize px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
                {f}
            </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Property</th>
              <th className="px-6 py-4 text-left">Owner</th>
              <th className="px-6 py-4 text-left">Monthly Rent</th>
              <th className="px-6 py-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2].map((i) => (
                <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">Modern {filter === 'all' ? 'Property' : filter} {i}</td>
                    <td className="px-6 py-4 text-slate-500">Owner Name</td>
                    <td className="px-6 py-4 text-slate-700">$2,000</td>
                    <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                            <AlertTriangle size={12}/> Pending Approval
                        </span>
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
