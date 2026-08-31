/**
 * LeaseContractPage.tsx - Rental Lease Contract View
 * 
 * Clear lease contract displaying:
 * - Property Details
 * - Lease Term (Start/End dates)
 * - Rent Amount & Payment Terms
 * - Security Deposit
 * - Tenant & Landlord Information
 * - Terms & Conditions
 * - Signature Section
 */

import React, { useState } from 'react';
import {
  ArrowLeft, Download, FileText, Calendar, DollarSign,
  User, Building, MapPin, CheckCircle, Printer, Share2,
  AlertCircle
} from 'lucide-react';

interface LeaseContract {
  id: string;
  leaseNumber: string;
  status: 'draft' | 'active' | 'pending_signature' | 'expired';
  property: {
    title: string;
    address: string;
    city: string;
    type: string;
    image: string;
  };
  tenant: {
    name: string;
    email: string;
    phone: string;
  };
  landlord: {
    name: string;
    email: string;
    phone: string;
  };
  term: {
    startDate: string;
    endDate: string;
    duration: number; // months
  };
  financial: {
    monthlyRent: number;
    securityDeposit: number;
    firstMonthRent: number;
    totalUpfront: number;
    paymentDueDay: number;
  };
  terms: string[];
  signatures: {
    tenant: {
      signed: boolean;
      date?: string;
    };
    landlord: {
      signed: boolean;
      date?: string;
    };
  };
  createdAt: string;
  lastUpdated: string;
}

interface LeaseContractPageProps {
  lease: LeaseContract;
  onBack: () => void;
  onSign?: () => void;
  onDownload?: () => void;
}

export const LeaseContractPage: React.FC<LeaseContractPageProps> = ({
  lease,
  onBack,
  onSign,
  onDownload,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    pending_signature: { label: 'Pending Signature', color: 'bg-amber-100 text-amber-700' },
    active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
    expired: { label: 'Expired', color: 'bg-rose-100 text-rose-700' },
  };

  const needsSignature = lease.status === 'pending_signature' && !lease.signatures.tenant.signed;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Leases</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Download PDF</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Printer className="h-4 w-4" />
                <span className="font-medium">Print</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Share</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Residential Lease Agreement</h1>
              <p className="text-sm text-gray-500 mt-1">Lease #{lease.leaseNumber}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig[lease.status].color}`}>
              {statusConfig[lease.status].label}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Warning for Unsigned Lease */}
        {needsSignature && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Action Required</p>
              <p className="text-sm text-amber-700 mt-1">
                Please review the lease agreement and sign at the bottom of this page to activate your lease.
              </p>
            </div>
          </div>
        )}

        {/* Lease Document */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
          {/* Document Header */}
          <div className="border-b-2 border-gray-200 p-8 text-center">
            <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Residential Lease Agreement</h2>
            <p className="text-gray-600">This agreement is made and entered into on {new Date(lease.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Parties Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Parties to Agreement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Landlord */}
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Landlord (Owner)</p>
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">{lease.landlord.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lease.landlord.email}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lease.landlord.phone}
                  </p>
                </div>
              </div>

              {/* Tenant */}
              <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">Tenant (You)</p>
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">{lease.tenant.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lease.tenant.email}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lease.tenant.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-600" />
              Leased Property
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 flex gap-4">
              <img
                src={lease.property.image}
                alt={lease.property.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-2">{lease.property.title}</h4>
                <p className="text-gray-600 flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  {lease.property.address}, {lease.property.city}
                </p>
                <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {lease.property.type}
                </span>
              </div>
            </div>
          </div>

          {/* Lease Term Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Lease Term
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Start Date</p>
                <p className="text-xl font-bold text-gray-900">{new Date(lease.term.startDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">End Date</p>
                <p className="text-xl font-bold text-gray-900">{new Date(lease.term.endDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                <p className="text-sm text-emerald-700 mb-2">Duration</p>
                <p className="text-xl font-bold text-emerald-900">{lease.term.duration} Months</p>
              </div>
            </div>
          </div>

          {/* Financial Terms Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Financial Terms
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Monthly Rent</span>
                <span className="text-2xl font-bold text-gray-900">${lease.financial.monthlyRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Security Deposit</span>
                <span className="text-xl font-bold text-gray-900">${lease.financial.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">First Month's Rent</span>
                <span className="text-xl font-bold text-gray-900">${lease.financial.firstMonthRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                <span className="text-emerald-700 font-bold">Total Due at Move-in</span>
                <span className="text-3xl font-bold text-emerald-900">${lease.financial.totalUpfront.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>Payment Schedule:</strong> Rent is due on the <strong>{lease.financial.paymentDueDay}{lease.financial.paymentDueDay === 1 ? 'st' : lease.financial.paymentDueDay === 2 ? 'nd' : lease.financial.paymentDueDay === 3 ? 'rd' : 'th'} day</strong> of each month. Late payments after the 5th will incur a $50 late fee.
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Terms & Conditions</h3>
            <div className="space-y-3">
              {lease.terms.map((term, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-gray-700 leading-relaxed">{term}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures Section */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenant Signature */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tenant Signature</p>
                {lease.signatures.tenant.signed ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Signed</span>
                    </div>
                    <p className="text-sm text-gray-600">By: {lease.tenant.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {lease.signatures.tenant.date}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400">
                    Awaiting Signature
                  </div>
                )}
              </div>

              {/* Landlord Signature */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Landlord Signature</p>
                {lease.signatures.landlord.signed ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Signed</span>
                    </div>
                    <p className="text-sm text-gray-600">By: {lease.landlord.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {lease.signatures.landlord.date}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400">
                    Awaiting Signature
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sign Action (if needed) */}
        {needsSignature && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-5 w-5 text-emerald-600 rounded"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-700 cursor-pointer">
                I have read and agree to all terms and conditions outlined in this lease agreement. I understand that this is a legally binding contract.
              </label>
            </div>
            <button
              onClick={onSign}
              disabled={!agreedToTerms}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Sign Lease Agreement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock Lease Data for Testing
export const mockLease: LeaseContract = {
  id: '1',
  leaseNumber: 'LSE-2027-00124',
  status: 'pending_signature',
  property: {
    title: 'Modern Downtown Apartment',
    address: '123 Main Street, Apt 4B',
    city: 'New York, NY 10001',
    type: 'apartment',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  },
  tenant: {
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '+1 (555) 987-6543',
  },
  landlord: {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
  },
  term: {
    startDate: '2027-02-01',
    endDate: '2028-01-31',
    duration: 12,
  },
  financial: {
    monthlyRent: 2500,
    securityDeposit: 2500,
    firstMonthRent: 2500,
    totalUpfront: 5000,
    paymentDueDay: 1,
  },
  terms: [
    'Tenant agrees to pay rent on or before the 1st day of each month.',
    'Security deposit will be refunded within 30 days of lease termination, minus any deductions for damages.',
    'Tenant is responsible for utilities including electricity, gas, and internet.',
    'No pets allowed without written permission from landlord.',
    'Tenant must provide 60 days notice before terminating lease.',
    'Property must be maintained in good condition. Normal wear and tear is expected.',
    'Landlord will provide 24-hour notice before entering the property except in emergencies.',
    'Tenant may not sublet the property without written permission.',
  ],
  signatures: {
    tenant: {
      signed: false,
    },
    landlord: {
      signed: true,
      date: '2027-01-15',
    },
  },
  createdAt: '2027-01-15',
  lastUpdated: '2027-01-15',
};
