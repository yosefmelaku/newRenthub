import React from 'react';
import { 
  Search, 
  Users, 
  FileText, 
  Clock, 
  MoreVertical,
  Plus
} from 'lucide-react';

// --- Types ---
type ScreeningStatus = 'Under Review' | 'Screening Passed' | 'Interview Scheduled' | 'Action Required';

interface Applicant {
  id: string;
  name: string;
  email: string;
  property: string;
  appliedDate: string;
  status: ScreeningStatus;
}

// --- Mock Data ---
const applicants: Applicant[] = [
  { id: '1', name: 'Sarah Miller', email: 'sarah@example.com', property: 'Premium Villa Room 4', appliedDate: 'July 27, 2026', status: 'Screening Passed' },
  { id: '2', name: 'Mark Davis', email: 'mark@example.com', property: 'Downtown Office B', appliedDate: 'July 26, 2026', status: 'Under Review' },
  { id: '3', name: 'Elena Rodriguez', email: 'elena@example.com', property: 'Studio C', appliedDate: 'July 25, 2026', status: 'Interview Scheduled' },
];

export const FindTenantsPage: React.FC = () => {
  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Find Tenants & Tenant Screening</h1>
          <p className="text-zinc-500 mt-1">Manage rental applications and screen potential tenants.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          <Plus className="h-4 w-4" /> Post New Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Active Listings', value: '4', icon: FileText },
          { title: 'New Applications', value: '12', icon: Users },
          { title: 'Pending Screenings', value: '3', icon: Clock },
        ].map(s => (
          <div key={s.title} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm text-zinc-500 font-medium">{s.title}</h3>
              <p className="text-3xl font-bold text-zinc-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900">Recent Applications</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input type="text" placeholder="Search applicants..." className="pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Applicant</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Property</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Applied</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {applicants.map(a => (
              <tr key={a.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-900">{a.name}</div>
                  <div className="text-sm text-zinc-500">{a.email}</div>
                </td>
                <td className="px-6 py-4 text-zinc-900">{a.property}</td>
                <td className="px-6 py-4 text-zinc-600">{a.appliedDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'Screening Passed' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Under Review' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-6 py-4">
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
