import React, { useState } from 'react';
import { Users, ChevronDown, LogOut, Shield, Briefcase, Home, Key } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPERADMIN' | 'OWNER' | 'TENANT';
  icon: React.ReactNode;
  color: string;
}

// Test accounts for easy switching
const TEST_ACCOUNTS: Account[] = [
  {
    id: 'admin-1',
    name: 'Yosef Melalaku',
    email: '251905728376@phone.user',
    phone: '+251905728376',
    role: 'SUPERADMIN',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-rose-500',
  },
  {
    id: 'owner-1',
    name: 'John Property Owner',
    email: '251911111111@phone.user',
    phone: '+251911111111',
    role: 'OWNER',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-blue-500',
  },
  {
    id: 'tenant-1',
    name: 'Jane Tenant',
    email: '251922222222@phone.user',
    phone: '+251922222222',
    role: 'TENANT',
    icon: <Home className="h-4 w-4" />,
    color: 'bg-emerald-500',
  },
];

interface AccountSwitcherProps {
  currentUser: { name: string; email: string; role: string; phone?: string; id?: string } | null;
  onSwitchAccount: (account: Account) => void;
  onLogout: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  currentUser,
  onSwitchAccount,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const currentRole = String(currentUser.role).toUpperCase();
  const currentColor = 
    currentRole === 'SUPERADMIN' ? 'bg-rose-500' :
    currentRole === 'OWNER' ? 'bg-blue-500' :
    'bg-emerald-500';

  const currentIcon = 
    currentRole === 'SUPERADMIN' ? <Shield className="h-4 w-4" /> :
    currentRole === 'OWNER' ? <Briefcase className="h-4 w-4" /> :
    <Home className="h-4 w-4" />;

  const handleSwitch = async (account: Account) => {
    setIsOpen(false);
    
    try {
      // Actually login through the backend API
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: account.phone,
          password: account.role === 'SUPERADMIN' ? 'admin@321' : 'test123',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Login failed: ${error.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      
      // Save the real token to localStorage
      const userData = {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        token: data.token,
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Reload page to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Account switch error:', error);
      alert('Failed to switch account. Please try again.');
    }
  };

  return (
    <div className="relative">
      {/* Current Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 transition-all shadow-sm hover:shadow"
      >
        <div className={`${currentColor} text-white rounded-full p-1.5`}>
          {currentIcon}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-gray-900 leading-tight">{currentUser.name}</p>
          <p className="text-[10px] text-gray-500">{currentRole}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <h3 className="font-bold text-sm">Quick Account Switcher</h3>
              </div>
              <p className="text-xs text-emerald-100">Switch between test accounts instantly</p>
            </div>

            {/* Current Account */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Account</p>
              <div className="flex items-center gap-3">
                <div className={`${currentColor} text-white rounded-full p-2`}>
                  {currentIcon}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Available Accounts */}
            <div className="p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Switch To</p>
              <div className="space-y-1">
                {TEST_ACCOUNTS
                  .filter(acc => acc.email !== currentUser.email)
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSwitch(account)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all text-left group"
                    >
                      <div className={`${account.color} text-white rounded-full p-2 group-hover:scale-110 transition-transform`}>
                        {account.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold
                          ${account.role === 'SUPERADMIN' ? 'bg-rose-100 text-rose-700' :
                            account.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'}`}>
                          {account.role}
                        </span>
                      </div>
                      <Key className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout Completely
              </button>
            </div>

            {/* Footer Note */}
            <div className="bg-amber-50 border-t border-amber-200 p-3">
              <p className="text-[10px] text-amber-700 text-center">
                ⚠️ For testing only - Accounts switch without password
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
