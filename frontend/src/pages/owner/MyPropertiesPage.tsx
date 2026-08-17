import React, { useState, useRef, useCallback } from 'react';
import {
  Plus, X, UploadCloud, Home, Building2, Briefcase,
  BedDouble, Tag, DollarSign, MapPin, CheckCircle2,
  ImageOff, Users, Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PropertyType = 'House' | 'Villa' | 'Office' | 'Studio';

interface Property {
  id: string;
  title: string;
  type: PropertyType;
  address: string;
  monthlyRent: number;
  /**
   * imageUrl stores the file path / CDN URL that is persisted in PostgreSQL.
   *
   * Flow:
   *   1. User drags or selects a file → FileReader converts it to a base64
   *      data-URL for the live preview (local only, never sent raw to DB).
   *   2. On form submit the file is uploaded via multipart/form-data to
   *      POST /api/properties/upload-image (Express + multer).
   *   3. The server saves the file to /uploads/ (or an S3 bucket) and returns
   *      the public path string, e.g. "/uploads/villa-abc123.jpg".
   *   4. That returned path string is stored in the `image_url` VARCHAR column
   *      of the public.properties table via the register endpoint.
   *
   * Here in the UI we store the local ObjectURL / base64 preview only.
   */
  imageUrl: string | null;
  /** Mock: how many units this tenant rents across the portfolio */
  tenantUnitCount: number;
}

interface FormState {
  title: string;
  type: PropertyType;
  address: string;
  monthlyRent: string;
  imagePreview: string | null;
  imageFile: File | null;
}

const INITIAL_FORM: FormState = {
  title: '', type: 'House', address: '', monthlyRent: '',
  imagePreview: null, imageFile: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
  House:  <Home      className="h-3.5 w-3.5" />,
  Villa:  <Sparkles  className="h-3.5 w-3.5" />,
  Office: <Briefcase className="h-3.5 w-3.5" />,
  Studio: <BedDouble className="h-3.5 w-3.5" />,
};

const TYPE_COLORS: Record<PropertyType, string> = {
  House:  'bg-blue-50   text-blue-700   border-blue-200',
  Villa:  'bg-purple-50 text-purple-700 border-purple-200',
  Office: 'bg-amber-50  text-amber-700  border-amber-200',
  Studio: 'bg-rose-50   text-rose-700   border-rose-200',
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Property Modal
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onSave: (p: Omit<Property, 'id' | 'tenantUnitCount'>) => void;
}

const AddPropertyModal: React.FC<ModalProps> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  /** Convert the selected File to a local preview URL (base64 data-URL). */
  const loadPreview = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) =>
      setForm(prev => ({
        ...prev,
        imagePreview: e.target?.result as string,
        imageFile: file,
      }));
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadPreview(file);
  }, [loadPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPreview(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim() || !form.monthlyRent) {
      setError('Please fill in all required fields.');
      return;
    }
    onSave({
      title: form.title.trim(),
      type: form.type,
      address: form.address.trim(),
      monthlyRent: Number(form.monthlyRent),
      // imageUrl here holds the local preview. In production this would be
      // replaced with the URL returned from the server upload endpoint.
      imageUrl: form.imagePreview,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Property Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" required placeholder="e.g. Sunrise Villa Block A"
              value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Property Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['House', 'Villa', 'Office', 'Studio'] as PropertyType[]).map(t => (
                <button
                  key={t} type="button"
                  onClick={() => set('type', t)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    form.type === t
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {TYPE_ICONS[t]}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" required placeholder="123 Main St, City"
                value={form.address} onChange={e => set('address', e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>
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
                value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>
          </div>

          {/* ── Image Upload Zone ───────────────────────────────────────── */}
          {/*
           * The drop zone calls FileReader to produce a local base64 preview.
           * On real submission the `imageFile` state is sent as multipart/form-data
           * to POST /api/properties/upload-image. Express (multer) saves it to disk
           * or S3 and returns the public path string (e.g. "/uploads/abc.jpg").
           * That string is then passed as `image_url` to the properties INSERT query.
           */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Property Image
            </label>

            {form.imagePreview ? (
              /* Thumbnail preview once a file is selected */
              <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video">
                <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {form.imageFile?.name}
                </span>
              </div>
            ) : (
              /* Drag-and-drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors ${
                  dragging
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <UploadCloud className={`h-8 w-8 ${dragging ? 'text-emerald-500' : 'text-gray-300'}`} />
                <p className="text-sm font-semibold text-gray-500">
                  {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 MB</p>
                <input
                  ref={fileInputRef} type="file" accept="image/*"
                  className="hidden" onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Save Property
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Property Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  property: Property;
  totalPortfolioCount: number;
}

const PropertyCard: React.FC<CardProps> = ({ property, totalPortfolioCount }) => {
  /**
   * Bulk Owner Discount:
   *   ≥2 properties in portfolio → green badge (discount applied by backend pricing engine)
   *   1 property               → gray badge  (standard rate)
   */
  const ownerDiscount = totalPortfolioCount > 1;

  /**
   * Multi-Tenant Bundle Discount:
   *   tenant rents ≥2 units from this owner → emerald badge
   *   tenant rents 1 unit                  → gray badge
   */
  const tenantBundle = property.tenantUnitCount > 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">

      {/* Image */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {property.imageUrl ? (
          <img
            src={property.imageUrl} alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs font-semibold">No image uploaded</span>
          </div>
        )}

        {/* Category badge — top-left overlay */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-white/90 backdrop-blur-sm ${TYPE_COLORS[property.type]}`}>
          {TYPE_ICONS[property.type]}
          {property.type}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Title + address */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{property.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />{property.address}
          </p>
        </div>

        {/* Rent */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-gray-900">
            ${property.monthlyRent.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 font-medium">/ month</span>
        </div>

        {/* ── Discount indicators ── */}
        <div className="space-y-1.5 pt-1 border-t border-gray-50">

          {/* Owner portfolio discount */}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border w-full justify-center ${
            ownerDiscount
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            <Building2 className="h-3 w-3 shrink-0" />
            {ownerDiscount ? 'Bulk Owner Discount Applied' : 'Standard Rate'}
          </span>

          {/* Tenant bundle discount */}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border w-full justify-center ${
            tenantBundle
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            <Users className="h-3 w-3 shrink-0" />
            {tenantBundle ? 'Multi-Tenant Bundle Discount Active' : 'Standard Rent'}
          </span>

        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

// Seed mock data so the page renders immediately without a backend call
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1', title: 'Sunrise Villa Block A', type: 'Villa',
    address: '12 Hilltop Lane, Beverly Hills, CA',
    monthlyRent: 8500, imageUrl: '/villa.png', tenantUnitCount: 2,
  },
  {
    id: '2', title: 'Downtown Office Suite 4B', type: 'Office',
    address: '88 Commerce Blvd, Chicago, IL',
    monthlyRent: 4200, imageUrl: '/office.png', tenantUnitCount: 1,
  },
  {
    id: '3', title: 'Garden Studio — Unit 7', type: 'Studio',
    address: '9 Palm Street, Miami, FL',
    monthlyRent: 1800, imageUrl: null, tenantUnitCount: 3,
  },
];

export const MyPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [showModal, setShowModal] = useState(false);

  const handleSave = (data: Omit<Property, 'id' | 'tenantUnitCount'>) => {
    const newProp: Property = {
      ...data,
      id: Date.now().toString(),
      tenantUnitCount: 1, // new property starts with 1 tenant unit by default
    };
    setProperties(prev => [newProp, ...prev]);
  };

  // Summary stats
  const totalRent = properties.reduce((s, p) => s + p.monthlyRent, 0);
  const bulkActive = properties.length > 1;

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen space-y-8 animate-fadeIn">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Property Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} &nbsp;·&nbsp;
            ${totalRent.toLocaleString()} total monthly rent
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" /> Add New Property
        </button>
      </div>

      {/* ── DISCOUNT STATUS BANNER ──────────────────────────────────────── */}
      <div className={`rounded-xl border px-5 py-3 flex items-center gap-3 text-sm font-semibold transition-colors ${
        bulkActive
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}>
        <Tag className={`h-4 w-4 shrink-0 ${bulkActive ? 'text-emerald-600' : 'text-gray-400'}`} />
        {bulkActive
          ? `Bulk Owner Discount active — you own ${properties.length} properties`
          : 'Add a second property to unlock the Bulk Owner Discount'}
      </div>

      {/* ── PROPERTY GRID ───────────────────────────────────────────────── */}
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
              key={p.id}
              property={p}
              totalPortfolioCount={properties.length}
            />
          ))}
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────── */}
      {showModal && (
        <AddPropertyModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
};
