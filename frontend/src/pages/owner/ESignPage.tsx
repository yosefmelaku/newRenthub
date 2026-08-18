import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  PenTool, ShieldCheck, CalendarRange, FileCheck,
  FileSignature, CheckCircle2, Clock, Lock,
  BadgeCheck, Fingerprint, Download, History,
  Share2, Plus, Upload, ChevronRight, X,
  AlertTriangle, Eraser, RotateCcw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PipelineStep = 'generated' | 'awaiting' | 'executed';
type DocStatus    = 'Executed' | 'Pending' | 'Draft' | 'Expired';
type SignMethod   = 'draw' | 'type';

interface LeaseConfig {
  tenantName:    string;
  propertyTitle: string;
  monthlyRent:   number;
  startDate:     string;
  endDate:       string;
  template:      string;
}

interface ESignDocument {
  id: string;
  name: string;
  recipient: string;
  property: string;
  lastActivity: string;
  status: DocStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: ESignDocument[] = [
  { id: '1', name: 'Standard 12-Month Lease — Horizon Villa', recipient: 'Alice Smith (al***@ex.com)', property: 'Premium Villa Room 4', lastActivity: '2 hours ago',  status: 'Executed' },
  { id: '2', name: 'Office Agreement Form — Suite 101',        recipient: 'Bob Johnson (bo***@ex.com)', property: 'Downtown Office B',    lastActivity: '1 day ago',   status: 'Pending'  },
  { id: '3', name: 'General Rental Waiver — Studio C',         recipient: 'Charlie Davis (ch***@ex.com)', property: 'Studio C',          lastActivity: '3 days ago',  status: 'Draft'    },
];

const DOC_STATUS_CLS: Record<DocStatus, string> = {
  Executed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Pending:  'bg-blue-100    text-blue-800    border-blue-200',
  Draft:    'bg-yellow-100  text-yellow-800  border-yellow-200',
  Expired:  'bg-zinc-100    text-zinc-600    border-zinc-200',
};

const TEMPLATES = [
  'Standard 12-Month Residential Lease',
  'Short-Term 6-Month Lease',
  'Commercial Office Lease',
  'Studio / Furnished Unit Lease',
  'Month-to-Month Tenancy Agreement',
];

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline step indicator
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactNode }[] = [
  { id: 'generated', label: '1. Generated',              icon: <FileCheck     className="h-5 w-5" /> },
  { id: 'awaiting',  label: '2. Awaiting Signature',     icon: <Clock         className="h-5 w-5" /> },
  { id: 'executed',  label: '3. Fully Executed',         icon: <BadgeCheck    className="h-5 w-5" /> },
];

