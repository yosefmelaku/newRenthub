import { useState, useEffect } from 'react';
import type { PropertyListing, Booking, AppUser } from './types';
import { Navbar } from './components/Navbar';
import { BrowseRentalsPage } from './components/BrowseRentalsPage';
import { PropertyDetailsModal } from './components/PropertyDetailsModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { DashboardPage as RenterDashboardPage } from './pages/tenant/DashboardPage';
import { LoginPage } from './pages/login/LoginPage';
import { RoleSelectionPage } from './pages/login/RoleSelectionPage';
import { DashboardPage as OwnerDashboardPage } from './pages/owner/DashboardPage';
import { DashboardPage as SuperAdminDashboardPage } from './pages/superadmin/DashboardPage';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { ReviewsPage } from './components/ReviewsPage';
import {
  getAllListings,
  getBookingsByRenter,
  createBooking,
  createPaymentRecord,
  updateBookingStatus,
} from './lib/api';
import { ShieldCheck, Heart } from 'lucide-react';

type AppTab =
  | 'explore'
  | 'renter-dashboard'
  | 'auth'
  | 'super-admin'
  | 'owner-dashboard'
  | 'role-selection'
  | 'pricing'
  | 'how-it-works'
  | 'reviews';

export default function App() {
  // ── Persisted tab ────────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem('currentTab');
    return saved ? (saved as AppTab) : 'explore';
  });

  // ── Persisted user ───────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode,     setAuthMode]     = useState<'login' | 'signup'>('signup');
  const [selectedRole, setSelectedRole] = useState<'renter' | 'owner' | 'super-admin' | null>(null);

  // ── Persist user to localStorage whenever it changes ────────────────────
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentTab');
    }
  }, [currentUser]);

  // ── Persist tab ──────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('currentTab', currentTab);
  }, [currentTab]);

  // ── On first login only: redirect to the right default home ─────────────
  // We track whether this is the first login using a flag so that
  // returning from explore/browse doesn't keep bouncing you back.
  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === 'owner')       setCurrentTab('owner-dashboard');
    else if (user.role === 'super-admin') setCurrentTab('super-admin');
    else                             setCurrentTab('renter-dashboard');
  };

  const handleTabChange = (next: AppTab) => setCurrentTab(next);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentTab');
    setCurrentUser(null);
    setCurrentTab('explore');
  };

  // ── Data ─────────────────────────────────────────────────────────────────
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [listings,         setListings]         = useState<PropertyListing[]>([]);
  const [bookings,         setBookings]          = useState<Booking[]>([]);
  const [loadingListings,  setLoadingListings]   = useState(true);
  const [loadingBookings,  setLoadingBookings]   = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [checkoutDetails,  setCheckoutDetails]  = useState<{
    property: PropertyListing;
    startDate: string; endDate: string; nights: number; totalPrice: number;
  } | null>(null);

  const fetchListings = async () => {
    setLoadingListings(true);
    try { setListings(await getAllListings()); }
    catch (e) { console.error('Failed to fetch listings', e); }
    finally   { setLoadingListings(false); }
  };

  const fetchBookings = async () => {
    if (!currentUser) return;
    setLoadingBookings(true);
    try { setBookings(await getBookingsByRenter(currentUser.email!)); }
    catch (e) { console.error('Failed to fetch bookings', e); }
    finally   { setLoadingBookings(false); }
  };

  useEffect(() => { fetchListings(); }, []);
  useEffect(() => { if (currentUser) fetchBookings(); }, [currentUser, currentTab]);

  // ── Booking flow ─────────────────────────────────────────────────────────
  const handleInitiateBooking = (schedule: {
    startDate: string; endDate: string; nights: number; totalPrice: number;
  }) => {
    if (!selectedProperty) return;
    // If somehow not logged in, create a demo session so the checkout works
    if (!currentUser) {
      setCurrentUser({ name: 'Demo Tenant', email: 'demo@phone.user', role: 'renter' });
    }
    const prop = selectedProperty;
    setSelectedProperty(null);
    setCheckoutDetails({ property: prop, ...schedule });
  };

  const handlePaymentSuccess = async (details: {
    cardholderName: string; cardNumberMasked: string;
  }) => {
    if (!checkoutDetails || !currentUser) return;
    try {
      const booking = await createBooking({
        listingId:       checkoutDetails.property.id,
        listingTitle:    checkoutDetails.property.title,
        listingImage:    checkoutDetails.property.image,
        listingLocation: checkoutDetails.property.location,
        renterId:        currentUser.email!,
        renterName:      currentUser.name,
        startDate:       checkoutDetails.startDate,
        endDate:         checkoutDetails.endDate,
        totalPrice:      checkoutDetails.totalPrice,
        nights:          checkoutDetails.nights,
      });
      await createPaymentRecord({
        bookingId:        booking.id,
        renterId:         currentUser.email!,
        amount:           checkoutDetails.totalPrice,
        cardholderName:   details.cardholderName,
        cardNumberMasked: details.cardNumberMasked,
      });
      setCheckoutDetails(null);
      await fetchBookings();
      setCurrentTab('renter-dashboard');
    } catch (e) {
      console.error('Checkout failed', e);
      alert('Payment error — please try again.');
    }
  };

  const handleCancelBooking = async (id: string) => {
    try { await updateBookingStatus(id, 'cancelled'); await fetchBookings(); }
    catch (e) { console.error('Cancel failed', e); }
  };

  // ── Unauthenticated routes ───────────────────────────────────────────────
  if (!currentUser) {
    if (currentTab === 'role-selection') {
      return (
        <RoleSelectionPage
          onSelectRole={(role) => { setSelectedRole(role); handleTabChange('auth'); }}
          onBack={() => handleTabChange('explore')}
        />
      );
    }
    if (currentTab === 'auth' && selectedRole) {
      return (
        <LoginPage
          initialMode={authMode}
          onLogin={handleAuthSuccess}
          onCancel={() => handleTabChange('explore')}
          role={selectedRole}
        />
      );
    }
    return (
      <LandingPage
        onAuthSuccess={handleAuthSuccess}
        onLoginClick={() => { setAuthMode('login'); handleTabChange('role-selection'); }}
        onGetStartedClick={() => { setAuthMode('signup'); handleTabChange('role-selection'); }}
        onAdminLoginClick={() => { setAuthMode('login'); setSelectedRole('super-admin'); handleTabChange('auth'); }}
        onPricingClick={() => handleTabChange('pricing')}
        onHowItWorksClick={() => handleTabChange('how-it-works')}
        onReviewsClick={() => handleTabChange('reviews')}
      />
    );
  }

  // ── Authenticated shell ──────────────────────────────────────────────────
  // Owner & super-admin dashboards are fully self-contained (own sidebar +
  // header). They are rendered without the global Navbar to avoid doubling up.
  // Renter dashboard now renders INSIDE the global shell so the Navbar is
  // always visible — this is what lets a renter freely browse properties,
  // then click "My Dashboard" to come back.
  const hideNavbar = currentTab === 'owner-dashboard' || currentTab === 'super-admin';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col" id="app-root-layout">

      {/* ── Global Navbar — visible for all renter pages ── */}
      {!hideNavbar && (
        <Navbar
          currentTab={
            ['auth', 'role-selection', 'pricing', 'how-it-works', 'reviews'].includes(currentTab)
              ? 'explore'
              : (currentTab as 'explore' | 'renter-dashboard' | 'super-admin' | 'owner-dashboard')
          }
          setCurrentTab={handleTabChange}
          currentUser={currentUser}
          globalSearchTerm={globalSearchTerm}
          setGlobalSearchTerm={setGlobalSearchTerm}
          onLoginClick={() => handleTabChange('auth')}
          onLogout={handleLogout}
        />
      )}

      {/* ── Owner dashboard — fully self-contained, full viewport ── */}
      {currentTab === 'owner-dashboard' && (
        <div className="flex-1 animate-fadeIn">
          <OwnerDashboardPage
            user={currentUser}
            onLogout={handleLogout}
            onUpdateUser={setCurrentUser}
          />
        </div>
      )}

      {/* ── Super admin — fully self-contained ── */}
      {currentTab === 'super-admin' && (
        <div className="flex-1 animate-fadeIn">
          <SuperAdminDashboardPage
            userName={currentUser?.name ?? 'Admin'}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* ── All renter + public pages — rendered under the shared Navbar ── */}
      {!hideNavbar && (
        <main className="flex-1">

          {/* Browse / Explore — accessible to logged-in renters too */}
          {currentTab === 'explore' && (
            <div className="animate-fadeIn">
              {loadingListings ? (
                <div className="py-24 text-center">
                  <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-semibold">Loading available properties…</p>
                </div>
              ) : (
                <BrowseRentalsPage
                  listings={listings}
                  searchTerm={globalSearchTerm}
                  onSearchTermChange={setGlobalSearchTerm}
                  onSelectProperty={(p) => setSelectedProperty(p)}
                />
              )}
            </div>
          )}

          {/* Renter dashboard — lives inside the shared Navbar shell */}
          {currentTab === 'renter-dashboard' && (
            <div className="animate-fadeIn">
              <RenterDashboardPage
                user={currentUser}
                bookings={bookings}
                listings={listings}
                onCancelBooking={handleCancelBooking}
                loading={loadingBookings}
                onRefresh={fetchBookings}
                onBrowseMore={() => setCurrentTab('explore')}
                onLogout={handleLogout}
                onUpdateUser={setCurrentUser}
              />
            </div>
          )}

          {currentTab === 'pricing'      && <div className="animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><PricingPage /></div>}
          {currentTab === 'how-it-works' && <div className="animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><HowItWorksPage /></div>}
          {currentTab === 'reviews'      && <div className="animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><ReviewsPage /></div>}
        </main>
      )}

      {/* ── Footer — only on non-dashboard pages ── */}
      {!hideNavbar && currentTab !== 'renter-dashboard' && (
        <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-gray-900">RentHub</span>
              <span className="text-xs text-gray-400">&bull; Cloud Managed Rental Suite</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> PCI-DSS Compliant
              </span>
              <span className="flex items-center gap-1">
                Made with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 mx-0.5" /> for real estate
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* ── Modals ── */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onInitiateBooking={handleInitiateBooking}
        />
      )}
      {checkoutDetails && (
        <CheckoutPaymentModal
          property={checkoutDetails.property}
          bookingDetails={{
            startDate:  checkoutDetails.startDate,
            endDate:    checkoutDetails.endDate,
            nights:     checkoutDetails.nights,
            totalPrice: checkoutDetails.totalPrice,
          }}
          onClose={() => setCheckoutDetails(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
