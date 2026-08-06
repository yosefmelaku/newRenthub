import React, { useState } from 'react';
import { Building2, ChevronDown, X, Info, Check } from 'lucide-react';

interface UpgradePageProps {
  onClose: () => void;
}

export const UpgradePage: React.FC<UpgradePageProps> = ({ onClose }) => {
  const [units, setUnits] = useState(3);
  const [showFullFeatures, setShowFullFeatures] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);

  const handleUpgrade = (plan: string) => {
    setUpgradedPlan(plan);
    setTimeout(() => setUpgradedPlan(null), 3000);
  };

  const features = [
    {
      label: "Who's it for?",
      go: 'New landlords managing 1–3 units, listing properties manually, and tracking finances in spreadsheets',
      pro: 'Growing landlords managing multiple units who want to automate accounting and reporting',
      proplus: 'Portfolio landlords & property managers needing advanced automation, multi-user access, and dedicated account manager',
    },
    {
      label: 'Best for',
      go: 'Trying out property management software',
      pro: 'Growing & optimizing rental income',
      proplus: 'Streamlining & scaling investments',
    },
    { label: 'Properties',           go: 'Up to 3',  pro: 'Unlimited',              proplus: 'Unlimited'                },
    { label: 'Tenants',              go: 'Up to 3',  pro: 'Unlimited',              proplus: 'Unlimited'                },
    { label: 'Leases',               go: 'Up to 3',  pro: 'Unlimited',              proplus: 'Unlimited'                },
    { label: 'Accounting & reports', go: 'Basic',     pro: 'Advanced',               proplus: 'Advanced + Automation'    },
    { label: 'Maintenance tracking', go: '✓',         pro: '✓',                      proplus: '✓ + Contractor portal'    },
    { label: 'Tenant portal',        go: '✓',         pro: '✓',                      proplus: '✓'                        },
    { label: 'Online rent payments', go: '—',          pro: '✓',                      proplus: '✓'                        },
    { label: 'Multi-user access',    go: '—',          pro: '—',                       proplus: '✓'                        },
    { label: 'Dedicated account manager', go: '—',    pro: '—',                       proplus: '✓'                        },
    { label: 'Priority support',     go: '—',          pro: 'Email',                  proplus: 'Phone & Email'            },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto flex flex-col" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>

      {/* Orange trial banner */}
      <div className="bg-[#ff9f00] text-white py-2 px-4 text-xs font-bold text-center flex items-center justify-center gap-1.5 shrink-0">
        <Info className="h-4 w-4 fill-white text-[#ff9f00]" />
        <span>Trial ends in 14 days. <span className="underline cursor-pointer">Upgrade Now</span></span>
      </div>

      {/* Nav bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2 rounded-xl">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-slate-900 text-base tracking-tight">
            RentHub
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-8">

        {/* Upgrade success toast */}
        {upgradedPlan && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2 shadow-sm">
            <Check className="h-4 w-4 text-emerald-600" />
            Upgraded to <strong>{upgradedPlan}</strong> successfully! Your new features are now active.
          </div>
        )}

        {/* Page title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Choose your plan</h1>
          <p className="text-slate-500 text-sm">Upgrade anytime. Cancel anytime.</p>
        </div>

        {/* 3 Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

          {/* Go - Free / Current */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-4">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Go</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">Free</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                New landlords managing 1–3 units, listing properties manually.
              </p>
            </div>
            <button
              disabled
              className="w-full bg-slate-100 text-slate-400 font-bold text-sm py-2.5 rounded-xl cursor-not-allowed"
            >
              Current plan
            </button>
          </div>

          {/* Pro - Most Popular */}
          <div className="border-2 border-blue-600 rounded-2xl p-6 bg-white flex flex-col gap-4 relative shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pro</span>
              <div className="flex items-end gap-1 mt-1">
                <p className="text-3xl font-extrabold text-slate-900">$12.00</p>
                <span className="text-slate-400 text-sm mb-1">/mo</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Growing landlords managing multiple units who want to automate accounting and reporting.
              </p>
            </div>
            <button onClick={() => handleUpgrade('Pro')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl cursor-pointer transition">
              Upgrade to Pro
            </button>
          </div>

          {/* Pro Plus - Premium */}
          <div className="border-2 border-slate-800 rounded-2xl p-6 bg-white flex flex-col gap-4 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full">
                Premium Plan
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pro Plus</span>
              <div className="flex items-end gap-1 mt-1">
                <p className="text-3xl font-extrabold text-slate-900">$28.00</p>
                <span className="text-slate-400 text-sm mb-1">/mo</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Portfolio landlords & property managers needing advanced automation, multi-user access, and dedicated account manager.
              </p>
            </div>
            <button onClick={() => handleUpgrade('Pro Plus')} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2.5 rounded-xl cursor-pointer transition">
              Upgrade to Pro Plus
            </button>
          </div>
        </div>

        {/* Full plan features accordion */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <button
            onClick={() => setShowFullFeatures(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer transition"
          >
            Full plan features
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFullFeatures ? 'rotate-180' : ''}`} />
          </button>

          {showFullFeatures && (
            <div className="border-t border-slate-200 bg-white">

              {/* Unit counter */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Number of property units</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUnits(u => Math.max(1, u - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-base font-bold text-slate-900 w-5 text-center">{units}</span>
                  <button
                    onClick={() => setUnits(u => u + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-6 py-4 text-slate-500 font-semibold w-1/4" />
                      <th className="px-4 py-4 text-center w-1/4">
                        <p className="font-semibold text-slate-700">Go</p>
                        <p className="text-xs text-slate-400 mt-0.5">Free</p>
                        <button disabled className="mt-3 w-full bg-slate-100 text-slate-400 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
                          Current Plan
                        </button>
                      </th>
                      <th className="px-4 py-4 text-center w-1/4 bg-blue-50">
                        <p className="font-bold text-blue-700">Pro</p>
                        <p className="text-xs text-slate-500 mt-0.5">$12.00/mo</p>
                        <button onClick={() => handleUpgrade('Pro')} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition">
                          Upgrade to Pro
                        </button>
                      </th>
                      <th className="px-4 py-4 text-center w-1/4">
                        <p className="font-bold text-slate-800">Pro Plus</p>
                        <p className="text-xs text-slate-500 mt-0.5">$28.00/mo</p>
                        <button onClick={() => handleUpgrade('Pro Plus')} className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition">
                          Upgrade to Pro Plus
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {features.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4 font-medium text-slate-700 text-sm">{row.label}</td>
                        <td className="px-4 py-4 text-center text-slate-500 text-xs align-top">{row.go}</td>
                        <td className="px-4 py-4 text-center text-slate-700 text-xs bg-blue-50/30 align-top">{row.pro}</td>
                        <td className="px-4 py-4 text-center text-slate-700 text-xs align-top">{row.proplus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
