import React, { useState } from 'react';
import { 
  Bell, 
  MoreVertical
} from 'lucide-react';

// --- Types ---
type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

interface Lease {
  id: string;
  tenant: string;
  email: string;
  property: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

// --- Mock Data ---
const leases: Lease[] = [
  { id: '1', tenant: 'Alice Smith', email: 'alice@example.com', property: 'Premium Villa Room 4', amount: 2400, dueDate: '1st', status: 'Paid' },
  { id: '2', tenant: 'Bob Johnson', email: 'bob@example.com', property: 'Downtown Office B', amount: 3200, dueDate: '1st', status: 'Pending' },
  { id: '3', tenant: 'Charlie Davis', email: 'charlie@example.com', property: 'Studio C', amount: 1500, dueDate: '1st', status: 'Overdue' },
];

// --- Components ---

const MetricCard = ({ title, value, color }: { title: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
    <h3 className="text-sm text-zinc-500 font-medium">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

export const RentGatewayPage: React.FC = () => {
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [lateFee, setLateFee] = useState(true);

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Header & Status */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Rent Collection & Automation</h1>
        <div className="bg-white px-6 py-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-semibold text-zinc-900">Stripe Connected</span>
          </div>
          <span className="text-zinc-500 text-sm">M&T Bank ****1234</span>
          <button className="text-indigo-600 font-medium text-sm hover:text-indigo-800">Manage Payouts</button>
        </div>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Collected This Month" value="$18,400" color="text-emerald-600" />
        <MetricCard title="Upcoming Rent" value="$6,400" color="text-zinc-600" />
        <MetricCard title="Overdue Balances" value="$1,500" color="text-red-600" />
      </div>

      {/* 3. Settings */}
      <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Automation & Late Fee Rules</h2>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-700">Enable Automated Invoicing</span>
            <input type="checkbox" checked={autoInvoice} onChange={() => setAutoInvoice(!autoInvoice)} className="h-6 w-6 rounded border-zinc-300 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input type="checkbox" checked={lateFee} onChange={() => setLateFee(!lateFee)} className="h-6 w-6 rounded border-zinc-300 text-indigo-600" />
              <span className="font-medium text-zinc-700">Enforce Late Fee Rules</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">Flat fee of $</span>
              <input type="number" defaultValue={50} className="w-20 p-2 border border-zinc-300 rounded-lg" />
              <span className="text-sm text-zinc-500">after</span>
              <input type="number" defaultValue={3} className="w-20 p-2 border border-zinc-300 rounded-lg" />
              <span className="text-sm text-zinc-500">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Tenant Info</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Property</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Rent Amount</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Due Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {leases.map(l => (
              <tr key={l.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-900">{l.tenant}</div>
                  <div className="text-sm text-zinc-500">{l.email}</div>
                </td>
                <td className="px-6 py-4 text-zinc-900">{l.property}</td>
                <td className="px-6 py-4 font-semibold text-zinc-900">${l.amount} / mo</td>
                <td className="px-6 py-4 text-zinc-600">{l.dueDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : l.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button className="text-indigo-600 hover:text-indigo-800"><Bell className="h-4 w-4" /></button>
                  <button className="text-zinc-500 hover:text-zinc-700"><MoreVertical className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
