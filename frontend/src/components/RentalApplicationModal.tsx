import React, { useState } from 'react';
import {
  X, User, Mail, Phone, Briefcase, Home, FileText,
  AlertCircle, CheckCircle2, Send, Loader2, DollarSign,
  Calendar, Users, Shield,
} from 'lucide-react';
import type { PropertyListing } from '../types';

interface RentalApplicationModalProps {
  property: PropertyListing;
  onClose: () => void;
  onSubmitSuccess: () => void;
  userEmail: string;
  userName: string;
}

export const RentalApplicationModal: React.FC<RentalApplicationModalProps> = ({
  property,
  onClose,
  onSubmitSuccess,
  userEmail,
  userName,
}) => {
  const [formData, setFormData] = useState({
    fullName: userName || '',
    email: userEmail || '',
    phone: '',
    occupation: '',
    employer: '',
    monthlyIncome: '',
    numberOfOccupants: '1',
    moveInDate: '',
    previousAddress: '',
    reasonForMoving: '',
    hasPets: 'no',
    petDetails: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
    if (!formData.monthlyIncome.trim()) newErrors.monthlyIncome = 'Monthly income is required';
    if (!formData.moveInDate) newErrors.moveInDate = 'Desired move-in date is required';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Get auth token
      const raw = localStorage.getItem('currentUser');
      if (!raw) {
        setSubmitError('You must be logged in to apply');
        setSubmitting(false);
        return;
      }

      const user = JSON.parse(raw);
      const token = user.token;

      if (!token) {
        setSubmitError('Authentication token missing. Please login again.');
        setSubmitting(false);
        return;
      }

      // Submit application to backend
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          propertyLocation: property.location,
          monthlyRent: property.price,
          ownerId: property.ownerId,
          applicantData: formData,
          applicantEmail: userEmail,
          applicantName: userName,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      // Success!
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      console.error('Application submission error:', err);
      setSubmitError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Rental Application
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              Applying for: <span className="font-semibold">{property.title}</span>
            </p>
            <p className="text-emerald-200 text-xs mt-0.5 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${property.price.toLocaleString()}/month
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {submitError && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-4 rounded-xl">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Personal Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.fullName ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-xs text-rose-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.email ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.phone ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="+251912345678"
                />
                {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Desired Move-In Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleChange('moveInDate', e.target.value)}
                  min={getTomorrowDate()}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.moveInDate ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                />
                {errors.moveInDate && <p className="text-xs text-rose-600 mt-1">{errors.moveInDate}</p>}
              </div>
            </div>
          </section>

          {/* Employment & Income */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              Employment & Income
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Occupation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.occupation ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="Software Engineer"
                />
                {errors.occupation && <p className="text-xs text-rose-600 mt-1">{errors.occupation}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Employer / Company
                </label>
                <input
                  type="text"
                  value={formData.employer}
                  onChange={(e) => handleChange('employer', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Monthly Income (USD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.monthlyIncome ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="5000"
                />
                {errors.monthlyIncome && <p className="text-xs text-rose-600 mt-1">{errors.monthlyIncome}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Number of Occupants
                </label>
                <select
                  value={formData.numberOfOccupants}
                  onChange={(e) => handleChange('numberOfOccupants', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Rental History */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Home className="h-5 w-5 text-emerald-600" />
              Rental History
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Previous Address
                </label>
                <input
                  type="text"
                  value={formData.previousAddress}
                  onChange={(e) => handleChange('previousAddress', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="123 Main St, City, Country"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Reason for Moving
                </label>
                <textarea
                  value={formData.reasonForMoving}
                  onChange={(e) => handleChange('reasonForMoving', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
                  placeholder="Job relocation, seeking larger space, etc."
                />
              </div>
            </div>
          </section>

          {/* Pets & Emergency Contact */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Do you have pets?
                </label>
                <select
                  value={formData.hasPets}
                  onChange={(e) => handleChange('hasPets', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {formData.hasPets === 'yes' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Pet Details
                  </label>
                  <input
                    type="text"
                    value={formData.petDetails}
                    onChange={(e) => handleChange('petDetails', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="Type, breed, size"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Emergency Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.emergencyContactName ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="Jane Doe"
                />
                {errors.emergencyContactName && <p className="text-xs text-rose-600 mt-1">{errors.emergencyContactName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Emergency Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                    errors.emergencyContactPhone ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
                  } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10`}
                  placeholder="+251912345678"
                />
                {errors.emergencyContactPhone && <p className="text-xs text-rose-600 mt-1">{errors.emergencyContactPhone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleChange('additionalNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </section>

        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-xl">
            <Shield className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Your information is secure and will only be shared with the property owner.</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
