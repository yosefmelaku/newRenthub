import React from 'react';
import { 
  History, 
  Share2, 
  Plus, 
  Upload, 
  Download
} from 'lucide-react';

// --- Types ---
type DocStatus = 'Executed' | 'Pending' | 'Draft' | 'Expired';

interface Document {
  id: string;
  name: string;
  recipient: string;
  property: string;
  lastActivity: string;
  status: DocStatus;
}

// --- Mock Data ---
const documents: Document[] = [
  { id: '1', name: 'Standard 12-Month Lease - Horizon House', recipient: 'Alice Smith (al***@ex.com)', property: 'Premium Villa Room 4', lastActivity: '2 hours ago', status: 'Executed' },
  { id: '2', name: 'Office Agreement Form - Suite 101', recipient: 'Bob Johnson (bo***@ex.com)', property: 'Downtown Office B', lastActivity: '1 day ago', status: 'Pending' },
  { id: '3', name: 'General Rental Waiver - Studio C', recipient: 'Charlie Davis (ch***@ex.com)', property: 'Studio C', lastActivity: '3 days ago', status: 'Draft' },
];

export const ESignPage: React.FC = () => {
  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* 1. Toolbar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Digital Documents & E-Signatures</h1>
          <p className="text-zinc-500 mt-1">Manage, sign, and store your legal agreements.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium">
            <Upload className="h-4 w-4" /> Upload Custom PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <Plus className="h-4 w-4" /> Create New Document
          </button>
        </div>
      </div>

      {/* Templates Row */}
      <div className="flex gap-3 mb-8">
        {['🏠 Residential Lease Template', '🏢 Office Agreement Form', '📦 General Rental Waiver'].map(t => (
          <button key={t} className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:border-indigo-300">
            {t}
          </button>
        ))}
      </div>

      {/* 2. Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Needs Action', value: '2' },
          { title: 'Out for Review', value: '5' },
          { title: 'Completed & Secure', value: '124' },
          { title: 'Automated Reminders', value: '3' },
        ].map(c => (
          <div key={c.title} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm text-zinc-500 font-medium">{c.title}</h3>
            <p className="text-3xl font-bold text-zinc-900 mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 3. Document Ledger */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Document Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Recipient</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Property</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {documents.map(d => (
              <tr key={d.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4 font-medium text-zinc-900">{d.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{d.recipient}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{d.property}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'Executed' ? 'bg-emerald-100 text-emerald-800' : d.status === 'Pending' ? 'bg-blue-100 text-blue-800' : d.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-zinc-100 text-zinc-800'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-zinc-500 hover:text-indigo-600"><Download className="h-4 w-4" /></button>
                  <button className="text-zinc-500 hover:text-indigo-600"><History className="h-4 w-4" /></button>
                  <button className="text-zinc-500 hover:text-indigo-600"><Share2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Signature Mock Overlay */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Signature Block Setup</h3>
        <div className="flex gap-6">
          <div className="flex-1 border-2 border-dashed border-zinc-200 rounded-lg h-64 bg-zinc-50 flex items-center justify-center text-zinc-400">
            Document Page Preview Mock
          </div>
          <div className="w-64 border border-zinc-200 rounded-lg p-4">
            <h4 className="font-semibold text-zinc-900 mb-4">Draggable Fields</h4>
            <div className="space-y-2">
              {['✍️ Signature Block', '📝 Initials Zone', '📅 Date Picker', '🔤 Text Field'].map(field => (
                <div key={field} className="p-3 bg-zinc-100 rounded border border-zinc-200 text-sm font-medium text-zinc-700 cursor-grab hover:bg-zinc-200">
                  {field}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
