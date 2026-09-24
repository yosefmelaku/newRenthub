import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, X, UploadCloud, Home, Building2, Briefcase,
  BedDouble, Tag, DollarSign, MapPin, CheckCircle2,
  ImageOff, Users, Sparkles, Pencil, Trash2, AlertTriangle,
  ArrowRight, ArrowLeft, Bath, Loader2, RefreshCw, WifiOff,
  LogOut,
} from 'lucide-react';
import type { OwnerProperty, CreatePropertyPayload, UpdatePropertyPayload } from '../../lib/api';
import {
  fetchOwnerProperties,
  createOwnerProperty,
  updateOwnerProperty,
  deleteOwnerProperty,
} from '../../lib/api';
import { CITIES, ADDIS_ABABA_SUBCITIES } from '../../lib/ownerProperties';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — read owner ID from localStorage session
// ─────────────────────────────────────────────────────────────────────────────

function getOwnerIdFromSession(): string | null {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      console.warn('⚠️ [getOwnerIdFromSession] No currentUser in localStorage');
      return null;
    }
    const user = JSON.parse(raw);
    const ownerId = user.id ?? user.email ?? null;
    
    if (!ownerId) {
      console.warn('⚠️ [getOwnerIdFromSession] User exists but no id/email:', user);
    }
    
    if (!user.token) {
      console.warn('⚠️ [getOwnerIdFromSession] User exists but no token:', user);
    }
    
    return ownerId;
  } catch (err) {
    console.error('❌ [getOwnerIdFromSession] Error:', err);
    return null;
  }
}

type PropertyType = 'house' | 'villa' | 'office' | 'studio';

// ─────────────────────────────────────────────────────────────────────────────
// Form State
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  type: PropertyType;
  city: string;
  subcity: string;
  address: string;
  monthlyRent: string;
  beds: string;
  baths: string;
  officeSqm: string;
  meetingRooms: string;
  parkingSpaces: string;
  totalUnits: string;
  imagePreview: string | null;
  imageFile: File | null;
}

const BLANK_FORM: FormState = {
  title: '', type: 'house', city: 'Addis Ababa', subcity: '', address: '',
  monthlyRent: '', beds: '2', baths: '1', officeSqm: '', meetingRooms: '1', parkingSpaces: '0',
  totalUnits: '1',
  imagePreview: null, imageFile: null,
};

function propertyToForm(p: OwnerProperty): FormState {
  return {
    title: p.title,
    type: p.type,
    city: p.city,
    subcity: p.subcity,
    address: p.address,
    monthlyRent: String(p.monthlyRent),
    beds: String(p.beds),
    baths: String(p.baths),
    officeSqm: String(p.officeSqm || ''),
    meetingRooms: String(p.meetingRooms || ''),
    parkingSpaces: String(p.parkingSpaces || ''),
    totalUnits: String(p.totalUnits || 1),
    imagePreview: p.imageUrl,
    imageFile: null,
  };
}

