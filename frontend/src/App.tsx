import { useState, useEffect } from 'react';
import type { PropertyListing, Booking, AppUser } from './types';
import { Navbar } from './components/Navbar';
import { ListingExplorer } from './components/ListingExplorer';
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
  updateBookingStatus
} from './lib/api';
import { ShieldCheck, Heart } from 'lucide-react';

type AppTab = 'explore' | 'renter-dashboard' | 'auth' | 'super-admin' | 'owner-dashboard' | 'role-selection' | 'pricing' | 'how-it-works' | 'reviews';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    const savedTab = localStorage.getItem('currentTab');
    return savedTab ? (savedTab as AppTab) : 'explore';
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [selectedRole, setSelectedRole] = useState<'renter' | 'owner' | 'super-admin' | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('currentTab', currentTab);
      // Only force tab change if the current tab is not a dashboard tab
      if (currentTab === 'explore' || currentTab === 'auth' || currentTab === 'role-selection') {
        if (currentUser.role === 'owner') {
          setCurrentTab('owner-dashboard');
        } else if (currentUser.role === 'super-admin') {
          setCurrentTab('super-admin');
        } else {
          setCurrentTab('renter-dashboard');
        }
      }
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentTab');
    }
  }, [currentUser]);

  // Update currentTab in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('currentTab', currentTab);
  }, [currentTab]);

  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [checkoutDetails, setCheckoutDetails] = useState<{
    property: PropertyListing;
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
  } | null>(null);

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const data = await getAllListings();
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch property listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchBookings = async () => {
    if (!currentUser) return;
    setLoadingBookings(true);
    try {
      const data = await getBookingsByRenter(currentUser.email);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchBookings();
  }, [currentUser, currentTab]);

  const handleAuthSuccess = (user: AppUser) => {
    console.log('Auth success, user:', user);
    setCurrentUser(user);
    console.log('Setting current tab based on role:', user.role);
    if (user.role === 'owner') {
      setCurrentTab('owner-dashboard');
    } else if (user.role === 'super-admin') {
      setCurrentTab('super-admin');
    } else {
      setCurrentTab('renter-dashboard');
    }
  };

  const handleTabChange = (nextTab: AppTab) => {
    setCurrentTab(nextTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('explore');
  };

  const handleInitiateBooking = (bookingSchedule: {
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
  }) => {
    let activeUser = currentUser;
    if (!activeUser) {
      const demoUser: AppUser = { name: 'Demo Tenant', email: 'demo.tenant@portal.com', role: 'renter' };
      setCurrentUser(demoUser);
      activeUser = demoUser;
    }
    
    if (!selectedProperty) return;

    const propertyToBook = selectedProperty;
    setSelectedProperty(null);

    setCheckoutDetails({
      property: propertyToBook,
      ...bookingSchedule,
    });
  };

  const handlePaymentSuccess = async (paymentDetails: {
    cardholderName: string;
    cardNumberMasked: string;
  }) => {
    if (!checkoutDetails || !currentUser) return;

    try {
      const createdBooking = await createBooking({
        listingId: checkoutDetails.property.id,
        listingTitle: checkoutDetails.property.title,
        listingImage: checkoutDetails.property.image,
        listingLocation: checkoutDetails.property.location,
        renterId: currentUser.email,
        renterName: currentUser.name,
        startDate: checkoutDetails.startDate,
        endDate: checkoutDetails.endDate,
        totalPrice: checkoutDetails.totalPrice,
        nights: checkoutDetails.nights,
      });

      await createPaymentRecord({
        bookingId: createdBooking.id,
        renterId: currentUser.email,
        amount: checkoutDetails.totalPrice,
        cardholderName: paymentDetails.cardholderName,
        cardNumberMasked: paymentDetails.cardNumberMasked,
      });

      setCheckoutDetails(null);
      await fetchBookings();
      setCurrentTab('renter-dashboard');
    } catch (err) {
      console.error('Checkout transaction transaction failed:', err);
      alert('Transaction processing error. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      await fetchBookings();
    } catch (err) {
      console.error('Failed to cancel stay booking:', err);
    }
  };
  
  if (!currentUser) {
    if (currentTab === 'role-selection') {
      return (
        <RoleSelectionPage
          onSelectRole={(role) => {
            setSelectedRole(role);
            handleTabChange('auth');
          }}
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
        onLoginClick={() => {
          setAuthMode('login');
          handleTabChange('role-selection');
        }}
        onGetStartedClick={() => {
          setAuthMode('signup');
          handleTabChange('role-selection');
        }}
        onAdminLoginClick={() => {
          setAuthMode('login');
          setSelectedRole('super-admin');
          handleTabChange('auth');
        }}
        onPricingClick={() => handleTabChange('pricing')}
        onHowItWorksClick={() => handleTabChange('how-it-works')}
        onReviewsClick={() => handleTabChange('reviews')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="app-root-layout">
      <div>
        {currentTab !== 'owner-dashboard' && (
          <Navbar
            currentTab={currentTab === 'auth' || currentTab === 'role-selection' || currentTab === 'pricing' || currentTab === 'how-it-works' || currentTab === 'reviews' ? 'explore' : currentTab}
            setCurrentTab={handleTabChange}
            currentUser={currentUser}
            globalSearchTerm={globalSearchTerm}
            setGlobalSearchTerm={setGlobalSearchTerm}
            onLoginClick={() => handleTabChange('auth')}
            onLogout={handleLogout}
          />
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentTab === 'explore' && (
            <div className="animate-fadeIn">
              {loadingListings ? (
                <div className="py-20 text-center" id="listings-loading">
                  <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 font-sans text-sm font-semibold">Loading luxury spaces...</p>
                </div>
              ) : (
                <ListingExplorer
                  listings={listings}
                  searchTerm={globalSearchTerm}
                  onSearchTermChange={setGlobalSearchTerm}
                  onSelectProperty={(property) => setSelectedProperty(property)}
                />
              )}
            </div>
          )}
          {currentTab === 'pricing' && (
            <div className="animate-fadeIn">
              <PricingPage />
            </div>
          )}
          {currentTab === 'how-it-works' && (
            <div className="animate-fadeIn">
              <HowItWorksPage />
            </div>
          )}
          {currentTab === 'reviews' && (
            <div className="animate-fadeIn">
              <ReviewsPage />
            </div>
          )}

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
          {currentTab === 'super-admin' && (
            <div className="animate-fadeIn">
              <SuperAdminDashboardPage
                userName={currentUser?.name ?? 'Admin'}
                onLogout={handleLogout}
              />
            </div>
          )}
          {currentTab === 'owner-dashboard' && currentUser && (
            <div className="animate-fadeIn">
              <OwnerDashboardPage
                user={currentUser}
                onLogout={handleLogout}
                onUpdateUser={setCurrentUser}
              />
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-gray-100 py-6 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-sans font-extrabold text-gray-900">RentHub</span>
            <span className="text-xs text-gray-400 font-sans">&bull; Cloud Managed Rental Suite</span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-sans text-gray-500">
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" /> PCI-DSS Compliant</span>
            <span className="flex items-center gap-1">Made with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for real estate</span>
          </div>
        </div>
      </footer>

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
            startDate: checkoutDetails.startDate,
            endDate: checkoutDetails.endDate,
            nights: checkoutDetails.nights,
            totalPrice: checkoutDetails.totalPrice,
          }}
          onClose={() => setCheckoutDetails(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
