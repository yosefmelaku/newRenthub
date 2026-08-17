import React, { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';

// ── Shared back bar ────────────────────────────────────────────────────────
const BackBar: React.FC<{ onBack: () => void; label?: string }> = ({
  onBack,
  label = 'Back to Home',
}) => (
  <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3">
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        {label}
      </button>
    </div>
  </div>
);

interface PricingPageProps {
  onBack?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const [units, setUnits] = useState(20);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const basePricePro = 15; // per unit/month
  const basePricePremium = 25; // per unit/month

  const calculatePrice = (base: number) => {
    let price = base * units;
    if (billing === 'annual') {
      price = price * 12 * 0.8; // 20% discount
    }
    return price / (billing === 'annual' ? 12 : 1);
  };

  const proPrice = calculatePrice(basePricePro);
  const premiumPrice = calculatePrice(basePricePremium);

  return (
    <div className="bg-slate-50 min-h-screen">
      {onBack && <BackBar onBack={onBack} label="Back to Home" />}
      <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-slate-600 text-lg mb-8">Scale from 1 to 500+ units with ease.</p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-semibold ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button 
                onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
                className="w-14 h-7 bg-emerald-600 rounded-full p-1 transition-all flex items-center justify-between"
            >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${billing === 'annual' ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-semibold ${billing === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>Annual</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">Save 20%</span>
        </div>

        <div className="max-w-xs mx-auto mb-12">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Property Units</label>
            <div className="flex items-center gap-4">
                <button onClick={() => setUnits(Math.max(1, units - 1))} className="p-2 bg-white border rounded-lg hover:bg-slate-50">-</button>
                <input type="number" value={units} onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center border p-2 rounded-lg" />
                <button onClick={() => setUnits(units + 1)} className="p-2 bg-white border rounded-lg hover:bg-slate-50">+</button>
            </div>
            <input type="range" min="1" max="500" value={units} onChange={(e) => setUnits(parseInt(e.target.value))} className="w-full mt-4" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {[
            { 
                name: 'Pro', 
                price: proPrice,
                features: ['Rental accounting', 'Digital rent collection', 'Automated invoicing', 'Standard maintenance tracking', 'Basic financial reports'],
                popular: true 
            },
            { 
                name: 'Premium', 
                price: premiumPrice,
                features: ['All Pro features', 'Schedule E tax reporting', 'Automated late fees', 'Bank feed syncing', 'Priority support', 'Unlimited E-Signs'],
                popular: false 
            }
        ].map((tier) => (
            <div key={tier.name} className={`bg-white p-8 rounded-3xl border ${tier.popular ? 'border-emerald-500 shadow-xl' : 'border-slate-200'} relative`}>
                {tier.popular && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl rounded-tr-3xl">MOST POPULAR</div>}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-4xl font-extrabold mb-6">${tier.price.toFixed(0)}<span className="text-sm text-slate-500 font-medium">/mo</span></div>
                <ul className="space-y-4 mb-8">
                    {tier.features.map(f => (
                        <li key={f} className="flex gap-3 text-slate-700"><Check className="text-emerald-500 w-5 h-5"/> {f}</li>
                    ))}
                </ul>
                <button className={`w-full font-bold p-4 rounded-xl ${tier.popular ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>Get Started</button>
            </div>
        ))}
      </div>
    </div>
    </div>
  );
};
