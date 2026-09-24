import React, { useState, useMemo } from 'react';
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
  X,
  Check
} from 'lucide-react';

// --- Types ---
type TransactionStatus = 'Success' | 'Pending' | 'Refunded';
type TransactionCategory = 'Rental Income' | 'Maintenance Expense' | 'Security Deposit';
type DateFilter = 'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days' | 'This Year' | 'All Time';
type ListingFilter = 'All Listings' | 'Villa Horizon' | 'Studio C' | 'Apartment A';

interface Transaction {
  id: string;
  date: string;
  dateTimestamp: number; // Added for filtering
  description: string;
  listing: string; // Added for filtering
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
}

// --- Mock Data ---
const transactions: Transaction[] = [
  { id: '1', date: 'July 28, 2026', dateTimestamp: new Date('2026-07-28').getTime(), description: 'Monthly Rent - Villa Horizon', listing: 'Villa Horizon', category: 'Rental Income', amount: 3500, status: 'Success' },
  { id: '2', date: 'July 25, 2026', dateTimestamp: new Date('2026-07-25').getTime(), description: 'Repair - Studio C Lock replacement', listing: 'Studio C', category: 'Maintenance Expense', amount: -150, status: 'Success' },
  { id: '3', date: 'July 20, 2026', dateTimestamp: new Date('2026-07-20').getTime(), description: 'Security Deposit - Apartment A', listing: 'Apartment A', category: 'Security Deposit', amount: 1200, status: 'Pending' },
  { id: '4', date: 'July 15, 2026', dateTimestamp: new Date('2026-07-15').getTime(), description: 'Monthly Rent - Villa Horizon', listing: 'Villa Horizon', category: 'Rental Income', amount: 3500, status: 'Success' },
  { id: '5', date: 'July 10, 2026', dateTimestamp: new Date('2026-07-10').getTime(), description: 'Maintenance - Studio C', listing: 'Studio C', category: 'Maintenance Expense', amount: -250, status: 'Success' },
  { id: '6', date: 'June 28, 2026', dateTimestamp: new Date('2026-06-28').getTime(), description: 'Monthly Rent - Apartment A', listing: 'Apartment A', category: 'Rental Income', amount: 2800, status: 'Success' },
];

// --- Components ---

const MetricCard = ({ 
  title, 
  value, 
  growth, 
  icon: Icon,
  onClick 
}: { 
  title: string, 
  value: string, 
  growth?: string, 
  icon: any,
  onClick?: () => void 
}) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-zinc-200 shadow-sm ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all' : ''
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      {growth && <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{growth}</span>}
    </div>
    <h3 className="text-sm text-zinc-500 font-medium">{title}</h3>
    <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
    {onClick && (
      <p className="text-xs text-indigo-600 mt-2 font-medium">Click to view details →</p>
    )}
  </div>
);

