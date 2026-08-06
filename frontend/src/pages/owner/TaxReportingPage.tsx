import React from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  ShieldCheck, 
  ChevronDown,
  Calendar
} from 'lucide-react';

// --- Types ---
interface TaxCategory {
  name: string;
  irsCode: string;
  amount: number;
  receipts: number;
}

// --- Mock Data ---
const taxData: TaxCategory[] = [
  { name: 'Rental Income', irsCode: 'IRS Schedule E Line 3', amount: 42500, receipts: 12 },
  { name: 'Repairs & Maintenance', irsCode: 'IRS Schedule E Line 14', amount: -3200, receipts: 5 },
  { name: 'Management & Platform Fees', irsCode: 'IRS Schedule E Line 12', amount: -2100, receipts: 3 },
  { name: 'Utilities', irsCode: 'IRS Schedule E Line 9', amount: -1800, receipts: 8 },
  { name: 'Legal & Professional Fees', irsCode: 'IRS Schedule E Line 18', amount: -500, receipts: 1 },
];

const MetricCard = ({ title, value, highlight = false }: { title: string, value: string, highlight?: boolean }) => (
  <div className={`p-6 rounded-xl border border-zinc-200 shadow-sm ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-white'}`}>
    <h3 className="text-sm text-zinc-500 font-medium">{title}</h3>
    <p className={`text-2xl font-bold mt-2 ${highlight ? 'text-indigo-900' : 'text-zinc-900'}`}>{value}</p>
  </div>
);

export const TaxReportingPage: React.FC = () => {
  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Tax Center & Reporting</h1>
          <p className="text-zinc-500 mt-1">Organize your rental tax schedules for 2026.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <Download className="h-4 w-4" /> Download Tax Summary PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <ShieldCheck className="h-4 w-4" /> Invite Accountant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700">
          <Calendar className="h-4 w-4" /> Tax Year: 2026 <ChevronDown className="h-4 w-4 ml-1" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700">
          <FileText className="h-4 w-4" /> All Properties <ChevronDown className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Gross Taxable Income" value="$42,500" />
        <MetricCard title="Total Deductions Logged" value="-$7,600" highlight={true} />
        <MetricCard title="Net Taxable Income" value="$34,900" />
        <MetricCard title="Platform Fees" value="-$2,100" />
      </div>

      {/* 3. Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Category Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Tax Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Total</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {taxData.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4 font-medium text-zinc-900">{item.name}</td>
                <td className="px-6 py-4 text-zinc-500 text-sm">{item.irsCode}</td>
                <td className={`px-6 py-4 font-bold ${item.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  ${Math.abs(item.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button className="text-indigo-600 font-medium text-sm hover:text-indigo-800">
                    View {item.receipts} Linked Receipts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Profit & Loss Statement (2026).pdf', icon: FileText },
          { title: 'Commission Invoice Ledger.csv', icon: FileText },
          { title: 'Expense Receipts Archive.zip', icon: Calculator },
        ].map((doc, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors cursor-pointer">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <doc.icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-zinc-700">{doc.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
