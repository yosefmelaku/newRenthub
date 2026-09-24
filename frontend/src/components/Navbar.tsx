import React, { useState } from 'react';
import { Home, ShieldAlert, KeyRound, LogOut, Building2, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import type { AppUser } from '../types';


interface NavbarProps {
  currentTab: 'explore' | 'renter-dashboard' | 'super-admin' | 'owner-dashboard';
  setCurrentTab: (tab: 'explore' | 'renter-dashboard' | 'super-admin' | 'owner-dashboard') => void;
  currentUser: AppUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLoginClick,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('explore')}>
              {/* Premium geometric overlapping block logo to replace the old standard box */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0" id="nav-logo-box">
                {/* Left deep blue roof block */}
                <div className="absolute top-1 left-0.5 w-6 h-6 bg-[#1e40af] transform -skew-x-12 rounded-xs" />
                {/* Right emerald green wall/roof block */}
                <div className="absolute top-2 left-5 w-7 h-7 bg-[#059669] transform skew-x-12 rounded-xs border-2 border-white shadow-sm" />
                {/* Central high-tech white cutout window */}
                <div className="absolute bottom-3 left-4 w-2 h-2 bg-white rounded-full z-10" />
              </div>
              <div>
                <span className="block font-sans font-extrabold text-2xl tracking-tight text-gray-900">
                  RentHub<span className="text-[#059669] font-bold">studio</span>
                </span>
                <span className="hidden sm:inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full border border-emerald-100">
                  Secure
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {!currentUser && (
                <button type="button" onClick={onLoginClick} className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer hover:bg-emerald-500 transition-all">
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 md:ml-auto">
            {(!currentUser) && (
              <button
                type="button"
                id="tab-btn-explore"
                onClick={() => setCurrentTab('explore')}
                className={`px-4 py-2 rounded-lg border font-sans text-sm font-medium transition-all ${
                  currentTab === 'explore'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Browse Properties
              </button>
            )}
            {currentUser?.role === 'renter' && (
              <button
                type="button"
                id="tab-btn-renter"
                onClick={() => setCurrentTab('renter-dashboard')}
                className={`px-4 py-2 rounded-lg border font-sans text-sm font-medium transition-all ${
                  currentTab === 'renter-dashboard'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
            )}
            {currentUser?.role === 'owner' && (
              <button
                type="button"
                id="tab-btn-owner"
                onClick={() => setCurrentTab('owner-dashboard')}
                className={`px-4 py-2 rounded-lg border font-sans text-sm font-medium transition-all ${
                  currentTab === 'owner-dashboard'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Owner Portal
              </button>
            )}
            {currentUser?.role === 'super-admin' && (
              <button
                type="button"
                id="tab-btn-super-admin"
                onClick={() => setCurrentTab('super-admin')}
                className={`px-4 py-2 rounded-lg border font-sans text-sm font-medium transition-all ${
                  currentTab === 'super-admin'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Super Admin
              </button>
            )}
          </div>


          <div className="flex items-center justify-end">
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500">{currentUser.role}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden flex justify-around border-t border-gray-100 py-2">
          {(!currentUser) && (
            <button
              onClick={() => setCurrentTab('explore')}
              className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
                currentTab === 'explore' ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Browse</span>
            </button>
          )}
          {currentUser?.role === 'renter' && (
            <button
              onClick={() => setCurrentTab('renter-dashboard')}
              className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
                currentTab === 'renter-dashboard' ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <KeyRound className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
          )}
          {currentUser?.role === 'owner' && (
            <button
              onClick={() => setCurrentTab('owner-dashboard')}
              className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
                currentTab === 'owner-dashboard' ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Owner</span>
            </button>
          )}
          {currentUser?.role === 'super-admin' && (
            <button
              onClick={() => setCurrentTab('super-admin')}
              className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
                currentTab === 'super-admin' ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