export const AccountingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionRows, setTransactionRows] = useState<Transaction[]>(transactions);
  const [dateFilter, setDateFilter] = useState<DateFilter>('Last 30 Days');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('All Listings');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showListingDropdown, setShowListingDropdown] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    const now = new Date().getTime();
    let filtered = transactionRows;

    // Date filter
    if (dateFilter !== 'All Time') {
      const daysMap: Record<DateFilter, number> = {
        'Last 7 Days': 7,
        'Last 30 Days': 30,
        'Last 90 Days': 90,
        'This Year': 365,
        'All Time': Infinity,
      };
      const days = daysMap[dateFilter];
      const cutoffDate = now - (days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => t.dateTimestamp >= cutoffDate);
    }

    // Listing filter
    if (listingFilter !== 'All Listings') {
      filtered = filtered.filter(t => t.listing === listingFilter);
    }

    return filtered;
  }, [dateFilter, listingFilter, transactionRows]);

  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const netEarnings = income - expenses;
    const platformFees = income * 0.1; // 10% platform fee
    const escrow = filteredTransactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      netEarnings,
      grossRevenue: income,
      platformFees,
      escrow,
    };
  }, [filteredTransactions]);

  const dateOptions: DateFilter[] = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year', 'All Time'];
  const listingOptions: ListingFilter[] = ['All Listings', 'Villa Horizon', 'Studio C', 'Apartment A'];

  // Export CSV functionality
  const handleExportCSV = () => {
    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    // Prepare CSV header
    const headers = ['Date', 'Description', 'Listing', 'Category', 'Amount', 'Status'];
    
    // Prepare CSV rows from filtered transactions
    const rows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.listing,
      t.category,
      t.amount > 0 ? `+$${t.amount}` : `-$${Math.abs(t.amount)}`,
      t.status
    ]);
    
    // Add summary rows
    const summaryRows = [
      [],
      ['Summary'],
      ['Gross Revenue', '', '', '', `$${metrics.grossRevenue}`, ''],
      ['Net Earnings', '', '', '', `$${metrics.netEarnings}`, ''],
      ['Platform Fees', '', '', '', `$${metrics.platformFees.toFixed(0)}`, ''],
      ['Held in Escrow', '', '', '', `$${metrics.escrow}`, ''],
      [],
      ['Filters Applied'],
      ['Date Range', dateFilter, '', '', '', ''],
      ['Listing', listingFilter, '', '', '', ''],
    ];
    
    // Combine headers, rows, and summary
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...summaryRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `accounting-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveTransaction = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(transactionAmount);
    if (!transactionDescription.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const today = new Date();
    const signedAmount = transactionType === 'expense' ? -amount : amount;
    setTransactionRows(prev => [{
      id: `local-${Date.now()}`,
      date: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dateTimestamp: today.getTime(),
      description: transactionDescription.trim(),
      listing: 'Manual Entry',
      category: transactionType === 'expense' ? 'Maintenance Expense' : 'Rental Income',
      amount: signedAmount,
      status: 'Success',
    }, ...prev]);

    setIsModalOpen(false);
    setTransactionDescription('');
    setTransactionAmount('');
    setTransactionType('income');
  };

  // Get transactions for specific metric
  const getMetricTransactions = (metricType: string) => {
    switch (metricType) {
      case 'Net Earnings':
        return filteredTransactions;
      case 'Gross Revenue':
        return filteredTransactions.filter(t => t.amount > 0);
      case 'Platform Fees':
        return filteredTransactions.filter(t => t.amount > 0).map(t => ({
          ...t,
          amount: t.amount * 0.1,
          description: `Platform Fee - ${t.description}`,
        }));
      case 'Held in Escrow':
        return filteredTransactions.filter(t => t.status === 'Pending');
      default:
        return [];
    }
  };

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Financial Analytics & Accounting</h1>
          <p className="text-zinc-500 mt-1">Track your income, expenses, and escrow activity.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
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
        {/* Date Filter Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowDateDropdown(!showDateDropdown);
              setShowListingDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <Calendar className="h-4 w-4" /> {dateFilter} <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          {showDateDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              {dateOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setDateFilter(option);
                    setShowDateDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-zinc-50 flex items-center justify-between ${
                    dateFilter === option ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  <span>{option}</span>
                  {dateFilter === option && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Listing Filter Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowListingDropdown(!showListingDropdown);
              setShowDateDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <Filter className="h-4 w-4" /> {listingFilter} <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          {showListingDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              {listingOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setListingFilter(option);
                    setShowListingDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-zinc-50 flex items-center justify-between ${
                    listingFilter === option ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  <span>{option}</span>
                  {listingFilter === option && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filters indicator */}
        {(dateFilter !== 'Last 30 Days' || listingFilter !== 'All Listings') && (
          <span className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Net Earnings" 
          value={`$${metrics.netEarnings.toLocaleString()}`} 
          growth="+12%" 
          icon={ArrowUpRight}
          onClick={() => setSelectedMetric('Net Earnings')}
        />
        <MetricCard 
          title="Gross Revenue" 
          value={`$${metrics.grossRevenue.toLocaleString()}`} 
          icon={ArrowDownLeft}
          onClick={() => setSelectedMetric('Gross Revenue')}
        />
        <MetricCard 
          title="Platform Fees" 
          value={`$${metrics.platformFees.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
          icon={FileText}
          onClick={() => setSelectedMetric('Platform Fees')}
        />
        <MetricCard 
          title="Held in Escrow" 
          value={`$${metrics.escrow.toLocaleString()}`} 
          icon={FileText}
          onClick={() => setSelectedMetric('Held in Escrow')}
        />
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
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  <Filter className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                  <p className="font-semibold">No transactions found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-zinc-600">{t.date}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.category === 'Rental Income' ? 'bg-emerald-100 text-emerald-800' : t.category === 'Maintenance Expense' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.status === 'Success' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-zinc-100 text-zinc-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => alert(`Download receipt for transaction ${t.id}`)}
                      className="hover:bg-zinc-100 p-1.5 rounded transition-colors"
                      title="Download receipt"
                    >
                      <Download className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Add Transaction</h2>
              <form className="space-y-4" onSubmit={handleSaveTransaction}>
              <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    className={`flex-1 py-2 rounded-lg font-medium ${transactionType === 'income' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >Income</button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    className={`flex-1 py-2 rounded-lg font-medium ${transactionType === 'expense' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >Expense</button>
              </div>
                <input
                  required
                  type="text"
                  value={transactionDescription}
                  onChange={event => setTransactionDescription(event.target.value)}
                  placeholder="Description"
                  className="w-full p-3 border border-zinc-200 rounded-lg"
                />
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={transactionAmount}
                  onChange={event => setTransactionAmount(event.target.value)}
                  placeholder="Amount"
                  className="w-full p-3 border border-zinc-200 rounded-lg"
                />
              <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center text-zinc-500">
                <UploadCloud className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                Drag & drop receipt here
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">Save Transaction</button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">{selectedMetric}</h2>
                <p className="text-sm text-zinc-500 mt-1">Detailed breakdown for {dateFilter.toLowerCase()}</p>
              </div>
              <button onClick={() => setSelectedMetric(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {getMetricTransactions(selectedMetric).length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                  <p className="text-zinc-500 font-semibold">No transactions found</p>
                  <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getMetricTransactions(selectedMetric).map((t, idx) => (
                    <div key={`${t.id}-${idx}`} className="bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-zinc-900">{t.description}</p>
                          <p className="text-sm text-zinc-500 mt-1">{t.date}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.category === 'Rental Income' ? 'bg-emerald-100 text-emerald-800' :
                              t.category === 'Maintenance Expense' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {t.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.status === 'Success' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-zinc-100 text-zinc-800'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                            {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">
                  {getMetricTransactions(selectedMetric).length} transaction{getMetricTransactions(selectedMetric).length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
