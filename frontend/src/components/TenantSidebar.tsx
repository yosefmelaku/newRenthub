import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  CreditCard,
  Wrench,
  MessageSquareText,
  User,
  Home,
  LogOut,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TenantNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const TENANT_NAV_ITEMS: TenantNavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',              icon: <LayoutDashboard  className="h-5 w-5" /> },
  { id: 'lease',       label: 'My Lease & Property',    icon: <Building2        className="h-5 w-5" /> },
  { id: 'payments',    label: 'Payments & Billing',     icon: <CreditCard       className="h-5 w-5" /> },
  { id: 'maintenance', label: 'Maintenance Requests',   icon: <Wrench           className="h-5 w-5" /> },
  { id: 'inbox',       label: 'Inbox & Notifications',  icon: <MessageSquareText className="h-5 w-5" /> },
  { id: 'profile',     label: 'Account Settings',       icon: <User             className="h-5 w-5" /> },
];

interface TenantSidebarProps {
  /** Currently active section id */
  activeTab: string;
  /** Called when the user clicks a nav item */
  onTabChange: (id: string) => void;
  /** Returns user to the public marketplace homepage */
  onGoHome: () => void;
  /**
   * Full sign-out:
   *  – clears user state in App
   *  – removes localStorage tokens
   *  – redirects to homepage
   */
  onLogout: () => void;
  /** Whether the mobile drawer is open */
  isOpen: boolean;
  /** Closes the mobile drawer */
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export const TenantSidebar: React.FC<TenantSidebarProps> = ({
  activeTab,
  onTabChange,
  onGoHome,
  onLogout,
  isOpen,
  onClose,
}) => {

  // Full sign-out handler — clears every trace of the session
  const handleSignOut = () => {
    // 1. Wipe all persisted auth data from browser storage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentTab');
    sessionStorage.clear();

    // 2. Propagate state reset up to App (sets currentUser → null)
    //    App.tsx will then redirect to the landing / explore page
    onLogout();
  };

  const handleNavClick = (id: string) => {
    onTabChange(id);
    onClose(); // auto-close drawer on mobile after selection
  };

  const handleGoHome = () => {
    onClose();
    onGoHome();
  };

  return (
    <>
      {/* ── Mobile backdrop overlay ───────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300
          lg:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* ── Sidebar panel ────────────────────────────────────────────────── */}
      <aside
        role="navigation"
        aria-label="Tenant navigation"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-[#0e223d] text-slate-300
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* ── 1. BRANDING HOOK ──────────────────────────────────────────── */}
        {/* Clicking logo returns to public marketplace — the primary exit path */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#1b3252] shrink-0">
          <button
            onClick={handleGoHome}
            title="Back to RentHub marketplace"
            aria-label="Go to homepage"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
          >
            {/* Shield logo mark */}
            <div className="bg-emerald-500 group-hover:bg-emerald-400 transition-colors text-white p-1.5 rounded shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            {/* Wordmark */}
            <span className="font-bold text-white text-base tracking-tight group-hover:text-emerald-300 transition-colors">
              Rent<span className="text-emerald-400 group-hover:text-emerald-300">Hub</span>
            </span>
          </button>

          {/* Close button — mobile drawer only */}
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── 2. CENTRAL LINK MAP ────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5">

          {/* Role badge */}
          <p className="px-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
            Tenant Portal
          </p>

          {TENANT_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg
                  text-sm font-semibold transition-all duration-150 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
                  ${isActive
                    ? 'bg-[#1b3252] text-white shadow-sm'
                    : 'text-slate-400 hover:bg-[#1b3252]/70 hover:text-slate-100'
                  }
                `}
              >
                {/* Icon — brighter when active */}
                <span className={`shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}

          {/* ── Utility divider ── */}
          <div className="border-t border-[#1b3252] mx-2 my-3" />

          {/* Browse marketplace — secondary exit path */}
          <button
            onClick={handleGoHome}
            className="
              group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg
              text-sm font-semibold transition-all duration-150 cursor-pointer
              text-slate-500 hover:bg-[#1b3252]/70 hover:text-slate-100
              focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
            "
          >
            <Home className="h-5 w-5 shrink-0 text-slate-600 group-hover:text-slate-300 transition-colors" />
            <span>Browse Properties</span>
          </button>
        </nav>

        {/* ── 3. ABSOLUTE BOTTOM EXIT SECTION ───────────────────────────── */}
        {/* Pinned to bottom, clearly separated — always reachable */}
        <div className="shrink-0 border-t border-[#1b3252]">
          <button
            onClick={handleSignOut}
            className="
              group flex items-center gap-3 w-full px-6 py-4
              text-sm font-semibold transition-all duration-150 cursor-pointer
              text-slate-400 hover:text-rose-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400
            "
          >
            <LogOut className="h-5 w-5 shrink-0 transition-colors group-hover:text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};
