import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  ShieldCheck, 
  ChevronDown,
  Calendar,
  Check,
  X,
  Eye,
  Receipt
} from 'lucide-react';

// --- Types ---
interface TaxCategory {
  name: string;
  irsCode: string;
  amount: number;
  receipts: number;
  property: string;
}

type TaxYear = '2024' | '2025' | '2026';
type PropertyFilter = 'All Properties' | 'Villa Horizon' | 'Studio C' | 'Apartment A';

// --- Mock Data ---
const allTaxData: TaxCategory[] = [
  { name: 'Rental Income', irsCode: 'IRS Schedule E Line 3', amount: 42500, receipts: 12, property: 'Villa Horizon' },
  { name: 'Repairs & Maintenance', irsCode: 'IRS Schedule E Line 14', amount: -3200, receipts: 5, property: 'Villa Horizon' },
  { name: 'Management & Platform Fees', irsCode: 'IRS Schedule E Line 12', amount: -2100, receipts: 3, property: 'All Properties' },
  { name: 'Utilities', irsCode: 'IRS Schedule E Line 9', amount: -1800, receipts: 8, property: 'Studio C' },
  { name: 'Legal & Professional Fees', irsCode: 'IRS Schedule E Line 18', amount: -500, receipts: 1, property: 'Apartment A' },
  { name: 'Rental Income', irsCode: 'IRS Schedule E Line 3', amount: 28000, receipts: 8, property: 'Studio C' },
  { name: 'Rental Income', irsCode: 'IRS Schedule E Line 3', amount: 32000, receipts: 10, property: 'Apartment A' },
  { name: 'Repairs & Maintenance', irsCode: 'IRS Schedule E Line 14', amount: -1500, receipts: 3, property: 'Studio C' },
];

const MetricCard = ({ 
  title, 
  value, 
  highlight = false,
  onClick
}: { 
  title: string, 
  value: string, 
  highlight?: boolean,
  onClick?: () => void
}) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-xl border border-zinc-200 shadow-sm ${
      highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-white'
    } ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all' : ''}`}
  >
    <h3 className="text-sm text-zinc-500 font-medium">{title}</h3>
    <p className={`text-2xl font-bold mt-2 ${highlight ? 'text-indigo-900' : 'text-zinc-900'}`}>{value}</p>
    {onClick && (
      <p className="text-xs text-indigo-600 mt-2 font-medium">Click to view details →</p>
    )}
  </div>
);