const PipelineBar: React.FC<{ current: PipelineStep }> = ({ current }) => {
  const order: PipelineStep[] = ['generated', 'awaiting', 'executed'];
  const idx = order.indexOf(current);

  return (
    <div className="flex items-center gap-0 bg-zinc-900 rounded-2xl p-5 mb-6">
      {PIPELINE_STEPS.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all flex-1 justify-center
              ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : done   ? 'text-emerald-400'
              : 'text-zinc-500'}`}>
              {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : step.icon}
              <span className={`text-xs font-bold whitespace-nowrap ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <ChevronRight className={`h-4 w-4 shrink-0 ${i < idx ? 'text-emerald-500' : 'text-zinc-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Canvas signature pad
// ─────────────────────────────────────────────────────────────────────────────

const CanvasPad: React.FC<{ onChange: (url: string | null) => void }> = ({ onChange }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);
  const hasStrokes = useRef(false);

  const ctx = () => canvasRef.current?.getContext('2d') ?? null;

  // Scale for retina
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const r   = c.getBoundingClientRect();
    c.width  = r.width  * dpr;
    c.height = r.height * dpr;
    const g  = ctx(); if (!g) return;
    g.scale(dpr, dpr);
    g.strokeStyle = '#1e293b';
    g.lineWidth   = 2.5;
    g.lineCap     = 'round';
    g.lineJoin    = 'round';
  }, []);

  const pt = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const s = 'touches' in e ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const c = canvasRef.current; const g = ctx(); if (!c || !g) return;
    drawing.current = true;
    const { x, y } = pt(e);
    g.beginPath(); g.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current; const g = ctx(); if (!c || !g) return;
    const { x, y } = pt(e);
    g.lineTo(x, y); g.stroke();
    hasStrokes.current = true;
  };

  const end = useCallback(() => {
    drawing.current = false;
    if (hasStrokes.current && canvasRef.current)
      onChange(canvasRef.current.toDataURL('image/png'));
  }, [onChange]);

  const clear = () => {
    const c = canvasRef.current; const g = ctx(); if (!c || !g) return;
    const dpr = window.devicePixelRatio || 1;
    g.clearRect(0, 0, c.width / dpr, c.height / dpr);
    hasStrokes.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-zinc-300 rounded-xl bg-white overflow-hidden" style={{ height: 130 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
        />
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-zinc-300 pointer-events-none select-none">
          Draw your signature above
        </p>
      </div>
      <button type="button" onClick={clear}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-rose-500 transition">
        <Eraser className="h-3.5 w-3.5" /> Clear signature
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Lease Prep Form (Step 1 — Owner fills in dates & template)
// ─────────────────────────────────────────────────────────────────────────────

interface LeasePrepProps {
  config: LeaseConfig;
  onChange: (key: keyof LeaseConfig, value: string) => void;
  onGenerate: () => void;
}

const LeasePrepForm: React.FC<LeasePrepProps> = ({ config, onChange, onGenerate }) => {
  // Derive month count from dates
  const months = (() => {
    if (!config.startDate || !config.endDate) return 0;
    const s = new Date(config.startDate);
    const e = new Date(config.endDate);
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const preview = config.tenantName && config.propertyTitle && config.startDate && config.endDate
    ? `Landlord agrees to lease the property "${config.propertyTitle}" to ${config.tenantName} for ` +
      `${months} month${months !== 1 ? 's' : ''} commencing on ${new Date(config.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ` +
      `and concluding on ${new Date(config.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. ` +
      `Monthly rental consideration: $${config.monthlyRent.toLocaleString()} USD, payable on the 1st of each calendar month. ` +
      `This agreement is governed by the "${config.template}" template and shall be enforceable upon execution by both parties.`
    : 'Complete all fields on the left to generate the contract preview…';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Left: Config form ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarRange className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-bold text-zinc-900">Contract Configuration</h3>
        </div>

        {/* Read-only fields */}
        {[
          { label: 'Tenant Name',    value: config.tenantName,    key: 'tenantName'    },
          { label: 'Property Title', value: config.propertyTitle, key: 'propertyTitle' },
        ].map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">{f.label}</label>
            <input
              readOnly value={f.value}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 text-zinc-500 cursor-not-allowed"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Base Monthly Rent (USD)</label>
          <input
            readOnly value={`$${config.monthlyRent.toLocaleString()}`}
            className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 text-zinc-500 cursor-not-allowed"
          />
        </div>

        {/* Editable date pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Lease Start Date <span className="text-rose-400">*</span></label>
            <input
              type="date"
              value={config.startDate}
              onChange={e => onChange('startDate', e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Lease End Date <span className="text-rose-400">*</span></label>
            <input
              type="date"
              value={config.endDate}
              onChange={e => onChange('endDate', e.target.value)}
              min={config.startDate}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
            />
          </div>
        </div>

        {months > 0 && (
          <p className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            ✓ Lease term: {months} months
          </p>
        )}

        {/* Template selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Lease Agreement Template <span className="text-rose-400">*</span></label>
          <select
            value={config.template}
            onChange={e => onChange('template', e.target.value)}
            className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition bg-white"
          >
            <option value="">— Select a template —</option>
            {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <button
          onClick={onGenerate}
          disabled={!config.startDate || !config.endDate || !config.template}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed
            text-white font-bold text-sm py-3.5 rounded-xl transition shadow-sm"
        >
          <FileSignature className="h-4 w-4" />
          Generate & Route to E-Sign System
        </button>
      </div>

      {/* ── Right: Live preview ── */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Contract Live Preview</h3>
          <span className="ml-auto text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">DRAFT</span>
        </div>

        {/* Contract header mock */}
        <div className="border border-zinc-700 rounded-xl p-4 mb-4 bg-zinc-800/50">
          <div className="text-center mb-4">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">RentHub — Official Lease Agreement</p>
            <div className="w-16 h-px bg-zinc-600 mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Tenant',   config.tenantName    || '—'],
              ['Property', config.propertyTitle || '—'],
              ['Rent',     config.monthlyRent ? `$${config.monthlyRent.toLocaleString()}/mo` : '—'],
              ['Term',     months > 0 ? `${months} months` : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-zinc-500">{k}: </span>
                <span className="text-zinc-200 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generated summary text */}
        <div className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <p className={`text-sm leading-relaxed ${config.tenantName ? 'text-zinc-200' : 'text-zinc-600 italic'}`}>
            {preview}
          </p>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { icon: <Lock        className="h-3 w-3" />, label: 'E-SIGN Act Compliant' },
            { icon: <ShieldCheck className="h-3 w-3" />, label: 'Tamper-Proof Audit' },
            { icon: <Fingerprint className="h-3 w-3" />, label: 'IP Timestamp Captured' },
          ].map(b => (
            <span key={b.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400">
              <span className="text-emerald-500">{b.icon}</span>{b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Signing Sheet (Step 2/3 — tenant signs via canvas or typed name)
// ─────────────────────────────────────────────────────────────────────────────

interface SigningSheetProps {
  config: LeaseConfig;
  pipelineStep: PipelineStep;
  onSign: (signatureData: string) => void;
  onReset: () => void;
}

const SigningSheet: React.FC<SigningSheetProps> = ({ config, pipelineStep, onSign, onReset }) => {
  const [signMethod,    setSignMethod]    = useState<SignMethod>('draw');
  const [typedSig,      setTypedSig]      = useState('');
  const [drawnSigUrl,   setDrawnSigUrl]   = useState<string | null>(null);
  const [agreed,        setAgreed]        = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');

  const sigReady = signMethod === 'draw' ? !!drawnSigUrl : typedSig.trim().length >= 3;

  const handleSign = async () => {
    if (!sigReady)  { setError('Please provide your signature before proceeding.'); return; }
    if (!agreed)    { setError('You must agree to the terms before signing.'); return; }
    setError('');
    setSubmitting(true);

    const sigData = signMethod === 'draw' ? drawnSigUrl! : `TYPED:${typedSig.trim()}`;

    /**
     * ──────────────────────────────────────────────────────────────
     * BACKEND EXPRESS + POSTGRESQL LOGIC (triggered on sign click)
     * ──────────────────────────────────────────────────────────────
     *
     * POST /api/esign/sign-contract
     * Body: { documentId, tenantId, tenantName, tenantEmail, signatureData, agreed }
     *
     * Step A — Update esign_documents status to 'fully_executed':
     *   UPDATE public.esign_documents
     *   SET status = 'fully_executed',
     *       signed_at = NOW(),
     *       signer_ip = $1,
     *       signer_name = $2
     *   WHERE id = $3
     *
     * Step B — Update the target property to 'rented':
     *   UPDATE public.properties
     *   SET status = 'rented'
     *   WHERE id = (SELECT property_id FROM esign_documents WHERE id = $1)
     *
     * Step C — Insert a new active lease row into public.leases:
     *   INSERT INTO public.leases
     *     (property_id, tenant_id, tenant_name, tenant_email,
     *      start_date, end_date, monthly_rent, status)
     *   VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     *
     * Both Step B and Step C run inside a single BEGIN/COMMIT transaction
     * so they either both succeed or both roll back.
     *
     * The server-side timestamp (NOW()) and IP address are ALWAYS set by the
     * server — never trusted from the client request body — ensuring the
     * audit log is tamper-proof.
     * ──────────────────────────────────────────────────────────────
     */

    // Simulate network delay for demo
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    onSign(sigData);
  };

  if (pipelineStep === 'executed') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center">
          <BadgeCheck className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-zinc-900">Lease Fully Executed</h3>
          <p className="text-zinc-500 text-sm mt-2 max-w-md">
            The contract between <span className="font-bold text-zinc-800">{config.tenantName}</span> and
            property <span className="font-bold text-zinc-800">{config.propertyTitle}</span> has been
            legally signed and stored in the immutable audit log.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { icon: <Download className="h-4 w-4" />,   label: 'Download PDF'     },
            { icon: <Share2   className="h-4 w-4" />,   label: 'Share Copy'       },
            { icon: <History  className="h-4 w-4" />,   label: 'View Audit Trail' },
          ].map(b => (
            <button key={b.label}
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition">
              {b.icon} {b.label}
            </button>
          ))}
        </div>
        <button onClick={onReset} className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 mt-2 transition">
          <RotateCcw className="h-3.5 w-3.5" /> Start new contract
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ── Left: Document viewer ── */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">

        {/* Document header */}
        <div className="px-6 py-4 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSignature className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-sm font-bold text-white">Lease Agreement — Draft</p>
              <p className="text-[11px] text-zinc-400">{config.tenantName} · {config.propertyTitle}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
            AWAITING SIGNATURE
          </span>
        </div>

        {/* Contract body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 text-sm text-zinc-700 leading-relaxed space-y-4 font-serif max-h-80">
          <p className="text-center font-bold text-zinc-900 text-base tracking-tight">RESIDENTIAL LEASE AGREEMENT</p>
          <p className="text-center text-xs text-zinc-400">RentHub Platform — Legally Binding Electronic Document</p>
          <hr className="border-zinc-100" />
          <p>This Lease Agreement ("Agreement") is entered into as of {config.startDate ? new Date(config.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '___'}, between the Landlord ("Owner") and {config.tenantName || '___'} ("Tenant").</p>
          <p><strong>1. PREMISES.</strong> Landlord hereby leases to Tenant the property known as "{config.propertyTitle || '___'}" for residential use only.</p>
          <p><strong>2. TERM.</strong> The lease term shall commence on {config.startDate || '___'} and terminate on {config.endDate || '___'}, unless earlier terminated.</p>
          <p><strong>3. RENT.</strong> Tenant shall pay ${config.monthlyRent.toLocaleString()} per month, due on the 1st day of each month via the RentHub payment portal.</p>
          <p><strong>4. SECURITY DEPOSIT.</strong> A security deposit equal to two months' rent shall be paid prior to occupancy and held in trust.</p>
          <p><strong>5. ELECTRONIC SIGNATURE.</strong> Both parties agree that an electronic signature constitutes a legally binding signature under the E-SIGN Act (15 U.S.C. § 7001). The signing timestamp, IP address, and device fingerprint are captured server-side.</p>
        </div>

        {/* Signature block */}
        <div className="px-6 py-5 border-t border-zinc-100 space-y-4 bg-zinc-50/50">
          <div className="flex items-center gap-2 mb-1">
            <PenTool className="h-4 w-4 text-indigo-600" />
            <p className="text-sm font-bold text-zinc-800">Digital Signature Block</p>
            <div className="ml-auto flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5">
              {(['draw', 'type'] as SignMethod[]).map(m => (
                <button key={m} onClick={() => setSignMethod(m)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${signMethod === m ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  {m === 'draw' ? '✍ Draw' : 'Aa Type'}
                </button>
              ))}
            </div>
          </div>

          {signMethod === 'draw' ? (
            <CanvasPad onChange={setDrawnSigUrl} />
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Type your full legal name as signature…"
                value={typedSig}
                onChange={e => setTypedSig(e.target.value)}
                style={{ fontFamily: 'cursive' }}
                className="w-full border-2 border-dashed border-zinc-300 rounded-xl px-4 py-4 text-xl text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-indigo-400 transition bg-white"
              />
              {typedSig.trim().length >= 3 && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Signature captured: "{typedSig.trim()}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Sign action panel ── */}
      <div className="lg:col-span-5 space-y-4">

        {/* Trust badges */}
        <div className="bg-zinc-900 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Security Guarantees</p>
          {[
            { icon: <Lock        className="h-4 w-4 text-emerald-400" />, label: '256-bit TLS Encryption',  sub: 'End-to-end encrypted transit' },
            { icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />, label: 'E-SIGN Act Compliant',    sub: 'Legally binding signature' },
            { icon: <Fingerprint className="h-4 w-4 text-emerald-400" />, label: 'IP & Timestamp Captured', sub: 'Immutable audit trail' },
            { icon: <BadgeCheck  className="h-4 w-4 text-emerald-400" />, label: 'Tamper-Proof Storage',    sub: 'Hash-verified document store' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="shrink-0">{b.icon}</div>
              <div>
                <p className="text-xs font-bold text-zinc-200">{b.label}</p>
                <p className="text-[10px] text-zinc-500">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contract summary */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contract Summary</p>
          {[
            ['Tenant',   config.tenantName],
            ['Property', config.propertyTitle],
            ['Rent',     `$${config.monthlyRent.toLocaleString()} / month`],
            ['Start',    config.startDate],
            ['End',      config.endDate],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-zinc-400 font-medium">{k}</span>
              <span className="font-semibold text-zinc-800">{v || '—'}</span>
            </div>
          ))}
        </div>

        {/* Agreement checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer" />
          <span className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-700 transition">
            I confirm that I am authorised to sign this document and I agree that this electronic signature
            is legally binding under the E-SIGN Act and UETA.
          </span>
        </label>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Sign CTA */}
        <button
          onClick={handleSign}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
            disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-sm py-4 rounded-2xl
            transition shadow-lg shadow-indigo-500/20"
        >
          {submitting ? (
            <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
          ) : (
            <><PenTool className="h-4 w-4" /> Legally Authorize & Sign Lease Agreement</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main ESign Page
// ─────────────────────────────────────────────────────────────────────────────

export const ESignPage: React.FC = () => {
  // Active tab: 'pipeline' = new contract flow | 'ledger' = document archive
  const [view, setView] = useState<'pipeline' | 'ledger'>('ledger');

  // Pipeline step — starts at 'generated' once owner clicks Generate
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('generated');

  // Lease configuration state
  const [leaseConfig, setLeaseConfig] = useState<LeaseConfig>({
    tenantName:    'Sarah Miller',
    propertyTitle: 'Premium Villa Room 4',
    monthlyRent:   3000,
    startDate:     '',
    endDate:       '',
    template:      '',
  });

  const handleConfigChange = (key: keyof LeaseConfig, value: string) =>
    setLeaseConfig(prev => ({ ...prev, [key]: value }));

  const handleGenerate = () => {
    setPipelineStep('awaiting');
    setView('pipeline');
  };

  const handleSign = (_sigData: string) => {
    setPipelineStep('executed');
  };

  const handleReset = () => {
    setPipelineStep('generated');
    setLeaseConfig({ tenantName: '', propertyTitle: '', monthlyRent: 0, startDate: '', endDate: '', template: '' });
    setView('ledger');
  };

  return (
    <div className="p-6 sm:p-8 bg-zinc-50 min-h-screen font-sans space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Digital Documents & E-Signatures</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage, prepare, sign, and store legal agreements.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 font-semibold text-sm transition">
            <Upload className="h-4 w-4" /> Upload PDF
          </button>
          <button
            onClick={() => { setView('pipeline'); setPipelineStep('generated'); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            <Plus className="h-4 w-4" /> New Contract
          </button>
        </div>
      </div>

      {/* ── View tabs ── */}
      <div className="inline-flex bg-white border border-zinc-200 rounded-xl p-1 gap-1">
        {[
          { id: 'ledger',   label: 'Document Archive' },
          { id: 'pipeline', label: '⚡ Contract Pipeline' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as 'pipeline' | 'ledger')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition
              ${view === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LEDGER VIEW ── */}
      {view === 'ledger' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Template quick-launch row */}
          <div className="flex flex-wrap gap-3">
            {['🏠 Residential Lease', '🏢 Office Agreement', '📦 General Waiver'].map(t => (
              <button key={t} onClick={() => setView('pipeline')}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 transition">
                {t}
              </button>
            ))}
          </div>

          {/* Status metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Needs Action',       value: '2' },
              { label: 'Out for Review',     value: '5' },
              { label: 'Completed & Secure', value: '124' },
              { label: 'Auto Reminders',     value: '3' },
            ].map(c => (
              <div key={c.label} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-xs font-semibold text-zinc-500">{c.label}</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Document ledger */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900">Document Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    {['Document', 'Recipient', 'Property', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {MOCK_DOCUMENTS.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900 text-sm">{d.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{d.recipient}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{d.property}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${DOC_STATUS_CLS[d.status]}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <button className="hover:text-indigo-600 transition" title="Download"><Download className="h-4 w-4" /></button>
                          <button className="hover:text-indigo-600 transition" title="Audit trail"><History  className="h-4 w-4" /></button>
                          <button className="hover:text-indigo-600 transition" title="Share"><Share2   className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view === 'pipeline' && (
        <div className="space-y-6 animate-fadeIn">
          <PipelineBar current={pipelineStep} />

          {pipelineStep === 'generated' && (
            <LeasePrepForm config={leaseConfig} onChange={handleConfigChange} onGenerate={handleGenerate} />
          )}

          {(pipelineStep === 'awaiting' || pipelineStep === 'executed') && (
            <SigningSheet
              config={leaseConfig}
              pipelineStep={pipelineStep}
              onSign={handleSign}
              onReset={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
};
