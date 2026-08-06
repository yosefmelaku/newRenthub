import React, { useState } from 'react';
import { Home, User, ShieldAlert, KeyRound, Lock, LogOut, Search, Building2, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { AppUser } from '../types';


interface NavbarProps {
  currentTab: 'explore' | 'renter-dashboard' | 'super-admin' | 'owner-dashboard';
  setCurrentTab: (tab: 'explore' | 'renter-dashboard' | 'super-admin' | 'owner-dashboard') => void;
  currentUser: AppUser | null;
  globalSearchTerm: string;
  setGlobalSearchTerm: (value: string) => void;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  globalSearchTerm,
  setGlobalSearchTerm,
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
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0" id="nav-logo-box">
                {/* Left deep blue roof block */}
                <div className="absolute top-1 left-0.5 w-4.5 h-4.5 bg-[#1e40af] transform -skew-x-12 rounded-xs" />
                {/* Right emerald green wall/roof block */}
                <div className="absolute top-2 left-3.5 w-5 h-5 bg-[#059669] transform skew-x-12 rounded-xs border-2 border-white shadow-sm" />
                {/* Central high-tech white cutout window */}
                <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white rounded-full z-10" />
              </div>
              <div>
                <span className="font-sans font-extrabold text-xl tracking-tight text-gray-900">
                  RentHub<span className="text-[#059669] font-bold">studio</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full border border-emerald-100">
                  Secure
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {currentUser ? (
                <button type="button" onClick={onLogout} className="rounded-xl border border-gray-200 p-2 text-gray-600 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
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
                My Bookings
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


          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchTerm}
                  onChange={(event) => setGlobalSearchTerm(event.target.value)}
                  placeholder="Search listings, city, or amenities"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer border border-gray-100"
                  >
                    <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                        {currentUser.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{currentUser.email}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-50">{currentUser.email}</div>
                      <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="h-4 w-4" /> Account settings
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <HelpCircle className="h-4 w-4" /> Help
                      </button>
                      <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
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
              <span>Bookings</span>
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
