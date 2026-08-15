import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Lock, ShieldCheck, BadgeCheck, FileText, PenLine,
  AlertTriangle, CheckCircle2, Fingerprint, Clock,
  Building2, User, CalendarDays, DollarSign, Eraser,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { AppUser } from '../../types';

const API_URL = '/api';

// ── Mock lease contract data ────────────────────────────────────────────────
// In production this comes from GET /api/esign/documents/:id
const MOCK_DOCUMENT = {
  id: 'doc_20260807_001',
  propertyId: 1,
  propertyTitle: 'Premium Villa Room 4',
  propertyAddress: '123 Sunrise Valley Lane, Beverly Hills, CA 90210',
  propertyType: 'Villa',
  monthlyRent: 8500,
  startDate: '2026-09-01',
  endDate: '2027-08-31',
  ownerName: 'Alex Johnson',
  ownerEmail: 'alex.johnson@renthub.com',
  leaseTerm: 12,
  securityDeposit: 17000,
  lateFeePercent: 5,
  gracePeriodDays: 5,
};

const LEASE_CLAUSES = [
  {
    title: '1. Premises',
    body: `Landlord hereby leases to Tenant the property described above (the "Premises") for residential use only. Tenant agrees to use the Premises solely as a private residence and not for any commercial, illegal, or otherwise unauthorized purpose.`,
  },
  {
    title: '2. Term of Lease',
    body: `This lease shall commence on the Start Date and continue for the full lease term as specified above, unless sooner terminated in accordance with the provisions hereof. At the expiration of the lease term, Tenant must vacate unless a renewal agreement is executed in writing.`,
  },
  {
    title: '3. Rent & Payment',
    body: `Tenant agrees to pay the Monthly Rent on or before the 1st day of each calendar month. Payments must be made via the RentHub platform. A late fee of ${MOCK_DOCUMENT.lateFeePercent}% of the monthly rent shall apply to any payment received after the ${MOCK_DOCUMENT.gracePeriodDays}-day grace period.`,
  },
  {
    title: '4. Security Deposit',
    body: `Tenant shall deposit the Security Deposit prior to move-in. This deposit shall be held in trust and returned within 21 days of lease termination, less any lawful deductions for unpaid rent or damages beyond normal wear and tear.`,
  },
  {
    title: '5. Maintenance & Repairs',
    body: `Tenant agrees to maintain the Premises in a clean and sanitary condition. Tenant shall promptly notify Landlord of any damage or need for repair via the RentHub Maintenance portal. Tenant is responsible for minor repairs under $150 USD.`,
  },
  {
    title: '6. Entry by Landlord',
    body: `Landlord may enter the Premises with 24 hours prior written notice for the purpose of inspecting, making repairs, or showing the property to prospective tenants. Emergency entry is permitted without prior notice.`,
  },
  {
    title: '7. Electronic Signature & Legal Validity',
    body: `Both parties agree that an electronic signature affixed to this document via the RentHub E-Sign platform constitutes a legally binding signature pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001 et seq.) and the Uniform Electronic Transactions Act (UETA). The signing timestamp, IP address, and device fingerprint are captured server-side and stored in an immutable audit log as evidentiary record.`,
  },
];

// ── Reusable trust badge strip ──────────────────────────────────────────────
const TrustBadges: React.FC = () => (
  <div className="flex flex-wrap items-center justify-center gap-3 py-3 px-4 bg-slate-900 rounded-xl">
    {[
      { icon: <Lock className="h-3.5 w-3.5 text-emerald-400" />, label: '256-bit TLS Encrypted' },
      { icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />, label: 'E-SIGN Act Compliant' },
      { icon: <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />, label: 'Tamper-Proof Audit Log' },
      { icon: <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />, label: 'IP & Timestamp Captured' },
    ].map(({ icon, label }) => (
      <span key={label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        {icon}{label}
      </span>
    ))}
  </div>
);

// ── Canvas signature pad ─────────────────────────────────────────────────────
interface CanvasPadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const CanvasSignaturePad: React.FC<CanvasPadProps> = ({ onSignatureChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  // Retina-sharp canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; const ctx = getCtx();
    if (!canvas || !ctx) return;
    drawing.current = true;
    const { x, y } = pos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; const ctx = getCtx();
    if (!canvas || !ctx) return;
    const { x, y } = pos(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
    hasStrokes.current = true;
  };

  const endDraw = useCallback(() => {
    drawing.current = false;
    if (hasStrokes.current && canvasRef.current) {
      onSignatureChange(canvasRef.current.toDataURL('image/png'));
    }
  }, [onSignatureChange]);

  const clear = () => {
    const canvas = canvasRef.current; const ctx = getCtx();
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasStrokes.current = false;
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden"
           style={{ height: 140 }}>
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-300 pointer-events-none select-none">
          Draw your signature above
        </span>
      </div>
      <button onClick={clear}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 transition">
        <Eraser className="h-3.5 w-3.5" /> Clear
      </button>
    </div>
  );
};
