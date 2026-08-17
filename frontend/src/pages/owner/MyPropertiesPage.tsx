import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, X, UploadCloud, Home, Building2, Briefcase,
  BedDouble, Tag, DollarSign, MapPin, CheckCircle2,
  ImageOff, Users, Sparkles, Pencil, Trash2, AlertTriangle,
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
   * imageUrl is stored as a base64 data-URL in localStorage so it persists
   * across navigation. In production this would be the server-returned CDN URL
   * from POST /api/properties/upload-image, stored in the image_url DB column.
   */
  imageUrl: string | null;
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

const BLANK_FORM: FormState = {
  title: '', type: 'House', address: '', monthlyRent: '',
  imagePreview: null, imageFile: null,
};

const STORAGE_KEY = 'renthub_owner_properties';

// ─────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadProperties(): Property[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_PROPERTIES;
  } catch {
    return SEED_PROPERTIES;
  }
}

function saveProperties(list: Property[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // localStorage quota can be hit with large base64 images; warn silently
    console.warn('Could not persist properties to localStorage:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data (used only on first load when localStorage is empty)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_PROPERTIES: Property[] = [
  { id: 'seed-1', title: 'Sunrise Villa Block A',   type: 'Villa',  address: '12 Hilltop Lane, Beverly Hills, CA', monthlyRent: 8500, imageUrl: '/villa.png',   tenantUnitCount: 2 },
  { id: 'seed-2', title: 'Downtown Office Suite 4B', type: 'Office', address: '88 Commerce Blvd, Chicago, IL',       monthlyRent: 4200, imageUrl: '/office.png', tenantUnitCount: 1 },
  { id: 'seed-3', title: 'Garden Studio — Unit 7',   type: 'Studio', address: '9 Palm Street, Miami, FL',            monthlyRent: 1800, imageUrl: null,           tenantUnitCount: 3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI constants
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
// Image Upload Zone (shared between Add and Edit modals)
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
        {/* Delete image button — explicit, not triggered by clicking anywhere else */}
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
        {/* Click to replace */}
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
// Form fields (shared between Add and Edit)
// ─────────────────────────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  onImageFile: (file: File) => void;
  onImageClear: () => void;
  error: string;
}

const FormFields: React.FC<FormFieldsProps> = ({ form, onChange, onImageFile, onImageClear, error }) => (
  <div className="space-y-5">
    {error && (
      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-lg">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
      </div>
    )}

    {/* Title */}
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Property Title <span className="text-rose-400">*</span>
      </label>
      <input
        type="text" required placeholder="e.g. Sunrise Villa Block A"
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
        {(['House', 'Villa', 'Office', 'Studio'] as PropertyType[]).map(t => (
          <button key={t} type="button" onClick={() => onChange('type', t)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              form.type === t
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            {TYPE_ICONS[t]}{t}
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
          value={form.address} onChange={e => onChange('address', e.target.value)}
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
          value={form.monthlyRent} onChange={e => onChange('monthlyRent', e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
        />
      </div>
    </div>

    {/* Image */}
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
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Add Property Modal
// ─────────────────────────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
  onSave: (p: Omit<Property, 'id' | 'tenantUnitCount'>) => void;
}

const AddPropertyModal: React.FC<AddModalProps> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [error, setError] = useState('');

  const onChange = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => setForm(prev => ({
      ...prev, imagePreview: e.target?.result as string, imageFile: file,
    }));
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim() || !form.monthlyRent) {
      setError('Please fill in all required fields.'); return;
    }
    onSave({
      title: form.title.trim(), type: form.type,
      address: form.address.trim(), monthlyRent: Number(form.monthlyRent),
      imageUrl: form.imagePreview,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" /> Add New Property
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <FormFields form={form} onChange={onChange} onImageFile={onImageFile}
            onImageClear={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))} error={error} />
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Edit Property Modal
// ─────────────────────────────────────────────────────────────────────────────

interface EditModalProps {
  property: Property;
  onClose: () => void;
  onSave: (updated: Property) => void;
}

const EditPropertyModal: React.FC<EditModalProps> = ({ property, onClose, onSave }) => {
  const [form, setForm] = useState<FormState>({
    title: property.title, type: property.type,
    address: property.address, monthlyRent: String(property.monthlyRent),
    imagePreview: property.imageUrl, imageFile: null,
  });
  const [error, setError] = useState('');

  const onChange = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => setForm(prev => ({
      ...prev, imagePreview: e.target?.result as string, imageFile: file,
    }));
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim() || !form.monthlyRent) {
      setError('Please fill in all required fields.'); return;
    }
    onSave({
      ...property,
      title: form.title.trim(), type: form.type,
      address: form.address.trim(), monthlyRent: Number(form.monthlyRent),
      imageUrl: form.imagePreview,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" /> Edit Property
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <FormFields form={form} onChange={onChange} onImageFile={onImageFile}
            onImageClear={() => setForm(p => ({ ...p, imagePreview: null, imageFile: null }))} error={error} />
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl py-2.5 transition shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save Changes
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
  property: Property;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ property, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl shrink-0">
          <Trash2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Delete Property?</h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">"{property.title}"</span> will be permanently removed from your portfolio.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-gray-50 transition">
          Keep It
        </button>
        <button onClick={onConfirm}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl py-2.5 transition flex items-center justify-center gap-2">
          <Trash2 className="h-4 w-4" /> Yes, Delete
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Property Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  property: Property;
  totalCount: number;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
}

const PropertyCard: React.FC<CardProps> = ({ property, totalCount, onEdit, onDelete }) => {
  const ownerDiscount = totalCount > 1;
  const tenantBundle  = property.tenantUnitCount > 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">

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
          {TYPE_ICONS[property.type]}{property.type}
        </span>

        {/* Action buttons — visible on hover */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(property)}
            className="bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-full p-1.5 shadow transition"
            title="Edit property"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(property)}
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
            <MapPin className="h-3 w-3 shrink-0" />{property.address}
          </p>
        </div>

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

        {/* Inline action buttons (always visible on mobile, complement hover on desktop) */}
        <div className="flex gap-2 pt-1 sm:hidden">
          <button onClick={() => onEdit(property)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-2 rounded-lg transition">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={() => onDelete(property)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold py-2 rounded-lg transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export const MyPropertiesPage: React.FC = () => {
  // Load from localStorage on mount — survives navigation
  const [properties, setProperties] = useState<Property[]>(loadProperties);
  const [showAdd,    setShowAdd]     = useState(false);
  const [editTarget, setEditTarget]  = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  // Persist to localStorage every time the list changes
  useEffect(() => {
    saveProperties(properties);
  }, [properties]);

  const handleAdd = (data: Omit<Property, 'id' | 'tenantUnitCount'>) => {
    setProperties(prev => [{ ...data, id: `prop-${Date.now()}`, tenantUnitCount: 1 }, ...prev]);
  };

  const handleEdit = (updated: Property) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDelete = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const totalRent  = properties.reduce((s, p) => s + p.monthlyRent, 0);
  const bulkActive = properties.length > 1;

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
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition">
          <Plus className="h-4 w-4" /> Add New Property
        </button>
      </div>

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
      {showAdd && (
        <AddPropertyModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editTarget && (
        <EditPropertyModal
          property={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={updated => { handleEdit(updated); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          property={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { handleDelete(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
};
