import React, { useState } from 'react';
import { MoreVertical, CheckCircle, Clock, User } from 'lucide-react';

const users = {
  owners: [
    { id: '1', name: 'Vertex Realty', email: 'contact@vertex.com', status: 'Verified', details: '15 Properties' },
    { id: '2', name: 'Urban Living', email: 'info@urban.com', status: 'Pending', details: '9 Properties' },
  ],
  tenants: [
    { id: '3', name: 'John Doe', email: 'john@example.com', status: 'Paid', details: 'Unit 4B - Studio' },
    { id: '4', name: 'Jane Smith', email: 'jane@example.com', status: 'Overdue', details: 'Unit 2A - Villa' },
  ],
  staff: [
    { id: '5', name: 'Admin Alice', email: 'alice@renthub.com', status: 'Active', details: 'Super Admin' },
  ]
};

export const UserDirectory: React.FC = () => {
  const [activeTab, setActiveTab] = useState('owners');
  const currentUsers = users[activeTab as keyof typeof users] || [];
  
  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        {['owners', 'tenants', 'staff'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize px-6 py-3 font-semibold ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">User Info</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Details</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User size={16}/></div>
                        <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                            user.status === 'Verified' || user.status === 'Paid' || user.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                            {user.status === 'Verified' || user.status === 'Paid' || user.status === 'Active' ? <CheckCircle size={12}/> : <Clock size={12}/>} 
                            {user.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.details}</td>
                    <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-900"><MoreVertical size={18}/></button>
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
