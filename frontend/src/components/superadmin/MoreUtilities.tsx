import React from 'react';
import { Database, FileText, Settings } from 'lucide-react';

export const MoreUtilities: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4">System Utilities</h3>
        {[
            { name: 'Audit Trails', icon: FileText },
            { name: 'Database Management', icon: Database },
            { name: 'CMS Editor', icon: Settings },
        ].map(item => (
            <button key={item.name} className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-lg text-slate-700 font-medium">
                <item.icon size={20} className="text-emerald-600"/> {item.name}
            </button>
        ))}
    </div>
  );
};
