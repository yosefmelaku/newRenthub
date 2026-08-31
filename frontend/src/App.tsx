import { useState, useEffect } from 'react';
import type { PropertyListing, Booking, AppUser } from './types';
import { Navbar }                from './components/Navbar';
import { BrowseRentalsPage }    from './components/BrowseRentalsPage';
import { PropertyDetailsModal } from './components/PropertyDetailsModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { PaymentRedirectPage }  from './pages/tenant/PaymentRedirectPage';
import { PaymentMethodsPage }  from './pages/tenant/PaymentMethodsPage';
import { PaymentConfirmationPage } from './pages/tenant/PaymentConfirmationPage';
import { PaymentSuccessPage } from './pages/tenant/PaymentSuccessPage';
import { DashboardPage as RenterDashboardPage }     from './pages/tenant/DashboardPage';
import { LoginPage }            from './pages/login/LoginPage';
import { AdminLoginPage }       from './pages/login/AdminLoginPage';
import { RoleSelectionPage }    from './pages/login/RoleSelectionPage';
import { DashboardPage as OwnerDashboardPage }      from './pages/owner/DashboardPage';
import { DashboardPage as SuperAdminDashboardPage } from './pages/superadmin/DashboardPage';
import { LandingPage }          from './components/LandingPage';
import { PricingPage }          from './components/PricingPage';
import { HowItWorksPage }       from './components/HowItWorksPage';
import { ReviewsPage }          from './components/ReviewsPage';
import { ShieldCheck, Heart, Lock } from 'lucide-react';
import {
  getAllListings, getBookingsByRenter,
  createBooking, createPaymentRecord, updateBookingStatus,
  logoutUser,
} from './lib/api';
import { recordRental, releaseRental } from './lib/ownerProperties';

// All valid public paths — anything NOT in this list shows 404
const VALID_PATHS = new Set([
  '/', '/admin', '/superadmin', '/owner', '/tenant',
  '/dashboard', '/pricing', '/how-it-works', '/reviews',
  '/payment-redirect', '/payment-methods', '/payment-confirmation', '/payment-success',
]);

// ─── Route map ────────────────────────────────────────────────────────────────
const PATH_MAP: Record<string, AppTab> = {
  '/admin':                '/admin',
  '/superadmin':           'super-admin',
  '/owner':                'owner-dashboard',
  '/tenant':               'renter-dashboard',
  '/dashboard':            'renter-dashboard',
  '/pricing':              'pricing',
  '/how-it-works':         'how-it-works',
  '/reviews':              'reviews',
  '/payment-redirect':     'payment-redirect',
  '/payment-methods':      'payment-methods',
  '/payment-confirmation': 'payment-confirmation',
  '/payment-success':      'payment-success',
};

// Which roles may access which tabs
const TAB_ROLES: Partial<Record<AppTab, string[]>> = {
  'super-admin':     ['superadmin', 'SUPERADMIN'],
  'owner-dashboard': ['owner',  'OWNER'],
  'renter-dashboard':['renter', 'tenant', 'TENANT'],
};

type AppTab =
  | 'explore' | 'renter-dashboard' | 'auth' | 'super-admin'
  | 'owner-dashboard' | 'role-selection' | 'pricing' | 'how-it-works' | 'reviews'
  | 'payment-redirect' | 'payment-methods' | 'payment-confirmation' | 'payment-success'
  | '404';

function resolveStartTab(user: AppUser | null): AppTab {
  const path = window.location.pathname.toLowerCase();

  // Unknown path → 404 (not a fallback to home)
  if (!VALID_PATHS.has(path)) return '404';

  // Root → restore saved tab or go to explore
  if (path === '/') {
    const saved = localStorage.getItem('currentTab') as AppTab | null;
    return saved ?? 'explore';
  }

  return PATH_MAP[path] ?? 'explore';
}

