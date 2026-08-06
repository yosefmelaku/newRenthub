import React from 'react';
import { 
  ShieldCheck, 
  LogOut,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

export type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasSubItems?: boolean;
};

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  menuItems: SidebarItem[];
  title: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onLogout, 
  menuItems, 
  title,
}) => {
  return (
    <aside className="bg-[#0e223d] text-slate-300 w-64 flex flex-col shrink-0 min-h-screen">
      {/* Sidebar Logo Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1b3252]">
          <div className="bg-emerald-500 text-white p-1.5 rounded">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Rent<span className="text-emerald-400">Hub</span>
          </span>
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeSection === item.id 
                ? 'bg-[#1b3252] text-white' 
                : 'hover:bg-[#1b3252] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
            </div>
            {item.hasSubItems && <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
        ))}
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:bg-[#1b3252] hover:text-white text-slate-400">
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Logout */}
      <button 
        onClick={onLogout}
        className="flex items-center gap-3 px-6 py-6 text-slate-400 hover:text-rose-400 transition text-sm font-medium border-t border-[#1b3252]"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
};
