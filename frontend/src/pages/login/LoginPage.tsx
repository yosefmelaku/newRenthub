import React, { useState, type FormEvent } from 'react';
import {
  Home, ShieldCheck, ArrowRight, LogIn, ArrowLeft,
  Eye, EyeOff, AlertTriangle, Phone, User,
} from 'lucide-react';
import type { AppUser } from '../../types';

interface LoginPageProps {
  onLogin:      (user: AppUser) => void;
  onCancel:     () => void;
  initialMode?: 'login' | 'signup';
  role:         'renter' | 'owner' | 'super-admin';
}

type Flow = 'signup' | 'login';

// ── Password strength ─────────────────────────────────────────────────────────
function usePasswordStrength(pw: string) {
  const checks = [
    { label: 'At least 8 characters',         pass: pw.length >= 8 },
    { label: 'Uppercase letter (A–Z)',         pass: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter (a–z)',         pass: /[a-z]/.test(pw) },
    { label: 'Number (0–9)',                   pass: /[0-9]/.test(pw) },
    { label: 'Special character (!@#$…)',      pass: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.pass).length;
  const label = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score];
  const color = score <= 1 ? 'bg-rose-500' : score === 2 ? 'bg-orange-400' : score === 3 ? 'bg-amber-400' : score === 4 ? 'bg-emerald-400' : 'bg-emerald-600';
  return { score, label, color, checks };
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin, onCancel, initialMode = 'signup', role,
}) => {
  const [flow,            setFlow]            = useState<Flow>(initialMode === 'login' ? 'login' : 'signup');
  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [loading,         setLoading]         = useState(false);

  const strength = usePasswordStrength(password);

  const switchFlow = (to: Flow) => {
    setFlow(to);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  // ── SIGNUP ──────────────────────────────────────────────────────────────────
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 9) {
      setErrorMsg('Enter a valid phone number (at least 9 digits).');
      return;
    }
    if (strength.score < 3) {
      setErrorMsg('Password is too weak — please meet more of the requirements below.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/users/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim(), password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Account already exists — log in with the same credentials
        if (data.error === 'account_exists') {
          const r2   = await fetch('/api/users/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ phone: phone.trim(), password }),
          });
          const d2 = await r2.json();
          if (!r2.ok) { setErrorMsg(d2.message ?? d2.error ?? 'Login failed.'); return; }
          onLogin({ id: d2.user.id, name: d2.user.name, email: d2.user.email, role: d2.user.role, phone: d2.user.phone, token: d2.token });
          return;
        }
        setErrorMsg(data.message ?? data.error ?? 'Registration failed.');
        return;
      }

      onLogin({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, phone: data.user.phone, token: data.token });
    } catch {
      setErrorMsg('Network error — please check the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (phone.replace(/[^0-9]/g, '').length < 9) {
      setErrorMsg('Enter a valid phone number (at least 9 digits).');
      return;
    }
    if (!password) { setErrorMsg('Password is required.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/users/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message ?? data.error ?? 'Login failed.');
        return;
      }

      onLogin({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, phone: data.user.phone, token: data.token });
    } catch {
      setErrorMsg('Network error — please check the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared field helpers ────────────────────────────────────────────────────
  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 py-10 px-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">

        {/* ── LEFT: branding panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="z-10 space-y-6">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl">
                <Home className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  RentHub<span className="text-emerald-400">studio</span>
                </h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Portal Access</p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-100 leading-tight">Secure Portal Access</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Authenticate your identity to manage your account, bookings,
                and property information securely.
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-2">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure System Access
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li className="flex gap-2"><span className="text-emerald-400">•</span> Encrypted personal information</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span> Secure account verification</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span> Protected ledger records</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── RIGHT: form panel ────────────────────────────────────────────── */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">

          {/* ── SIGNUP form ─────────────────────────────────────────────────── */}
          {flow === 'signup' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Create your {role === 'super-admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)} Account
                </h3>
                <p className="text-sm text-slate-500 mt-1">Fill in your details to get started.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text" required autoFocus placeholder="e.g., John Doe"
                      value={name} onChange={e => setName(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel" required placeholder="e.g., +251912345678"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required placeholder="Create a secure password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className={`${inputCls} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: `${(strength.score / 5) * 100}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${strength.score <= 2 ? 'text-rose-500' : strength.score === 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {strength.label}
                        </span>
                      </div>
                      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {strength.checks.map(c => (
                          <li key={c.label} className={`text-[10px] flex items-center gap-1.5 ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.pass ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'} required placeholder="Re-enter your password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className={`${inputCls} pr-12 ${
                        confirmPassword && password !== confirmPassword ? 'border-rose-300 focus:border-rose-400' :
                        confirmPassword && password === confirmPassword ? 'border-emerald-300 focus:border-emerald-400' : ''
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition mt-2 cursor-pointer"
                >
                  {loading ? 'Creating account…' : <> Create Account <ArrowRight className="h-4 w-4" /> </>}
                </button>
              </form>

              <p className="text-sm text-slate-500 text-center pt-2">
                Already have an account?{' '}
                <button onClick={() => switchFlow('login')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition">
                  Sign in instead
                </button>
              </p>
            </div>
          )}

          {/* ── LOGIN form ───────────────────────────────────────────────────── */}
          {flow === 'login' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Sign In</h3>
                <p className="text-sm text-slate-500 mt-1">Use your phone number and password.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel" required autoFocus placeholder="e.g., +251912345678"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className={`${inputCls} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-4 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition mt-2 cursor-pointer"
                >
                  {loading ? 'Signing in…' : <> Sign In <LogIn className="h-4 w-4" /> </>}
                </button>
              </form>

              <p className="text-sm text-slate-500 text-center pt-2">
                No account yet?{' '}
                <button onClick={() => switchFlow('signup')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition">
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
