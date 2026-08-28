import React, { useState, type FormEvent } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertTriangle, LogIn, Mail } from 'lucide-react';
import type { AppUser } from '../../types';

interface AdminLoginPageProps {
  onLogin: (user: AppUser) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) { setError('Phone number is required.'); return; }
    if (!password)     { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/users/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Login failed.');
        return;
      }

      const role = String(data.user.role).toLowerCase();

      // Only superadmin can enter this page
      if (role !== 'superadmin') {
        setError('Access denied. This page is for Super Admins only.');
        return;
      }

      onLogin({
        id:    data.user.id,
        name:  data.user.name,
        email: data.user.email,
        role:  data.user.role,
        phone: data.user.phone,
        token: data.token,
      });
    } catch {
      setError('Network error — make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Rent<span className="text-emerald-400">Hub</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-1">
              Super Admin Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Admin Sign In</h2>
            <p className="text-slate-400 text-sm mt-1">
              Enter your credentials to access the admin dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-2xl text-sm font-medium flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="e.g., 251900000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 pl-4 pr-12 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer transition"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2 cursor-pointer"
            >
              {loading
                ? 'Authenticating…'
                : <><LogIn className="h-4 w-4" /> Sign In to Admin Panel</>
              }
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600">
            This portal is restricted to Super Admins only.
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
};
