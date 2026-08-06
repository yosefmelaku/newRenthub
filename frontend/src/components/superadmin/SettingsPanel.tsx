import React from 'react';

export const SettingsPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
            { title: 'Package & Discount Settings', fields: ['Discount Threshold', 'Auto Discount %'] },
            { title: 'Platform Commission Manager', fields: ['Global Commission %'] },
            { title: 'Payment Gateway Configuration', fields: ['Stripe Key', 'PayPal Key'] },
            { title: 'Regional Compliance', fields: ['Default Currency', 'Tax Rate %'] }
        ].map(section => (
            <div key={section.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900">{section.title}</h4>
                {section.fields.map(field => (
                    <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{field}</label>
                        <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder={field}/>
                    </div>
                ))}
                <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Save Changes</button>
            </div>
        ))}
    </div>
  );
};
