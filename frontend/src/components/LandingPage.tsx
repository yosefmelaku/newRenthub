import React, { useState, useEffect } from 'react';
import RentalImage from '../assets/images/rental_property_landing_1784888062523.jpg';
import { 
  ShieldCheck, 
  ArrowRight, 
  Building2,
  UserCircle2, 
  Lock, 
  Zap, 
  ShieldAlert,
  ClipboardList,
  Sparkles,
  ChevronDown,
  LineChart,
  FileText,
  CreditCard,
  Search,
  Users,
  Hammer,
  PenTool,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HowItWorksSection } from './HowItWorksSection';

const rotatingWords = [
  { text: "report issues", color: "text-red-600" },
  { text: "calculate payments", color: "text-blue-600" },
  { text: "access agreements", color: "text-emerald-600" }
];

const letterContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const letterItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

import type { AppUser } from '../types';

interface LandingPageProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
  onAdminLoginClick: () => void;
  onAuthSuccess: (user: AppUser) => void;
  onPricingClick: () => void;
  onHowItWorksClick: () => void;
  onReviewsClick: () => void;
}

const Overlay = ({ isOpen, onClose, title, children, error }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, error?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col p-6 md:p-12"
      >
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition">
            <X className="w-8 h-8" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {children}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onAdminLoginClick, onAuthSuccess, onPricingClick, onHowItWorksClick, onReviewsClick }) => {
  const [index, setIndex] = useState(0);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const solutions = [
    { icon: LineChart, text: "Rental accounting" },
    { icon: FileText, text: "Tax reporting" },
    { icon: CreditCard, text: "Collect rent" },
    { icon: Search, text: "Find tenants" },
    { icon: Users, text: "Tenant screening" },
    { icon: Hammer, text: "Property maintenance" },
    { icon: PenTool, text: "Electronic signatures" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoginOpen(false);
    onAuthSuccess({ name: email.split('@')[0], email: email.trim(), role: 'renter' });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsGetStartedOpen(false);
    onAuthSuccess({ name: fullName.trim(), email: email.trim(), role: 'renter' });
  };


  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans relative overflow-hidden" id="portal-landing-root">
      <Overlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Sign In" error={error}>
        <form className="w-full max-w-sm space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">Email</label>
            <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 border rounded-xl p-3" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">Password</label>
            <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 border rounded-xl p-3" required />
          </div>
          <button type="submit" className="w-full bg-[#059669] text-white font-bold p-3 rounded-xl">Sign In</button>
        </form>
      </Overlay>
      <Overlay isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} title="Get Started" error={error}>
        <form className="w-full max-w-sm space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="reg-name">Full Name</label>
            <input type="text" id="reg-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 border rounded-xl p-3" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="reg-email">Email</label>
            <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 border rounded-xl p-3" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="reg-password">Password</label>
            <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 border rounded-xl p-3" required />
          </div>
          <button type="submit" className="w-full bg-[#e11d48] text-white font-bold p-3 rounded-xl">Create Account</button>
        </form>
      </Overlay>

      {/* Background Subtle Mesh / Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none" id="landing-bg-glow">
        <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-[-5%] right-[10%] w-[350px] h-[350px] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      {/* Elegant Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-50 shadow-xs" id="landing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3" id="landing-logo">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900">
                RentHub<span className="text-[#059669]">studio</span>
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 font-semibold text-slate-600 text-sm">
            <div className="relative" onMouseEnter={() => setIsSolutionsOpen(true)} onMouseLeave={() => setIsSolutionsOpen(false)}>
                <button className="flex items-center gap-1 hover:text-slate-900 transition">
                    Solutions <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                    {isSolutionsOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-[500px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex gap-6 z-50"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center mb-4 pr-2">
                                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Solutions</h3>
                                    <button onClick={() => setIsSolutionsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {solutions.map((item, idx) => (
                                    <button key={idx} onClick={() => { setIsSolutionsOpen(false); setIsLoginOpen(true); }} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-slate-700 hover:text-emerald-700 transition">
                                        <item.icon className="w-5 h-5 text-emerald-600" />
                                        <span className="font-semibold text-sm">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <a onClick={onPricingClick} className="hover:text-slate-900 transition cursor-pointer">Pricing</a>
            <a onClick={onReviewsClick} className="hover:text-slate-900 transition cursor-pointer">Reviews</a>
            <a onClick={onHowItWorksClick} className="hover:text-slate-900 transition cursor-pointer">How it works</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-semibold text-sm transition cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => setIsGetStartedOpen(true)}
              className="bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 md:px-12 max-w-6xl mx-auto" id="landing-hero">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 font-mono text-xs px-3 py-1 rounded-full border border-emerald-100 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Encrypted Direct Access Console</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight leading-none text-slate-900">
              This software is used to <span className={`${rotatingWords[index].color} block sm:inline`}>
              <AnimatePresence mode="wait">
                  <motion.span
                      key={rotatingWords[index].text}
                      variants={letterContainer}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="inline-block"
                  >
                      {rotatingWords[index].text.split("").map((letter, i) => (
                          <motion.span key={i} variants={letterItem} className="inline-block">
                              {letter === " " ? "\u00A0" : letter}
                          </motion.span>
                      ))}
                  </motion.span>
              </AnimatePresence>
              </span> and streamline your rental experience.
            </h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl">
              A single, secure dashboard for verified tenants to review agreements and complete payments, and for property owners to directly track reservations and ledgers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4">
              <button
                onClick={() => setIsGetStartedOpen(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Your Portal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm px-8 py-3.5 rounded-2xl transition cursor-pointer"
              >
                Sign In Directly
              </button>
            </div>
          </div>
          
          <div className="hidden md:flex flex-1 justify-end p-2 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-inner overflow-hidden">
            <img src={RentalImage} alt="Rental property" className="w-full h-full object-cover rounded-[1.75rem]" />
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto" id="landing-solutions">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Complete Rental Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Financials */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Financial Management</h3>
            <div className="space-y-4">
              {[
                { icon: LineChart, text: "Rental accounting", desc: "Track income and expenses easily for every property." },
                { icon: FileText, text: "Tax reporting", desc: "Simplify your tax filing with automated financial summaries." },
                { icon: CreditCard, text: "Collect rent", desc: "Automate rent collection and track payments effortlessly." },
              ].map((item, i) => (
                <button key={i} onClick={() => onLoginClick()} className="w-full text-left flex gap-4 p-2 hover:bg-slate-50 rounded-lg transition">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.text}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tenancy */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Tenancy Services</h3>
            <div className="space-y-4">
              {[
                { icon: Search, text: "Find tenants", desc: "Market your property to thousands of potential tenants." },
                { icon: Users, text: "Tenant screening", desc: "Verify background, credit score, and references quickly." },
                { icon: PenTool, text: "Electronic signatures", desc: "Digitally sign and manage your lease agreements." },
              ].map((item, i) => (
                <button key={i} onClick={() => onLoginClick()} className="w-full text-left flex gap-4 p-2 hover:bg-slate-50 rounded-lg transition">
                  <div className="bg-sky-50 p-2 rounded-lg">
                    <item.icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.text}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Operations</h3>
            <div className="space-y-4">
              {[
                { icon: Hammer, text: "Property maintenance", desc: "Log, track, and resolve maintenance issues efficiently." },
                { icon: Sparkles, text: "Smart assistant", desc: "AI-powered recommendations for property management." },
                { icon: Lock, text: "Security protocols", desc: "Advanced data protection and access control." },
              ].map((item, i) => (
                <button key={i} onClick={() => onLoginClick()} className="w-full text-left flex gap-4 p-2 hover:bg-slate-50 rounded-lg transition">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <item.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.text}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      {/* Interactive Role Selector Section */}
      <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto" id="landing-roles">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          
          {/* Tenant Portal Preview Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs hover:shadow-md transition-all duration-300 relative group">
            <div className="absolute top-6 right-6 bg-sky-50 text-sky-600 p-3 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">Tenant Suite</span>
            <h3 className="text-xl font-bold text-slate-900 mt-6">Verified Tenant Portal</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Log in to review your current active tenancy details, check dates, view payment logs, and complete your rent or utility fees instantly with complete encryption.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { label: 'Tenancy Agreements', desc: 'Securely store and review digital contracts.' },
                { label: 'Rent Payments', desc: 'Settle monthly invoices securely.' },
                { label: 'Booking Tracking', desc: 'Monitor requested, active, and past booking slots.' }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="bg-sky-50 text-sky-600 rounded-full p-0.5 mt-0.5">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">{item.label}: </span>
                    <span className="text-slate-500">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsGetStartedOpen(true)}
              className="mt-8 w-full bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Enter Tenant Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Owner Portal Preview Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xs hover:shadow-md transition-all duration-300 relative group">
            <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-600 p-3 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Owner Suite</span>
            <h3 className="text-xl font-bold text-slate-900 mt-6">Property Owner Portal</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Everything property managers and landlords need to publish listings, approve tenant bookings, keep track of security deposits, and view rent roll ledgers.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { label: 'Listing Inventory', desc: 'Directly manage details, pricing, and availability.' },
                { label: 'Booking Approvals', desc: 'Instantly approve or reject tenant rental requests.' },
                { label: 'Invoicing & Ledgers', desc: 'Trace completed transactions, service fees, and balances.' }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="bg-emerald-50 text-emerald-600 rounded-full p-0.5 mt-0.5">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">{item.label}: </span>
                    <span className="text-slate-500">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsGetStartedOpen(true)}
              className="mt-8 w-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Enter Owner Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* Security Guarantee Banner */}
      <section className="px-6 md:px-12 pb-16 max-w-4xl mx-auto" id="landing-security">
        <div className="bg-[#0f172a] text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Security & Privacy Protocol</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Your data belongs to you. Period.</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              We operate an isolated tenant-owner ledger system. There are no secondary third-party marketing trackers, no external AI integrations parsing your private records without consent, and all financial transactions are backed by cryptographic validation hashes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="border border-slate-800 p-4 rounded-2xl bg-slate-900/50">
                <ShieldAlert className="h-4 w-4 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-200">Anti-Leak Protocols</h4>
                <p className="text-[10px] text-slate-500 mt-1">Tenant identity and contact listings are entirely private.</p>
              </div>
              <div className="border border-slate-800 p-4 rounded-2xl bg-slate-900/50">
                <ClipboardList className="h-4 w-4 text-sky-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-200">Detailed Auditing</h4>
                <p className="text-[10px] text-slate-500 mt-1">All booking modifications logged with absolute security.</p>
              </div>
              <div className="border border-slate-800 p-4 rounded-2xl bg-slate-900/50">
                <Zap className="h-4 w-4 text-yellow-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-200">Zero Fluff</h4>
                <p className="text-[10px] text-slate-500 mt-1">No unrelated real estate ads or promotional noise.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 px-12 text-center text-xs text-slate-400 font-medium mt-auto" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-50 text-emerald-600 p-1 rounded-md">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-sans font-extrabold text-sm tracking-tight text-[#0f172a]">
              RentHub<span className="text-emerald-600 font-bold">studio</span>
            </span>
          </div>
          
          <p className="text-[11px]">&copy; 2026 Direct Tenant & Owner Portal. Built with security-first private database rules.</p>
          
          <div className="flex gap-4 font-bold text-emerald-600">
            <span className="cursor-pointer hover:underline" onClick={onAdminLoginClick}>Admin Portal</span>
            <span className="cursor-pointer hover:underline" onClick={() => setIsLoginOpen(true)}>Sign In</span>
            <span className="cursor-pointer hover:underline" onClick={() => setIsGetStartedOpen(true)}>Register Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
