import React, { useState, type FormEvent } from 'react';
import { Home, UserCircle2, ShieldCheck, ArrowRight, LogIn, Lock, Building, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import type { AppUser, UserRole } from '../types';

interface PortalLoginPageProps {
  onLogin: (user: AppUser) => void;
}

type StepState = 'general-login' | 'portal-select' | 'owner-login' | 'tenant-login';

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<StepState>('general-login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGeneralSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    setErrorMsg('');
    setStep('portal-select');
  };

  const handleOwnerSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ownerPassword) {
      setErrorMsg('Please enter your owner portal password.');
      return;
    }
    setErrorMsg('');
    const name = email.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
    onLogin({
      name: name || 'Premium Host',
      email: email.trim(),
      role: 'owner',
    });
  };

  const handleTenantSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenantPassword) {
      setErrorMsg('Please enter your tenant portal password.');
      return;
    }
    setErrorMsg('');
    const name = email.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
    onLogin({
      name: name || 'Valued Tenant',
      email: email.trim(),
      role: 'renter',
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative dynamic ambient glow spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl shadow-xl backdrop-blur-md mb-3">
            <Home className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Rent<span className="text-emerald-400">Hub</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-[0.2em]">Enterprise Rental Cloud</p>
        </div>

        {/* STEP 1: GENERAL LOGIN */}
        {step === 'general-login' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="mb-6">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">Step 1 of 3</span>
              <h3 className="text-xl font-bold text-white">Welcome Back</h3>
              <p className="text-slate-400 text-xs mt-1">Please sign in to verify your identity.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-2xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/25 active:scale-95 cursor-pointer mt-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              {/* DEV ONLY: Super Admin Bypass */}
              <button
                type="button"
                onClick={() => onLogin({ name: 'Super Admin', email: 'admin@renthub.com', role: 'super-admin' })}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-900 bg-emerald-950/30 text-emerald-300 px-4 py-2.5 text-xs font-semibold hover:bg-emerald-900/50 transition cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Debug: Login as Super Admin</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PORTAL SELECT */}
        {step === 'portal-select' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase block mb-1">Step 2 of 3</span>
              <h3 className="text-xl font-bold text-white">Welcome!</h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold text-emerald-300">Where would you like to log in?</p>
            </div>

            <div className="space-y-4">
              {/* OWNER STUDIO OPTION */}
              <button
                onClick={() => {
                  setErrorMsg('');
                  setStep('owner-login');
                }}
                className="w-full flex items-center gap-4 rounded-3xl border border-slate-800/50 bg-slate-950/40 p-5 text-left transition hover:border-emerald-500/40 hover:bg-emerald-500/5 group cursor-pointer"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition">
                  <Building className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition">Owner Studio</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Manage listings, rent schedules, and financial ledger.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400 transition" />
              </button>

              {/* TENANTS OPTION */}
              <button
                onClick={() => {
                  setErrorMsg('');
                  setStep('tenant-login');
                }}
                className="w-full flex items-center gap-4 rounded-3xl border border-slate-800/50 bg-slate-950/40 p-5 text-left transition hover:border-sky-500/40 hover:bg-sky-500/5 group cursor-pointer"
              >
                <div className="bg-sky-500/10 border border-sky-500/20 p-3.5 rounded-2xl group-hover:bg-sky-500/20 group-hover:border-sky-500/40 transition">
                  <UserCircle2 className="h-6 w-6 text-sky-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm group-hover:text-sky-300 transition">Tenants</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Browse available homes, view booking lists, and pay rent.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-sky-400 transition" />
              </button>
            </div>

            <button
              onClick={() => {
                setErrorMsg('');
                setStep('general-login');
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to credentials</span>
            </button>
          </div>
        )}

        {/* STEP 3: OWNER LOGIN PAGE */}
        {step === 'owner-login' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="mb-6">
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase block mb-1">Step 3 of 3</span>
              <h3 className="text-xl font-bold text-white">Owner Studio Login</h3>
              <p className="text-slate-400 text-xs mt-1">Please enter password for owner dashboard.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-2xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Registered Email</label>
                <div className="w-full rounded-2xl border border-slate-800/50 bg-slate-950/40 px-4 py-3 text-sm text-slate-500 font-mono">
                  {email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Owner Portal Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/25 active:scale-95 cursor-pointer mt-2"
              >
                <span>Enter Owner Studio</span>
                <LogIn className="h-4 w-4" />
              </button>
            </form>

            <button
              onClick={() => {
                setErrorMsg('');
                setStep('portal-select');
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Portal Selection</span>
            </button>
          </div>
        )}

        {/* STEP 3: TENANT LOGIN PAGE */}
        {step === 'tenant-login' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="mb-6">
              <span className="text-xs font-bold text-sky-400 tracking-widest uppercase block mb-1">Step 3 of 3</span>
              <h3 className="text-xl font-bold text-white">Tenant Login Page</h3>
              <p className="text-slate-400 text-xs mt-1">Please enter password for tenant dashboard.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-2xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Registered Email</label>
                <div className="w-full rounded-2xl border border-slate-800/50 bg-slate-950/40 px-4 py-3 text-sm text-slate-500 font-mono">
                  {email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Tenant Portal Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={tenantPassword}
                  onChange={(e) => setTenantPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-sky-600/10 hover:shadow-sky-500/25 active:scale-95 cursor-pointer mt-2"
              >
                <span>Enter Tenants Portal</span>
                <LogIn className="h-4 w-4" />
              </button>
            </form>

            <button
              onClick={() => {
                setErrorMsg('');
                setStep('portal-select');
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Portal Selection</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