// ── 404 page ──────────────────────────────────────────────────────────────────
function NotFoundPage({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-6 p-8 text-center">
      <p className="text-8xl font-black text-slate-700">404</p>
      <h1 className="text-3xl font-extrabold text-white">Page Not Found</h1>
      <p className="text-slate-400 max-w-sm">
        The page you're looking for doesn't exist. Check the URL or go back to the home page.
      </p>
      <button
        onClick={onGoHome}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition cursor-pointer"
      >
        Back to Home
      </button>
    </div>
  );
}

// ── 403 screen shown when a user navigates to a tab they don't have access to
function AccessDenied({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-6 p-8">
      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-full">
        <Lock className="h-12 w-12 text-rose-400" />
      </div>
      <h1 className="text-3xl font-extrabold">Access Denied</h1>
      <p className="text-slate-400 text-center max-w-sm">
        You don't have permission to view this page.
        Please log in with an account that has the required role.
      </p>
      <button
        onClick={onGoHome}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition"
      >
        Back to Home
      </button>
    </div>
  );
}

export default function App() {
  // Persisted user — read first so resolveStartTab can use it
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
    catch { return null; }
  });

  const [currentTab,   setCurrentTab]   = useState<AppTab>(() => resolveStartTab(currentUser));
  const [authMode,     setAuthMode]     = useState<'login' | 'signup'>('signup');
  const [selectedRole, setSelectedRole] = useState<'renter' | 'owner' | 'super-admin' | null>(null);

  // Show 404 immediately — no further logic needed
  if (currentTab === '404') {
    return (
      <NotFoundPage
        onGoHome={() => {
          window.history.replaceState({}, '', '/');
          setCurrentTab('explore');
        }}
      />
    );
  }

  // Sync URL bar ↔ tab
  useEffect(() => {
    const map: Partial<Record<AppTab, string>> = {
      'super-admin':      '/admin',
      'owner-dashboard':  '/owner',
      'renter-dashboard': '/tenant',
      'pricing':          '/pricing',
      'how-it-works':     '/how-it-works',
      'reviews':          '/reviews',
      'explore':          '/',
    };
    const p = map[currentTab];
    if (p && window.location.pathname !== p) window.history.replaceState({}, '', p);
    localStorage.setItem('currentTab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    else { localStorage.removeItem('currentUser'); localStorage.removeItem('currentTab'); }
  }, [currentUser]);

  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    const role = String(user.role).toLowerCase();
    if (role === 'owner')      setCurrentTab('owner-dashboard');
    else if (role === 'superadmin' || role === 'super-admin') setCurrentTab('super-admin');
    else                       setCurrentTab('renter-dashboard');
  };

  const handleTabChange = (next: AppTab) => setCurrentTab(next);

  const handleLogout = () => {
    logoutUser();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentTab');
    setCurrentUser(null);
    setCurrentTab('explore');
    window.history.replaceState({}, '', '/');
  };

  // ── Role guard ───────────────────────────────────────────────────────────
  // If a logged-in user navigates to a tab they don't have access to, show 403
  if (currentUser) {
    const allowed = TAB_ROLES[currentTab];
    if (allowed) {
      const userRole = String(currentUser.role).toLowerCase();
      if (!allowed.map(r => r.toLowerCase()).includes(userRole)) {
        return <AccessDenied onGoHome={() => { setCurrentTab('explore'); window.history.replaceState({}, '', '/'); }} />;
      }
    }
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [listings,         setListings]         = useState<PropertyListing[]>([]);
  const [bookings,         setBookings]         = useState<Booking[]>([]);
  const [loadingListings,  setLoadingListings]  = useState(true);
  const [loadingBookings,  setLoadingBookings]  = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [checkoutDetails,  setCheckoutDetails]  = useState<{
    property: PropertyListing; startDate: string; endDate: string; nights: number; totalPrice: number;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  // Rent payment context (separate from new booking flow)
  const [rentPaymentContext, setRentPaymentContext] = useState<{
    propertyTitle: string;
    propertyLocation: string;
    propertyImage: string;
    amount: number;
    dueDate: string;
  } | null>(null);

  useEffect(() => {
    setLoadingListings(true);
    getAllListings()
      .then(setListings)
      .catch(e => console.error('Failed to fetch listings', e))
      .finally(() => setLoadingListings(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setLoadingBookings(true);
    getBookingsByRenter(currentUser.email!)
      .then(setBookings)
      .catch(e => console.error('Failed to fetch bookings', e))
      .finally(() => setLoadingBookings(false));
  }, [currentUser, currentTab]);

  const fetchBookings = async () => {
    if (!currentUser) return;
    setLoadingBookings(true);
    try { setBookings(await getBookingsByRenter(currentUser.email!)); }
    catch (e) { console.error(e); }
    finally { setLoadingBookings(false); }
  };

  // ── Booking flow ─────────────────────────────────────────────────────────
  const handleInitiateBooking = (s: { startDate: string; endDate: string; nights: number; totalPrice: number }) => {
    if (!selectedProperty) return;
    if (!currentUser) setCurrentUser({ name: 'Demo Tenant', email: 'demo@phone.user', role: 'renter' });
    const prop = selectedProperty;
    setSelectedProperty(null);
    setCheckoutDetails({ property: prop, ...s });
    // Navigate to payment methods page
    setCurrentTab('payment-methods');
    window.history.replaceState({}, '', '/payment-methods');
  };

  const handleSelectPaymentMethod = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setCurrentTab('payment-confirmation');
    window.history.replaceState({}, '', '/payment-confirmation');
  };

  const handlePaymentComplete = async () => {
    setCurrentTab('payment-success');
    window.history.replaceState({}, '', '/payment-success');
    await fetchBookings();
  };

  const handleGoToDashboard = () => {
    setCheckoutDetails(null);
    setRentPaymentContext(null);
    setSelectedPaymentMethod(null);
    setCurrentTab('renter-dashboard');
    window.history.replaceState({}, '', '/tenant');
  };

  // Rent payment flow handlers
  const handlePayRent = (details: {
    propertyTitle: string;
    propertyLocation: string;
    propertyImage: string;
    amount: number;
    dueDate: string;
  }) => {
    setRentPaymentContext(details);
    setCurrentTab('payment-methods');
    window.history.replaceState({}, '', '/payment-methods');
  };

  const handleRentPaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setCurrentTab('payment-confirmation');
    window.history.replaceState({}, '', '/payment-confirmation');
  };

  const handleRentPaymentComplete = async () => {
    setCurrentTab('payment-success');
    window.history.replaceState({}, '', '/payment-success');
    setRentPaymentContext(null);
    setSelectedPaymentMethod(null);
    await fetchBookings();
  };

  const handlePaymentSuccess = async (details: { cardholderName: string; cardNumberMasked: string }) => {
    if (!checkoutDetails || !currentUser) return;
    const listing = checkoutDetails.property;
    try {
      const booking = await createBooking({
        listingId: listing.id, listingTitle: listing.title, listingImage: listing.image,
        listingLocation: listing.location, renterId: currentUser.email!,
        renterName: currentUser.name, startDate: checkoutDetails.startDate,
        endDate: checkoutDetails.endDate, totalPrice: checkoutDetails.totalPrice,
        nights: checkoutDetails.nights,
      });
      await createPaymentRecord({
        bookingId: booking.id, renterId: currentUser.email!,
        amount: checkoutDetails.totalPrice, cardholderName: details.cardholderName,
        cardNumberMasked: details.cardNumberMasked,
      });
    } catch (e) { console.error('Checkout API failed', e); }
    recordRental(listing.id, listing.totalUnits || listing.beds || 1);
    setCheckoutDetails(null);
    await fetchBookings();
    setCurrentTab('renter-dashboard');
  };

  const handlePaymentFinish = async () => {
    setCheckoutDetails(null);
    await fetchBookings();
    setCurrentTab('renter-dashboard');
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const booking = bookings.find(b => b.id === id);
      await updateBookingStatus(id, 'cancelled');
      if (booking?.listingId) releaseRental(booking.listingId);
      await fetchBookings();
    } catch (e) { console.error('Cancel failed', e); }
  };

  // ── Unauthenticated routes ────────────────────────────────────────────────
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
    // /admin → show dedicated admin login page (not access denied)
    if (currentTab === 'super-admin') {
      return (
        <AdminLoginPage onLogin={handleAuthSuccess} />
      );
    }
    // /owner or /tenant while not logged in → go to role selection
    if (currentTab === 'owner-dashboard' || currentTab === 'renter-dashboard') {
      return (
        <RoleSelectionPage
          onSelectRole={(role) => { setSelectedRole(role); handleTabChange('auth'); }}
          onBack={() => handleTabChange('explore')}
        />
      );
    }
    return (
      <LandingPage
        onAuthSuccess={handleAuthSuccess}
        onLoginClick={() => { setAuthMode('login'); handleTabChange('role-selection'); }}
        onGetStartedClick={() => { setAuthMode('signup'); handleTabChange('role-selection'); }}
        onAdminLoginClick={() => handleTabChange('super-admin')}
        onPricingClick={() => handleTabChange('pricing')}
        onHowItWorksClick={() => handleTabChange('how-it-works')}
        onReviewsClick={() => handleTabChange('reviews')}
      />
    );
  }

  // ── Authenticated shell ───────────────────────────────────────────────────
  const hideNavbar = currentTab === 'owner-dashboard' || currentTab === 'super-admin';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col" id="app-root-layout">
      {!hideNavbar && (
        <Navbar
          currentTab={(['auth','role-selection','pricing','how-it-works','reviews'].includes(currentTab) ? 'explore' : currentTab) as any}
          setCurrentTab={handleTabChange}
          currentUser={currentUser}
          globalSearchTerm={globalSearchTerm}
          setGlobalSearchTerm={setGlobalSearchTerm}
          onLoginClick={() => handleTabChange('auth')}
          onLogout={handleLogout}
        />
      )}

      {currentTab === 'owner-dashboard' && (
        <div className="flex-1 animate-fadeIn">
          <OwnerDashboardPage user={currentUser} onLogout={handleLogout} onUpdateUser={setCurrentUser} />
        </div>
      )}

      {currentTab === 'super-admin' && (
        <div className="flex-1 animate-fadeIn">
          <SuperAdminDashboardPage userName={currentUser?.name ?? 'Admin'} onLogout={handleLogout} />
        </div>
      )}

      {!hideNavbar && (
        <main className="flex-1">
          {currentTab === 'explore' && (
            <div className="animate-fadeIn">
              {loadingListings ? (
                <div className="py-24 text-center">
                  <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-semibold">Loading properties…</p>
                </div>
              ) : (
                <BrowseRentalsPage
                  listings={listings} searchTerm={globalSearchTerm}
                  onSearchTermChange={setGlobalSearchTerm}
                  onSelectProperty={(p) => setSelectedProperty(p)}
                />
              )}
            </div>
          )}
          {currentTab === 'renter-dashboard' && (
            <div className="animate-fadeIn">
              <RenterDashboardPage
                user={currentUser} bookings={bookings} listings={listings}
                onCancelBooking={handleCancelBooking} loading={loadingBookings}
                onRefresh={fetchBookings} onBrowseMore={() => setCurrentTab('explore')}
                onLogout={handleLogout} onUpdateUser={setCurrentUser}
                onPayRent={handlePayRent}
              />
            </div>
          )}
          {currentTab === 'pricing'      && <div className="animate-fadeIn max-w-7xl mx-auto px-4 py-8"><PricingPage /></div>}
          {currentTab === 'how-it-works' && <div className="animate-fadeIn max-w-7xl mx-auto px-4 py-8"><HowItWorksPage /></div>}
          {currentTab === 'reviews'      && <div className="animate-fadeIn max-w-7xl mx-auto px-4 py-8"><ReviewsPage /></div>}
          {currentTab === 'payment-redirect' && (
            <div className="animate-fadeIn">
              <PaymentRedirectPage onFinish={handlePaymentFinish} />
            </div>
          )}
          {currentTab === 'payment-methods' && (checkoutDetails || rentPaymentContext) && (
            <div className="animate-fadeIn">
              <PaymentMethodsPage
                bookingDetails={checkoutDetails ? {
                  property: {
                    id: checkoutDetails.property.id,
                    title: checkoutDetails.property.title,
                    image: checkoutDetails.property.image,
                    location: checkoutDetails.property.location,
                  },
                  startDate: checkoutDetails.startDate,
                  endDate: checkoutDetails.endDate,
                  nights: checkoutDetails.nights,
                  totalPrice: checkoutDetails.totalPrice,
                } : undefined}
                rentPaymentDetails={rentPaymentContext ? {
                  propertyTitle: rentPaymentContext.propertyTitle,
                  propertyLocation: rentPaymentContext.propertyLocation,
                  propertyImage: rentPaymentContext.propertyImage,
                  amount: rentPaymentContext.amount,
                  dueDate: rentPaymentContext.dueDate,
                } : undefined}
                onBack={() => {
                  if (rentPaymentContext) {
                    setCurrentTab('renter-dashboard');
                    window.history.replaceState({}, '', '/tenant');
                  } else {
                    setCurrentTab('explore');
                    window.history.replaceState({}, '', '/');
                  }
                }}
                onSelectMethod={rentPaymentContext ? handleRentPaymentMethodSelect : handleSelectPaymentMethod}
              />
            </div>
          )}
          {currentTab === 'payment-confirmation' && (checkoutDetails || rentPaymentContext) && selectedPaymentMethod && (
            <div className="animate-fadeIn">
              <PaymentConfirmationPage
                bookingDetails={checkoutDetails ? {
                  property: {
                    id: checkoutDetails.property.id,
                    title: checkoutDetails.property.title,
                    image: checkoutDetails.property.image,
                    location: checkoutDetails.property.location,
                  },
                  startDate: checkoutDetails.startDate,
                  endDate: checkoutDetails.endDate,
                  nights: checkoutDetails.nights,
                  totalPrice: checkoutDetails.totalPrice,
                } : undefined}
                rentPaymentDetails={rentPaymentContext ? {
                  propertyTitle: rentPaymentContext.propertyTitle,
                  propertyLocation: rentPaymentContext.propertyLocation,
                  propertyImage: rentPaymentContext.propertyImage,
                  amount: rentPaymentContext.amount,
                  dueDate: rentPaymentContext.dueDate,
                } : undefined}
                selectedPaymentMethod={selectedPaymentMethod}
                onBack={() => {
                  setCurrentTab('payment-methods');
                  window.history.replaceState({}, '', '/payment-methods');
                }}
                onPaymentComplete={rentPaymentContext ? handleRentPaymentComplete : handlePaymentComplete}
              />
            </div>
          )}
          {currentTab === 'payment-success' && (
            <div className="animate-fadeIn">
              <PaymentSuccessPage onGoToDashboard={handleGoToDashboard} />
            </div>
          )}
        </main>
      )}

      {!hideNavbar && currentTab !== 'renter-dashboard' && currentTab !== 'payment-methods' && currentTab !== 'payment-confirmation' && currentTab !== 'payment-success' && (
        <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-gray-900">RentHub</span>
              <span className="text-xs text-gray-400">• Cloud Managed Rental Suite</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" /> PCI-DSS Compliant</span>
              <span className="flex items-center gap-1">Made with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 mx-0.5" /> for real estate</span>
            </div>
          </div>
        </footer>
      )}

      {selectedProperty && (
        <PropertyDetailsModal property={selectedProperty} onClose={() => setSelectedProperty(null)} onInitiateBooking={handleInitiateBooking} />
      )}
      {checkoutDetails && (
        <CheckoutPaymentModal
          property={checkoutDetails.property}
          bookingDetails={{ startDate: checkoutDetails.startDate, endDate: checkoutDetails.endDate, nights: checkoutDetails.nights, totalPrice: checkoutDetails.totalPrice }}
          onClose={() => setCheckoutDetails(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
