/**
 * NewDashboardPage.tsx - Redesigned Tenant Dashboard
 * 
 * Clear sections:
 * - Dashboard (Overview)
 * - Properties (Browse & View)
 * - My Applications (Applied properties)
 * - My Leases (Active rental contracts)
 * - Payments (Payment history & methods)
 * - Messages (Communication)
 * - Profile (Account settings)
 */

import React, { useState } from 'react';
import {
  LayoutDashboard, Home, FileText, ScrollText, CreditCard,
  MessageSquare, User, LogOut, Bell, Search, Plus,
  Building, Calendar, MapPin, DollarSign, CheckCircle,
  Clock, XCircle, ArrowRight, Download, Eye
} from 'lucide-react';
import type { AppUser, Booking, PropertyListing } from '../../types';

interface DashboardPageProps {
  user: AppUser;
  bookings: Booking[];
  listings: PropertyListing[];
  onCancelBooking: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onBrowseMore: () => void;
  onLogout: () => void;
  onUpdateUser: (user: AppUser) => void;
}

type Section = 'dashboard' | 'properties' | 'applications' | 'leases' | 'payments' | 'messages' | 'profile';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  bookings,
  listings,
  onCancelBooking,
  loading,
  onRefresh,
  onBrowseMore,
  onLogout,
  onUpdateUser,
}) => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const activeLeases = bookings.filter(b => b.status === 'approved');
  const pendingApplications = bookings.filter(b => b.status === 'pending');
  const totalPayments = activeLeases.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold">
            Rent<span className="text-emerald-600">Hub</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Tenant Portal</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          />
          <NavItem
            icon={<Home className="h-5 w-5" />}
            label="Properties"
            active={activeSection === 'properties'}
            onClick={() => setActiveSection('properties')}
          />
          <NavItem
            icon={<FileText className="h-5 w-5" />}
            label="My Applications"
            active={activeSection === 'applications'}
            onClick={() => setActiveSection('applications')}
            badge={pendingApplications.length}
          />
          <NavItem
            icon={<ScrollText className="h-5 w-5" />}
            label="My Leases"
            active={activeSection === 'leases'}
            onClick={() => setActiveSection('leases')}
            badge={activeLeases.length}
          />
          <NavItem
            icon={<CreditCard className="h-5 w-5" />}
            label="Payments"
            active={activeSection === 'payments'}
            onClick={() => setActiveSection('payments')}
          />
          <NavItem
            icon={<MessageSquare className="h-5 w-5" />}
            label="Messages"
            active={activeSection === 'messages'}
            onClick={() => setActiveSection('messages')}
          />
          <NavItem
            icon={<User className="h-5 w-5" />}
            label="Profile"
            active={activeSection === 'profile'}
            onClick={() => setActiveSection('profile')}
          />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'properties' && 'Browse Properties'}
                {activeSection === 'applications' && 'My Applications'}
                {activeSection === 'leases' && 'My Leases'}
                {activeSection === 'payments' && 'Payments'}
                {activeSection === 'messages' && 'Messages'}
                {activeSection === 'profile' && 'Profile'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeSection === 'dashboard' && 'Welcome back! Here\'s your rental overview'}
                {activeSection === 'properties' && 'Find your perfect rental property'}
                {activeSection === 'applications' && 'Track your property applications'}
                {activeSection === 'leases' && 'Manage your active rental contracts'}
                {activeSection === 'payments' && 'View payment history and methods'}
                {activeSection === 'messages' && 'Communicate with property owners'}
                {activeSection === 'profile' && 'Manage your account settings'}
              </p>
            </div>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {activeSection === 'dashboard' && (
            <DashboardOverview
              user={user}
              activeLeases={activeLeases.length}
              pendingApplications={pendingApplications.length}
              totalPayments={totalPayments}
            />
          )}
          {activeSection === 'properties' && (
            <PropertiesSection listings={listings} onBrowseMore={onBrowseMore} />
          )}
          {activeSection === 'applications' && (
            <ApplicationsSection applications={pendingApplications} />
          )}
          {activeSection === 'leases' && (
            <LeasesSection leases={activeLeases} />
          )}
          {activeSection === 'payments' && (
            <PaymentsSection bookings={bookings} />
          )}
          {activeSection === 'messages' && <MessagesSection />}
          {activeSection === 'profile' && (
            <ProfileSection user={user} onUpdateUser={onUpdateUser} />
          )}
        </div>
      </main>
    </div>
  );
};

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all
      ${active
        ? 'bg-emerald-50 text-emerald-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
      }
    `}
  >
    {icon}
    <span className="text-sm flex-1 text-left">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

// Dashboard Overview Section
interface DashboardOverviewProps {
  user: AppUser;
  activeLeases: number;
  pendingApplications: number;
  totalPayments: number;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  activeLeases,
  pendingApplications,
  totalPayments,
}) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        icon={<ScrollText className="h-6 w-6" />}
        label="Active Leases"
        value={activeLeases}
        color="emerald"
      />
      <StatCard
        icon={<FileText className="h-6 w-6" />}
        label="Pending Applications"
        value={pendingApplications}
        color="amber"
      />
      <StatCard
        icon={<DollarSign className="h-6 w-6" />}
        label="Total Payments"
        value={`$${totalPayments.toFixed(2)}`}
        color="blue"
      />
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          icon={<Search className="h-5 w-5" />}
          title="Browse Properties"
          description="Find your next rental home"
          onClick={() => {}}
        />
        <QuickActionCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Make Payment"
          description="Pay your rent online"
          onClick={() => {}}
        />
      </div>
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        <ActivityItem
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          title="Payment Received"
          description="Your payment of $1,200 was processed successfully"
          time="2 hours ago"
        />
        <ActivityItem
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          title="Application Submitted"
          description="Your application for Downtown Apartment is under review"
          time="1 day ago"
        />
      </div>
    </div>
  </div>
);

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'emerald' | 'amber' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className={`inline-flex p-3 rounded-xl ${colors[color]} mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

