import React, { useState, type FormEvent } from 'react';
import { Home, ShieldCheck, ArrowRight, LogIn, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import type { AppUser } from '../../types';

interface LoginPageProps {
  onLogin: (user: AppUser) => void;
  onCancel: () => void;
  initialMode?: 'login' | 'signup';
  role: 'renter' | 'owner' | 'super-admin';
}

type AuthFlowState = 'select-mode' | 'signup-form' | 'login-form' | 'name-entry';

const SocialButton: React.FC<{ provider: 'google' | 'apple' | 'facebook'; onClick: () => void }> = ({ provider, onClick }) => {
  const providers = {
    google: { label: 'Google', color: 'hover:bg-slate-50 border-slate-200', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> },
    apple: { label: 'Apple', color: 'hover:bg-slate-50 border-slate-200', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 13.98c.18 1.15.86 2.15 1.87 2.8-.82 1.25-2.12 1.77-3.6 1.83-1.15.11-2.27-.45-3.02-.45s-1.92.45-3.15.45c-1.63 0-3.04-1.03-3.66-2.52-1.55-4.22.25-7.7 3.03-7.7 1.34 0 2.37.95 3.25.95.84 0 2.07-1.05 3.5-1.05.58 0 2.27.08 3.48 1.82-3.12 1.86-2.73 5.48-1.5 6.82zM12.5 5.5c.34-1.2 1.6-2.23 2.92-2.38-.17 1.37-1.53 2.38-2.92 2.38z" /></svg> },
    facebook: { label: 'Facebook', color: 'hover:bg-blue-50 border-blue-100 hover:border-blue-200', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.07c0-6.63-5.37-12-12-12s-12 5.37-12 12c0 5.99 4.38 10.97 10.09 11.9v-8.42h-3.04v-3.48h3.04v-2.64c0-3.01 1.79-4.67 4.54-4.67 1.31 0 2.68.23 2.68.23v2.94h-1.51c-1.49 0-1.96.92-1.96 1.86v2.25h3.32l-.53 3.48h-2.79v8.42c5.71-.93 10.09-5.91 10.09-11.9z" /></svg> },
  };
  return (
    <button type="button" onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-2xl transition text-sm font-semibold text-slate-700 ${providers[provider].color}`}>
      {providers[provider].icon} {providers[provider].label}
    </button>
  );
};

// Password strength checker
function getPasswordStrength(pw: string): { score: number; label: string; color: string; checks: { label: string; pass: boolean }[] } {
  const checks = [
    { label: 'At least 12 characters',        pass: pw.length >= 12 },
    { label: 'Uppercase letter (A–Z)',         pass: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter (a–z)',         pass: /[a-z]/.test(pw) },
    { label: 'Number (0–9)',                   pass: /[0-9]/.test(pw) },
    { label: 'Special character (!@#$%^&*…)', pass: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.pass).length;
  const label = score <= 1 ? 'Very Weak' : score === 2 ? 'Weak' : score === 3 ? 'Fair' : score === 4 ? 'Strong' : 'Very Strong';
  const color = score <= 1 ? 'bg-rose-500' : score === 2 ? 'bg-orange-400' : score === 3 ? 'bg-amber-400' : score === 4 ? 'bg-emerald-400' : 'bg-emerald-600';
  return { score, label, color, checks };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onCancel, initialMode = 'signup', role }) => {
  const [flow, setFlow] = useState<AuthFlowState>(() => {
    if (initialMode === 'login') return 'login-form';
    return 'signup-form';
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const strength = getPasswordStrength(password);

  const handleSocialClick = (_providerName: 'google' | 'apple' | 'facebook') => {
    setFlow('name-entry');
  };

  const handleModeSelection = (mode: 'signup' | 'login') => {
    setErrorMsg('');
    setFlow(mode === 'signup' ? 'signup-form' : 'login-form');
  };

  const handleSignupSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) { setErrorMsg('Please enter a valid email address.'); return; }
    if (strength.score < 4) {
      setErrorMsg('Password is too weak. Please meet all security requirements below.');
      return;
    }
    setErrorMsg('');
    setFlow('name-entry');
  };

  const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    if (!password) { setErrorMsg('Please enter your password.'); return; }
    setFlow('name-entry');
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[550px] transition-all">

        {/* LEFT — Branding */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="z-10">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-xl mb-6 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl">
                <Home className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">RentHub<span className="text-emerald-400">studio</span></h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Portal Access</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-100 leading-tight">Secure Portal Access</h3>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Authenticate your identity to manage your account, bookings, and property information securely.
            </p>

            {/* Security policy notice */}
            <div className="mt-8 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-2">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure System Access</p>
              <ul className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">•</span> Encrypted personal information</li>
                <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">•</span> Secure account verification</li>
                <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">•</span> Protected ledger records</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT — Forms */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">

          {/* FLOW: SIGN-UP */}
          {flow === 'signup-form' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Create your {role.charAt(0).toUpperCase() + role.slice(1)} Account
                </h3>
                <p className="text-sm text-slate-500 mt-1">Please provide the necessary information to register your account.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{errorMsg}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email" required placeholder="name@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required placeholder="Secure password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all shadow-md mt-2 cursor-pointer hover:shadow-lg bg-emerald-600 hover:bg-emerald-500"
                >
                  Register Account <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-bold">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="flex gap-3">
                  <SocialButton provider="google" onClick={() => handleSocialClick('google')} />
                  <SocialButton provider="apple" onClick={() => handleSocialClick('apple')} />
                  <SocialButton provider="facebook" onClick={() => handleSocialClick('facebook')} />
                </div>
              </form>
            </div>
          )}

          {/* FLOW: LOGIN */}
          {flow === 'login-form' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Sign In</h3>
                <p className="text-sm text-slate-500 mt-1">Access your account securely.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{errorMsg}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email" required placeholder="name@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-4 text-sm font-bold text-white shadow-md hover:shadow-lg mt-2 cursor-pointer transition">
                  Sign In <LogIn className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-bold">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="flex gap-3">
                  <SocialButton provider="google" onClick={() => handleSocialClick('google')} />
                  <SocialButton provider="apple" onClick={() => handleSocialClick('apple')} />
                  <SocialButton provider="facebook" onClick={() => handleSocialClick('facebook')} />
                </div>
              </form>

              <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button onClick={() => handleModeSelection('signup')} className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition">
                    Register instead
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* FLOW: NAME ENTRY */}
          {flow === 'name-entry' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Complete your Profile</h3>
                <p className="text-sm text-slate-500 mt-1">Please enter your details to finish setting up your account.</p>
              </div>

              <form onSubmit={(e) => { 
                e.preventDefault(); 
                onLogin({ name, email: email || 'social-user@example.com', role, address, phone }); 
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text" required placeholder="e.g., John Doe"
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Address</label>
                  <input
                    type="text" required placeholder="e.g., 123 Main St"
                    value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                  <input
                    type="tel" required placeholder="e.g., +1234567890"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition"
                  />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-4 text-sm font-bold text-white shadow-md hover:shadow-lg mt-2 cursor-pointer transition">
                  Complete Registration <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