function validateDetails(form: FormState): string {
  if (!form.title.trim()) return 'Please enter a property title.';
  if (form.city === 'Addis Ababa' && !form.subcity) return 'Please select an Addis Ababa area.';
  if (form.city !== 'Addis Ababa' && !form.address.trim()) return 'Please enter the full address.';
  if (!form.monthlyRent) return 'Please enter the monthly rent.';
  if (form.type === 'office') {
    if (!form.officeSqm) return 'Please enter office size in sqm.';
  } else {
    if (!form.beds || !form.baths) return 'Please enter bedrooms and bathrooms.';
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI constants
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
  house:  <Home      className="h-3.5 w-3.5" />,
  villa:  <Sparkles  className="h-3.5 w-3.5" />,
  office: <Briefcase className="h-3.5 w-3.5" />,
  studio: <BedDouble className="h-3.5 w-3.5" />,
};

const TYPE_COLORS: Record<PropertyType, string> = {
  house:  'bg-blue-50   text-blue-700   border-blue-200',
  villa:  'bg-purple-50 text-purple-700 border-purple-200',
  office: 'bg-amber-50  text-amber-700  border-amber-200',
  studio: 'bg-rose-50   text-rose-700   border-rose-200',
};

// ─────────────────────────────────────────────────────────────────────────────
// Image Upload Zone
// ─────────────────────────────────────────────────────────────────────────────

interface UploadZoneProps {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  fileName?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({ preview, onFile, onClear, fileName }) => {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((file: File) => {
    if (file.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-2 right-2 bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-300 text-gray-500 hover:text-rose-600 rounded-full p-1.5 shadow transition"
          title="Remove image"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {fileName && (
          <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[180px]">
            {fileName}
          </span>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-full border border-gray-200 shadow transition"
        >
          Replace
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      onClick={() => ref.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors ${
        dragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
      }`}
    >
      <UploadCloud className={`h-8 w-8 ${dragging ? 'text-emerald-500' : 'text-gray-300'}`} />
      <p className="text-sm font-semibold text-gray-500">{dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}</p>
      <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 MB</p>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Form Fields
// ─────────────────────────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  onImageFile: (file: File) => void;
  onImageClear: () => void;
  error: string;
  showImage?: boolean;
}

const FormFields: React.FC<FormFieldsProps> = ({ form, onChange, onImageFile, onImageClear, error, showImage = true }) => {
  const isOffice = form.type === 'office';
  const isAddis = form.city === 'Addis Ababa';

  return (
  <div className="space-y-5">
    {error && (
      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-lg">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
      </div>
    )}

    {showImage && (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
          Property Image
        </label>
        <UploadZone
          preview={form.imagePreview}
          onFile={onImageFile}
          onClear={onImageClear}
          fileName={form.imageFile?.name}
        />
      </div>
    )}

    {/* Title */}
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Property Title <span className="text-rose-400">*</span>
      </label>
      <input
        type="text" required placeholder="e.g. Bole Garden Villa"
        value={form.title} onChange={e => onChange('title', e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
      />
    </div>

    {/* Type */}
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Property Type <span className="text-rose-400">*</span>
      </label>
      <div className="grid grid-cols-4 gap-2">
        {(['house', 'villa', 'office', 'studio'] as PropertyType[]).map(t => (
          <button key={t} type="button" onClick={() => onChange('type', t)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              form.type === t
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            {TYPE_ICONS[t]}{t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>

    {/* City */}
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        City <span className="text-rose-400">*</span>
      </label>
      <select
        value={form.city}
        onChange={e => onChange('city', e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition bg-white"
      >
        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    {isAddis ? (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
          Sub-City / Area in Addis Ababa <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            required
            value={form.subcity}
            onChange={e => onChange('subcity', e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition bg-white"
          >
            <option value="">Select area…</option>
            {ADDIS_ABABA_SUBCITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    ) : (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
          Full Address <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" required placeholder="Street, city, country"
            value={form.address} onChange={e => onChange('address', e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
          />
        </div>
      </div>
    )}

    {isOffice ? (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Size (sqm) *</label>
          <input type="number" min="1" required placeholder="120"
            value={form.officeSqm} onChange={e => onChange('officeSqm', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Meeting Rooms *</label>
          <input type="number" min="0" required placeholder="2"
            value={form.meetingRooms} onChange={e => onChange('meetingRooms', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Parking *</label>
          <input type="number" min="0" required placeholder="4"
            value={form.parkingSpaces} onChange={e => onChange('parkingSpaces', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            <BedDouble className="inline h-3.5 w-3.5 mr-1" /> Bedrooms *
          </label>
          <input type="number" min="1" required
            value={form.beds} onChange={e => onChange('beds', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Bath className="inline h-3.5 w-3.5 mr-1" /> Bathrooms *
          </label>
          <input type="number" min="1" required
            value={form.baths} onChange={e => onChange('baths', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
        </div>
      </div>
    )}

    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Rooms / Units for rent <span className="text-rose-400">*</span>
      </label>
      <input type="number" min="1" required
        value={form.totalUnits} onChange={e => onChange('totalUnits', e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition" />
      <p className="text-[11px] text-gray-400">When every room is rented, this listing will no longer show as available.</p>
    </div>

    {/* Monthly Rent */}
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Monthly Rent (USD) <span className="text-rose-400">*</span>
      </label>
      <div className="relative">
        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="number" required min="1" placeholder="e.g. 2500"
          value={form.monthlyRent} onChange={e => onChange('monthlyRent', e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
        />
      </div>
    </div>
  </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Property Modal
// ─────────────────────────────────────────────────────────────────────────────

interface AddModalProps {
  ownerId: string;
  onClose: () => void;
  onSaved: (p: OwnerProperty) => void;
}

const AddPropertyModal: React.FC<AddModalProps> = ({ ownerId, onClose, onSaved }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onChange = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => setForm(prev => ({
      ...prev, imagePreview: e.target?.result as string, imageFile: file,
    }));
    reader.readAsDataURL(file);
  }, []);

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const raw = localStorage.getItem('currentUser');
      if (!raw) {
        throw new Error('Please login again to upload images');
      }

      const user = JSON.parse(raw);
      const token = user.token;

      if (!token) {
        throw new Error('Authentication token missing. Please logout and login again.');
      }

      console.log('📸 [uploadImageToCloudinary] Uploading with token...');

      const response = await fetch('/api/upload/property-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('currentUser');
          throw new Error('Session expired. Please logout and login again to continue.');
        }
        
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      console.log('✅ [uploadImageToCloudinary] Upload successful:', data.imageUrl);
      return data.imageUrl;
    } catch (err: any) {
      console.error('❌ [uploadImageToCloudinary] Upload failed:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (!form.imagePreview) { 
      setError('Please upload a property image first.'); 
      return; 
    }
    if (!form.title.trim()) { 
      setError('Please enter a property title.'); 
      return; 
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 [AddProperty.handleSubmit] ========== FORM SUBMISSION STARTED ==========');
    
    const msg = validateDetails(form);
    console.log('🔍 [AddProperty.handleSubmit] Validation message:', msg || 'VALIDATION PASSED ✓');
    
    if (msg) { 
      console.error('❌ [AddProperty.handleSubmit] Validation failed:', msg);
      setError(msg); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; 
    }

    if (!form.imageFile) {
      setError('Please upload an image');
      return;
    }

    console.log('✅ [AddProperty.handleSubmit] Validation passed, uploading image...');
    setSaving(true);
    setError('');
    
    try {
      // Step 1: Upload image to Cloudinary
      console.log('📸 [AddProperty.handleSubmit] Uploading image to Cloudinary...');
      const cloudinaryUrl = await uploadImageToCloudinary(form.imageFile);
      console.log('✅ [AddProperty.handleSubmit] Cloudinary URL received:', cloudinaryUrl);

      // Step 2: Create property with Cloudinary URL
      const address = form.city === 'Addis Ababa'
        ? `${form.subcity}, Addis Ababa, Ethiopia`
        : form.address.trim();

      const payload: CreatePropertyPayload = {
        ownerId,
        title: form.title.trim(),
        type: form.type,
        city: form.city,
        subcity: form.city === 'Addis Ababa' ? form.subcity : undefined,
        address,
        monthlyRent: Number(form.monthlyRent),
        beds: form.type !== 'office' ? Number(form.beds) || 1 : undefined,
        baths: Number(form.baths) || 1,
        officeSqm: form.type === 'office' ? Number(form.officeSqm) || 0 : undefined,
        meetingRooms: form.type === 'office' ? Number(form.meetingRooms) || 0 : undefined,
        parkingSpaces: Number(form.parkingSpaces) || 0,
        totalUnits: Math.max(1, Number(form.totalUnits) || 1),
        imageUrl: cloudinaryUrl,
      };

      console.log('🔍 [AddProperty.handleSubmit] Creating property with Cloudinary URL...');
      const result = await createOwnerProperty(payload);
      
      console.log('✅ [AddProperty.handleSubmit] Property created successfully:', result.property.id);
      
      onSaved(result.property);
      onClose();
    } catch (err: any) {
      console.error('❌ [AddProperty.handleSubmit] Save failed:', err);
      setError(err.message || 'Failed to save property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" /> Add New Property
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2 — {step === 1 ? 'Upload photo' : 'Property details'}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
              </div>
            )}
            <p className="text-sm text-gray-500">Start by uploading a photo and entering a title for your property.</p>
            
            {/* Property Image Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Property Image <span className="text-rose-400">*</span>
              </label>
              <UploadZone
                preview={form.imagePreview}
                onFile={onImageFile}
                onClear={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))}
                fileName={form.imageFile?.name}
              />
            </div>
            
            {/* Property Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Property Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bole Garden Villa"
                value={form.title}
                onChange={e => onChange('title', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
              <p className="text-xs text-gray-400">Choose a descriptive name for your property</p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="button" onClick={handleNext}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2">
                Next: Add Details <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-rose-50 border-2 border-rose-300 text-rose-700 px-4 py-3.5 rounded-xl animate-pulse">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Cannot Save Property</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}
            <FormFields form={form} onChange={onChange} onImageFile={onImageFile}
              onImageClear={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))}
              error="" showImage={false} />
            <div className="flex gap-3 pt-6">
              <button type="button" onClick={() => { setStep(1); setError(''); }}
                className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 px-4 hover:bg-gray-50 transition">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="submit" disabled={saving || uploading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {uploading ? 'Uploading Image…' : saving ? 'Saving…' : 'Save Property'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Edit Property Modal
// ─────────────────────────────────────────────────────────────────────────────

interface EditModalProps {
  property: OwnerProperty;
  ownerId: string;
  onClose: () => void;
  onSaved: (updated: OwnerProperty) => void;
}

const EditPropertyModal: React.FC<EditModalProps> = ({ property, ownerId, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>(propertyToForm(property));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onChange = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => setForm(prev => ({
      ...prev, imagePreview: e.target?.result as string, imageFile: file,
    }));
    reader.readAsDataURL(file);
  }, []);

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const raw = localStorage.getItem('currentUser');
      if (!raw) {
        throw new Error('Please login again to upload images');
      }

      const user = JSON.parse(raw);
      const token = user.token;

      if (!token) {
        throw new Error('Authentication token missing. Please logout and login again.');
      }

      const response = await fetch('/api/upload/property-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          localStorage.removeItem('currentUser');
          throw new Error('Session expired. Please logout and login again to continue.');
        }
        
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateDetails(form);
    if (msg) { setError(msg); return; }

    setSaving(true);
    setError('');
    try {
      // Upload new image if changed
      let imageUrl = form.imagePreview;
      if (form.imageFile) {
        imageUrl = await uploadImageToCloudinary(form.imageFile);
      }

      const address = form.city === 'Addis Ababa'
        ? `${form.subcity}, Addis Ababa, Ethiopia`
        : form.address.trim();

      const payload: UpdatePropertyPayload = {
        ownerId,
        title: form.title.trim(),
        type: form.type,
        city: form.city,
        subcity: form.city === 'Addis Ababa' ? form.subcity : undefined,
        address,
        monthlyRent: Number(form.monthlyRent),
        beds: form.type !== 'office' ? Number(form.beds) || 1 : undefined,
        baths: Number(form.baths) || 1,
        officeSqm: form.type === 'office' ? Number(form.officeSqm) || 0 : undefined,
        meetingRooms: form.type === 'office' ? Number(form.meetingRooms) || 0 : undefined,
        parkingSpaces: Number(form.parkingSpaces) || 0,
        totalUnits: Math.max(1, Number(form.totalUnits) || 1),
        imageUrl: imageUrl || null,
      };

      const result = await updateOwnerProperty(property.id, payload);
      onSaved(result.property);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" /> Edit Property
          </h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <FormFields form={form} onChange={onChange} onImageFile={onImageFile}
            onImageClear={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))} error={error} />
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} disabled={saving || uploading}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  property: OwnerProperty;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ property, onCancel, onConfirm, deleting }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl shrink-0">
          <Trash2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Delete Property?</h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">"{property.title}"</span> will be permanently removed from your portfolio and cannot be recovered.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={deleting}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition disabled:opacity-50">
          Keep It
        </button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl py-2.5 transition flex items-center justify-center gap-2 disabled:opacity-60">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {deleting ? 'Deleting…' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Property Detail Modal (View Full Details)
// ─────────────────────────────────────────────────────────────────────────────

interface PropertyDetailModalProps {
  property: OwnerProperty;
  onClose: () => void;
  onEdit: (p: OwnerProperty) => void;
  onDelete: (p: OwnerProperty) => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, onEdit, onDelete }) => {
  const isOffice = property.type === 'office';
  const displayAddress = property.city === 'Addis Ababa' && property.subcity
    ? `${property.subcity}, Addis Ababa, Ethiopia`
    : property.address;
  const validation = VALIDATION_BADGE[property.validation?.toUpperCase()] ?? VALIDATION_BADGE.PENDING;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{property.title}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />{displayAddress}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property Image */}
        <div className="relative aspect-video bg-gray-100">
          {property.imageUrl ? (
            <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-300">
              <ImageOff className="h-12 w-12" />
              <span className="text-sm font-semibold">No image uploaded</span>
            </div>
          )}
          
          {/* Type badge overlay */}
          <span className={`absolute top-4 left-4 inline-flex items-center gap-1.5 border text-xs font-bold px-3 py-1.5 rounded-full shadow-md bg-white/95 backdrop-blur-sm ${TYPE_COLORS[property.type]}`}>
            {TYPE_ICONS[property.type]}{property.type.charAt(0).toUpperCase() + property.type.slice(1)}
          </span>
        </div>

        {/* Property Details */}
        <div className="p-6 space-y-6">
          
          {/* Status & Validation */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
              property.status === 'available' ? 'bg-emerald-500 text-white'
              : property.status === 'applied' ? 'bg-amber-500 text-white'
              : 'bg-slate-600 text-white'
            }`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {STATUS_LABEL[property.status] ?? property.status}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${validation.cls}`}>
              {validation.label}
            </span>
          </div>

          {/* Price */}
          <div>
            <p className="text-sm text-gray-500 font-medium">Monthly Rent</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-gray-900">${property.monthlyRent.toLocaleString()}</span>
              <span className="text-sm text-gray-400 font-medium">/ month</span>
            </div>
          </div>

          {/* Property Specifications */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {!isOffice && (
                <>
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Bedrooms</p>
                      <p className="font-semibold text-gray-900">{property.beds}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Bathrooms</p>
                      <p className="font-semibold text-gray-900">{property.baths}</p>
                    </div>
                  </div>
                </>
              )}
              {isOffice && (
                <>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Office Size</p>
                      <p className="font-semibold text-gray-900">{property.officeSqm} sqm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Meeting Rooms</p>
                      <p className="font-semibold text-gray-900">{property.meetingRooms}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Parking Spaces</p>
                  <p className="font-semibold text-gray-900">{property.parkingSpaces}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Rooms / Units</p>
                  <p className="font-semibold text-gray-900">{property.rentedUnits} / {property.totalUnits} rented</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Location</h3>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
              <p>{displayAddress}</p>
            </div>
          </div>

          {/* Property ID & Created Date */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Property ID</p>
              <p className="text-sm font-mono text-gray-700 mt-0.5">{property.id.substring(0, 8)}...</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-700 mt-0.5">{new Date(property.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => { onEdit(property); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl py-3 transition shadow-sm"
            >
              <Pencil className="h-4 w-4" /> Edit Property
            </button>
            <button
              onClick={() => { onDelete(property); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl py-3 transition shadow-sm"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Property Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  property: OwnerProperty;
  totalCount: number;
  onEdit: (p: OwnerProperty) => void;
  onDelete: (p: OwnerProperty) => void;
  onView: (p: OwnerProperty) => void;
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  applied: 'Application Pending',
  rented: 'Rented',
};

const VALIDATION_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Awaiting Approval', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved',          cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected',          cls: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const PropertyCard: React.FC<CardProps> = ({ property, totalCount, onEdit, onDelete, onView }) => {
  const ownerDiscount = totalCount > 1;
  const tenantBundle  = property.tenantUnitCount > 1;
  const isOffice = property.type === 'office';
  const displayAddress = property.city === 'Addis Ababa' && property.subcity
    ? `${property.subcity}, Addis Ababa`
    : property.address;
  const validation = VALIDATION_BADGE[property.validation?.toUpperCase()] ?? VALIDATION_BADGE.PENDING;

  return (
    <div 
      onClick={() => onView(property)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group cursor-pointer hover:border-emerald-300"
    >

      {/* Image */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {property.imageUrl ? (
          <img src={property.imageUrl} alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs font-semibold">No image</span>
          </div>
        )}

        {/* Type badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-white/90 backdrop-blur-sm ${TYPE_COLORS[property.type]}`}>
          {TYPE_ICONS[property.type]}{property.type.charAt(0).toUpperCase() + property.type.slice(1)}
        </span>

        {/* Status badge */}
        <span className={`absolute bottom-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
          property.status === 'available' ? 'bg-emerald-500 text-white'
          : property.status === 'applied' ? 'bg-amber-500 text-white'
          : 'bg-slate-600 text-white'
        }`}>
          {STATUS_LABEL[property.status] ?? property.status}
        </span>

        {/* Action buttons on hover */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(property); }}
            className="bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-full p-1.5 shadow transition"
            title="Edit property"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(property); }}
            className="bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-300 rounded-full p-1.5 shadow transition"
            title="Delete property"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{property.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />{displayAddress}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {isOffice
              ? `${property.officeSqm} sqm · ${property.meetingRooms} meeting room(s) · ${property.parkingSpaces} parking`
              : `${property.beds} bed · ${property.baths} bath`}
            {' · '}{property.rentedUnits}/{property.totalUnits} rooms rented
          </p>
        </div>

        {/* Validation badge */}
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${validation.cls}`}>
          {validation.label}
        </span>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-gray-900">${property.monthlyRent.toLocaleString()}</span>
          <span className="text-xs text-gray-400 font-medium">/ month</span>
        </div>

        {/* Discount indicators */}
        <div className="space-y-1.5 pt-1 border-t border-gray-50">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border w-full justify-center ${
            ownerDiscount ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            <Building2 className="h-3 w-3 shrink-0" />
            {ownerDiscount ? 'Bulk Owner Discount Applied' : 'Standard Rate'}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border w-full justify-center ${
            tenantBundle ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            <Users className="h-3 w-3 shrink-0" />
            {tenantBundle ? 'Multi-Tenant Bundle Discount Active' : 'Standard Rent'}
          </span>
        </div>

        {/* View Details prompt */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 justify-center group-hover:gap-2 transition-all">
            Click to view full details <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Mobile action buttons */}
        <div className="flex gap-2 pt-1 sm:hidden">
          <button onClick={(e) => { e.stopPropagation(); onEdit(property); }}
            className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-2 rounded-lg transition">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(property); }}
            className="flex-1 flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold py-2 rounded-lg transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// localStorage → DB migration helper
// Reads old localStorage data on first load and POSTs it to the backend,
// then clears the key so it only runs once.
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_STORAGE_KEY = 'renthub_owner_properties';
const MIGRATED_FLAG_KEY  = 'renthub_ls_migrated';

async function migrateLocalStorageToDb(ownerId: string): Promise<boolean> {
  if (localStorage.getItem(MIGRATED_FLAG_KEY) === 'true') return false;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) { localStorage.setItem(MIGRATED_FLAG_KEY, 'true'); return false; }

  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
      return false;
    }

    // Only migrate real user data, not seed IDs
    const userItems = items.filter((p: any) => p.id && !p.id.startsWith('seed-'));
    if (userItems.length === 0) {
      localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
      return false;
    }

    const migrations = userItems.map((p: any) =>
      createOwnerProperty({
        ownerId,
        title:        p.title       ?? 'Untitled',
        type:         (p.type?.toLowerCase() ?? 'house') as any,
        city:         p.city        ?? 'Other',
        subcity:      p.subcity     ?? undefined,
        address:      p.address     ?? '',
        monthlyRent:  Number(p.monthlyRent) || 0,
        beds:         Number(p.beds) || undefined,
        baths:        Number(p.baths) || 1,
        officeSqm:    Number(p.officeSqm) || undefined,
        meetingRooms: Number(p.meetingRooms) || undefined,
        parkingSpaces: Number(p.parkingSpaces) || 0,
        totalUnits:   Number(p.totalUnits) || 1,
        imageUrl:     p.imageUrl    ?? null,
      }).catch(() => null) // ignore individual failures
    );

    await Promise.all(migrations);
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
    // Keep old key around in case user wants to verify, but flag it
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

interface MyPropertiesPageProps {
  user?: { id?: string; email?: string };
  openAddProperty?: boolean;
}

export const MyPropertiesPage: React.FC<MyPropertiesPageProps> = ({ user, openAddProperty = false }) => {
  const ownerId = user?.id ?? user?.email ?? getOwnerIdFromSession() ?? '';

  const [properties,   setProperties]   = useState<OwnerProperty[]>([]);
  const [loading,      setLoading]       = useState(true);
  const [error,        setError]         = useState<string | null>(null);
  const [showAdd,      setShowAdd]       = useState(false);
  const [editTarget,   setEditTarget]    = useState<OwnerProperty | null>(null);
  const [deleteTarget, setDeleteTarget]  = useState<OwnerProperty | null>(null);
  const [deleting,     setDeleting]      = useState(false);
  const [migrateMsg,   setMigrateMsg]    = useState<string | null>(null);

  useEffect(() => {
    if (openAddProperty && ownerId) setShowAdd(true);
  }, [openAddProperty, ownerId]);

  const load = useCallback(async () => {
    if (!ownerId) { 
      setLoading(false); 
      return; 
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOwnerProperties(ownerId);
      setProperties(data.properties);
    } catch (err: any) {
      // Don't redirect, just clear error silently
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Initial load + optional migration
  useEffect(() => {
    if (!ownerId) return;
    const init = async () => {
      setLoading(true);
      const migrated = await migrateLocalStorageToDb(ownerId);
      if (migrated) setMigrateMsg('Your previously saved properties have been migrated to the database.');
      await load();
    };
    init();
  }, [ownerId]);

  const handleAdd = (p: OwnerProperty) => {
    setProperties(prev => [p, ...prev]);
  };

  const handleEdit = (updated: OwnerProperty) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOwnerProperty(deleteTarget.id, ownerId);
      setProperties(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete property.');
    } finally {
      setDeleting(false);
    }
  };

  const totalRent  = properties.reduce((s, p) => s + p.monthlyRent, 0);
  const bulkActive = properties.length > 1;

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-gray-500 font-semibold text-sm">Loading your properties…</p>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && properties.length === 0) {
    return (
      <div className="p-6 sm:p-8 bg-gray-50 min-h-screen space-y-8 animate-fadeIn">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Property Portfolio</h1>
            <p className="text-gray-500 text-sm mt-1">0 properties</p>
          </div>
          <div className="flex items-center gap-2">
            {ownerId && (
              <button onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition">
                <Plus className="h-4 w-4" /> Add Property
              </button>
            )}
          </div>
        </div>

        {/* Empty State - No Error Message Shown */}
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-300" />
          <div className="text-center">
            <p className="font-semibold text-lg text-gray-700">No properties yet</p>
            <p className="text-sm mt-1">Click the "Add Property" button above to get started</p>
          </div>
        </div>

        {/* Modals */}
        {showAdd && ownerId && (
          <AddPropertyModal ownerId={ownerId} onClose={() => setShowAdd(false)} onSaved={handleAdd} />
        )}
        {editTarget && ownerId && (
          <EditPropertyModal property={editTarget} ownerId={ownerId} onClose={() => setEditTarget(null)} onSaved={handleEdit} />
        )}
        {deleteTarget && (
          <DeleteDialog property={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Property Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            &nbsp;·&nbsp;${totalRent.toLocaleString()} total / month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition">
            <Plus className="h-4 w-4" /> Add New Property
          </button>
        </div>
      </div>

      {/* Migration notice */}
      {migrateMsg && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
          {migrateMsg}
          <button onClick={() => setMigrateMsg(null)} className="ml-auto text-blue-500 hover:text-blue-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* NO ERROR BANNER - REMOVED */}

      {/* Discount banner */}
      <div className={`rounded-xl border px-5 py-3 flex items-center gap-3 text-sm font-semibold transition-colors ${
        bulkActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}>
        <Tag className={`h-4 w-4 shrink-0 ${bulkActive ? 'text-emerald-600' : 'text-gray-400'}`} />
        {bulkActive
          ? `Bulk Owner Discount active — you own ${properties.length} properties`
          : 'Add a second property to unlock the Bulk Owner Discount'}
      </div>

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
          <Building2 className="h-12 w-12" />
          <p className="font-semibold text-lg">No properties yet</p>
          <p className="text-sm">Click "+ Add New Property" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map(p => (
            <PropertyCard
              key={p.id} property={p} totalCount={properties.length}
              onEdit={setEditTarget} onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && ownerId && (
        <AddPropertyModal ownerId={ownerId} onClose={() => setShowAdd(false)} onSaved={handleAdd} />
      )}
      {editTarget && ownerId && (
        <EditPropertyModal
          property={editTarget}
          ownerId={ownerId}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { handleEdit(updated); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          property={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
};
