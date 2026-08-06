import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Plus, 
  Filter, 
  Calendar,
  ChevronDown,
  FileText,
  UploadCloud,
  X
} from 'lucide-react';

// --- Types ---
type TransactionStatus = 'Success' | 'Pending' | 'Refunded';
type TransactionCategory = 'Rental Income' | 'Maintenance Expense' | 'Security Deposit';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
}

// --- Mock Data ---
const transactions: Transaction[] = [
  { id: '1', date: 'July 28, 2026', description: 'Monthly Rent - Villa Horizon', category: 'Rental Income', amount: 3500, status: 'Success' },
  { id: '2', date: 'July 25, 2026', description: 'Repair - Studio C Lock replacement', category: 'Maintenance Expense', amount: -150, status: 'Success' },
  { id: '3', date: 'July 20, 2026', description: 'Security Deposit - Apartment A', category: 'Security Deposit', amount: 1200, status: 'Pending' },
];

// --- Components ---

const MetricCard = ({ title, value, growth, icon: Icon }: { title: string, value: string, growth?: string, icon: any }) => (
  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      {growth && <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{growth}</span>}
    </div>
    <h3 className="text-sm text-zinc-500 font-medium">{title}</h3>
    <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
  </div>
);

export const AccountingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Financial Analytics & Accounting</h1>
          <p className="text-zinc-500 mt-1">Track your income, expenses, and escrow activity.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <Plus className="h-4 w-4" /> Add Income/Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700">
          <Calendar className="h-4 w-4" /> Last 30 Days <ChevronDown className="h-4 w-4 ml-1" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700">
          <Filter className="h-4 w-4" /> All Listings <ChevronDown className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Net Earnings" value="$12,450" growth="+12%" icon={ArrowUpRight} />
        <MetricCard title="Gross Revenue" value="$18,200" icon={ArrowDownLeft} />
        <MetricCard title="Platform Fees" value="$1,820" icon={FileText} />
        <MetricCard title="Held in Escrow" value="$3,200" icon={FileText} />
      </div>

      {/* 3. Ledger */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Description / Listing</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Category</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Amount</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transactions.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4 text-zinc-600">{t.date}</td>
                <td className="px-6 py-4 font-medium text-zinc-900">{t.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.category === 'Rental Income' ? 'bg-emerald-100 text-emerald-800' : t.category === 'Maintenance Expense' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {t.category}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  {t.amount > 0 ? '+' : ''}${Math.abs(t.amount)}
                </td>
                <td className="px-6 py-4 text-zinc-600">{t.status}</td>
                <td className="px-6 py-4 text-right"><Download className="h-5 w-5 text-zinc-400 cursor-pointer hover:text-zinc-600" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Add Transaction</h2>
            <form className="space-y-4">
              <div className="flex gap-4">
                <button type="button" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium">Income</button>
                <button type="button" className="flex-1 py-2 bg-zinc-100 text-zinc-600 rounded-lg font-medium">Expense</button>
              </div>
              <input type="text" placeholder="Description" className="w-full p-3 border border-zinc-200 rounded-lg" />
              <input type="number" placeholder="Amount" className="w-full p-3 border border-zinc-200 rounded-lg" />
              <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center text-zinc-500">
                <UploadCloud className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                Drag & drop receipt here
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">Save Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
