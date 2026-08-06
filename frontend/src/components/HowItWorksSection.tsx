import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building, FileText, Zap, Search, Key, Smartphone } from 'lucide-react';

const ownerSteps = [
  { title: "Add & Segment Inventory", description: "List your assets with ease, categorizing them as Commercial Offices, Residential Villas, or Compact Studios.", icon: Building, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800" },
  { title: "Automate Tenant Intake", description: "Utilize our automated screening, online lease generation, and instant background checks.", icon: FileText, img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" },
  { title: "Autopilot Management", description: "Enjoy hands-free operations with automated rent collection, late fees, and vendor dispatching.", icon: Zap, img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" },
];

const tenantSteps = [
  { title: "Discover & Apply", description: "Search verified listings, book tours, and submit rental applications securely.", icon: Search, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800" },
  { title: "Sign & Move In", description: "Easily sign digital leases and securely pay security deposits.", icon: Key, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800" },
  { title: "Portal Experience", description: "Manage everything: set up recurring payments, view documents, and report maintenance issues.", icon: Smartphone, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800" },
];

export const HowItWorksSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'owner' | 'tenant'>('owner');
  const steps = activeTab === 'owner' ? ownerSteps : tenantSteps;

  return (
    <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto" id="how-it-works-section">
      <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How it works</h2>
      <div className="flex justify-center mb-16">
        <div className="inline-flex bg-white rounded-full p-1 border shadow-sm">
            <button onClick={() => setActiveTab('owner')} className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === 'owner' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>For Property Owners</button>
            <button onClick={() => setActiveTab('tenant')} className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === 'tenant' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>For Tenants</button>
        </div>
      </div>

      <div className="space-y-16">
        {steps.map((step, idx) => (
            <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`grid md:grid-cols-2 gap-12 items-center ${idx % 2 !== 0 ? 'md:grid-flow-col-dense' : ''}`}
            >
                <div className={`${idx % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                    <div className="text-5xl font-extrabold text-emerald-200 mb-4">0{idx + 1}</div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">{step.title}</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">{step.description}</p>
                </div>
                <div className={`${idx % 2 !== 0 ? 'md:col-start-1' : ''}`}>
                    <img src={step.img} alt={step.title} className="w-full h-80 object-cover rounded-3xl shadow-xl" />
                </div>
            </motion.div>
        ))}
      </div>
    </section>
  );
};