// Quick Action Card
interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
  >
    <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
  </button>
);

// Activity Item
interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, description, time }) => (
  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    {icon}
    <div className="flex-1">
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <span className="text-xs text-gray-400">{time}</span>
  </div>
);

// Properties Section
interface PropertiesSectionProps {
  listings: PropertyListing[];
  onBrowseMore: () => void;
}

const PropertiesSection: React.FC<PropertiesSectionProps> = ({ listings, onBrowseMore }) => (
  <div>
    <button
      onClick={onBrowseMore}
      className="mb-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
    >
      <Plus className="h-5 w-5" />
      Browse All Properties
    </button>
    <p className="text-gray-500">Click the button above to browse available properties.</p>
  </div>
);

// Applications Section
interface ApplicationsSectionProps {
  applications: Booking[];
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ applications }) => (
  <div className="space-y-4">
    {applications.length === 0 ? (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No Applications"
        description="You haven't applied to any properties yet"
      />
    ) : (
      applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))
    )}
  </div>
);

// Leases Section
interface LeasesSectionProps {
  leases: Booking[];
}

const LeasesSection: React.FC<LeasesSectionProps> = ({ leases }) => (
  <div className="space-y-4">
    {leases.length === 0 ? (
      <EmptyState
        icon={<ScrollText className="h-12 w-12" />}
        title="No Active Leases"
        description="You don't have any active rental contracts"
      />
    ) : (
      leases.map((lease) => (
        <LeaseCard key={lease.id} lease={lease} />
      ))
    )}
  </div>
);

// Payments Section
interface PaymentsSectionProps {
  bookings: Booking[];
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({ bookings }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <PaymentHistoryItem key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  </div>
);

// Messages Section
const MessagesSection: React.FC = () => (
  <EmptyState
    icon={<MessageSquare className="h-12 w-12" />}
    title="No Messages"
    description="Your messages will appear here"
  />
);

// Profile Section
interface ProfileSectionProps {
  user: AppUser;
  onUpdateUser: (user: AppUser) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUpdateUser }) => (
  <div className="max-w-2xl">
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={user.name}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={user.email || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={user.phone || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            readOnly
          />
        </div>
      </div>
    </div>
  </div>
);

// Application Card
interface ApplicationCardProps {
  application: Booking;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h4 className="font-bold text-gray-900">{application.listingTitle}</h4>
        <p className="text-sm text-gray-500 mt-1">{application.listingLocation}</p>
      </div>
      <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
        Pending
      </span>
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        Applied on {new Date(application.created_at || '').toLocaleDateString()}
      </span>
    </div>
  </div>
);

// Lease Card
interface LeaseCardProps {
  lease: Booking;
}

const LeaseCard: React.FC<LeaseCardProps> = ({ lease }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h4 className="font-bold text-gray-900">{lease.listingTitle}</h4>
        <p className="text-sm text-gray-500 mt-1">{lease.listingLocation}</p>
      </div>
      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
        Active
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Start Date</p>
        <p className="font-semibold text-gray-900">{new Date(lease.start_date).toLocaleDateString()}</p>
      </div>
      <div>
        <p className="text-gray-500">End Date</p>
        <p className="font-semibold text-gray-900">{new Date(lease.end_date).toLocaleDateString()}</p>
      </div>
      <div>
        <p className="text-gray-500">Monthly Rent</p>
        <p className="font-semibold text-gray-900">${(lease.totalPrice || 0) / (lease.nights || 1)}/month</p>
      </div>
      <div>
        <p className="text-gray-500">Payment Status</p>
        <p className="font-semibold text-emerald-600">{lease.payment_status}</p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
      <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
        <Eye className="h-4 w-4" />
        View Lease
      </button>
      <button className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
  </div>
);

// Payment History Item
interface PaymentHistoryItemProps {
  booking: Booking;
}

const PaymentHistoryItem: React.FC<PaymentHistoryItemProps> = ({ booking }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <div className="bg-emerald-100 p-2 rounded-lg">
        <CreditCard className="h-5 w-5 text-emerald-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{booking.listingTitle}</p>
        <p className="text-xs text-gray-500">{new Date(booking.created_at || '').toLocaleDateString()}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-gray-900">${booking.totalPrice}</p>
      <span className="text-xs text-emerald-600 font-medium">{booking.payment_status}</span>
    </div>
  </div>
);

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
    <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);
