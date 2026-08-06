import React from 'react';
import { User, Building2, ShieldCheck } from 'lucide-react';

interface RoleSelectionPageProps {
  onSelectRole: (role: 'renter' | 'owner' | 'super-admin') => void;
  onBack: () => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelectRole, onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <button onClick={onBack} className="text-sm text-slate-500 font-semibold flex items-center gap-1">← Back</button>
        <h2 className="text-2xl font-bold text-center">Select your role</h2>
        <div className="space-y-4">
          <button onClick={() => onSelectRole('renter')} className="w-full p-4 flex items-center gap-4 border rounded-xl hover:bg-slate-50 transition">
            <User className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold">Tenant</span>
          </button>
          <button onClick={() => onSelectRole('owner')} className="w-full p-4 flex items-center gap-4 border rounded-xl hover:bg-slate-50 transition">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-semibold">Property Owner</span>
          </button>
        </div>
      </div>
    </div>
  );
};