export const TaxReportingPage: React.FC = () => {
  const [taxYear, setTaxYear] = useState<TaxYear>('2026');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('All Properties');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaxCategory | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const yearOptions: TaxYear[] = ['2024', '2025', '2026'];
  const propertyOptions: PropertyFilter[] = ['All Properties', 'Villa Horizon', 'Studio C', 'Apartment A'];

  // Filter tax data
  const filteredTaxData = useMemo(() => {
    let filtered = allTaxData;
    
    if (propertyFilter !== 'All Properties') {
      filtered = filtered.filter(item => 
        item.property === propertyFilter || item.property === 'All Properties'
      );
    }
    
    return filtered;
  }, [propertyFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const income = filteredTaxData
      .filter(item => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);
    
    const deductions = filteredTaxData
      .filter(item => item.amount < 0)
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    
    const platformFees = filteredTaxData
      .filter(item => item.name === 'Management & Platform Fees')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    
    const netIncome = income - deductions;

    return {
      grossIncome: income,
      deductions,
      netIncome,
      platformFees,
    };
  }, [filteredTaxData]);

  const downloadPDF = () => {
    alert(`Downloading Tax Summary PDF for ${taxYear}...\nThis will include all ${filteredTaxData.length} categories.`);
  };
  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Tax Center & Reporting</h1>
          <p className="text-zinc-500 mt-1">Organize your rental tax schedules for 2026.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
            <Download className="h-4 w-4" /> Download Tax Summary PDF
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium transition-colors">
            <ShieldCheck className="h-4 w-4" /> Invite Accountant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        {/* Tax Year Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowPropertyDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <Calendar className="h-4 w-4" /> Tax Year: {taxYear} <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          {showYearDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              {yearOptions.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    setTaxYear(year);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-zinc-50 flex items-center justify-between ${
                    taxYear === year ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  <span>{year}</span>
                  {taxYear === year && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Filter Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowPropertyDropdown(!showPropertyDropdown);
              setShowYearDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <FileText className="h-4 w-4" /> {propertyFilter} <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          {showPropertyDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              {propertyOptions.map(property => (
                <button
                  key={property}
                  onClick={() => {
                    setPropertyFilter(property);
                    setShowPropertyDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-zinc-50 flex items-center justify-between ${
                    propertyFilter === property ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  <span>{property}</span>
                  {propertyFilter === property && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {propertyFilter !== 'All Properties' && (
          <span className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
            {filteredTaxData.length} categories found
          </span>
        )}
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Gross Taxable Income" 
          value={`$${metrics.grossIncome.toLocaleString()}`}
          onClick={() => setSelectedMetric('Gross Income')}
        />
        <MetricCard 
          title="Total Deductions Logged" 
          value={`-$${metrics.deductions.toLocaleString()}`}
          highlight={true}
          onClick={() => setSelectedMetric('Deductions')}
        />
        <MetricCard 
          title="Net Taxable Income" 
          value={`$${metrics.netIncome.toLocaleString()}`}
          onClick={() => setSelectedMetric('Net Income')}
        />
        <MetricCard 
          title="Platform Fees" 
          value={`-$${metrics.platformFees.toLocaleString()}`}
          onClick={() => setSelectedMetric('Platform Fees')}
        />
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
            {filteredTaxData.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">{item.name}</td>
                <td className="px-6 py-4 text-zinc-500 text-sm">{item.irsCode}</td>
                <td className={`px-6 py-4 font-bold ${item.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  ${Math.abs(item.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedCategory(item)}
                    className="text-indigo-600 font-medium text-sm hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
                    <Eye className="h-4 w-4" />
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
          { title: `Profit & Loss Statement (${taxYear}).pdf`, icon: FileText },
          { title: 'Commission Invoice Ledger.csv', icon: FileText },
          { title: 'Expense Receipts Archive.zip', icon: Calculator },
        ].map((doc, idx) => (
          <div 
            key={idx} 
            onClick={() => alert(`Downloading: ${doc.title}`)}
            className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <doc.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-700 block">{doc.title}</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Click to download</span>
            </div>
            <Download className="h-5 w-5 text-zinc-400" />
          </div>
        ))}
      </div>

      {/* Receipts Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedCategory.name}</h2>
                <p className="text-sm text-zinc-500 mt-1">{selectedCategory.irsCode}</p>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {Array.from({ length: selectedCategory.receipts }, (_, i) => (
                  <div key={i} className="bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-zinc-200">
                        <Receipt className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">Receipt #{i + 1}</p>
                        <p className="text-sm text-zinc-500">July {28 - i}, {taxYear}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Downloading receipt #${i + 1}`)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1.5">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Accountant Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
              <X className="h-6 w-6" />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-50 rounded-full mb-4">
                <ShieldCheck className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Invite Your Accountant</h2>
              <p className="text-zinc-500 mt-2">Share read-only access to your tax documents</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Accountant Email</label>
                <input 
                  type="email" 
                  placeholder="accountant@example.com"
                  className="w-full p-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Message (Optional)</label>
                <textarea 
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full p-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedMetric}</h2>
                <p className="text-sm text-zinc-500 mt-1">Breakdown for {taxYear}</p>
              </div>
              <button onClick={() => setSelectedMetric(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredTaxData
                  .filter(item => {
                    if (selectedMetric === 'Gross Income') return item.amount > 0;
                    if (selectedMetric === 'Deductions') return item.amount < 0;
                    if (selectedMetric === 'Platform Fees') return item.name === 'Management & Platform Fees';
                    return true;
                  })
                  .map((item, idx) => (
                    <div key={idx} className="bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          <p className="text-sm text-zinc-500 mt-1">{item.irsCode}</p>
                          <p className="text-xs text-zinc-400 mt-1">{item.property}</p>
                        </div>
                        <p className={`text-xl font-bold ${item.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          ${Math.abs(item.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <button
                onClick={() => setSelectedMetric(null)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
