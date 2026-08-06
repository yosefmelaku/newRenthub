import React, { useState, useEffect } from 'react';
import { PlusCircle, Wrench, Clock, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

// --- Types ---
type Status = 'NEW' | 'IN_PROGRESS' | 'COMPLETED';

interface MaintenanceRequest {
  id: string;
  title: string;
  property: string;
  status: Status;
  description: string;
  viewableBy: string;
  createdAt: string;
}

export const MaintenancePage: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newReq, setNewReq] = useState({ title: '', property: '', description: '', viewableBy: 'Tenants' });

  // Use the new API URL, assume proxy or absolute URL depending on setup.
  // Assuming our Express backend runs on http://localhost:3001 for now
  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/maintenance`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Error fetching requests:', e);
    }
  };

  const handleSave = async () => {
    if (!newReq.title || !newReq.description) return;
    try {
      const response = await fetch(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq)
      });
      if (response.ok) {
        setShowModal(false);
        setNewReq({ title: '', property: '', description: '', viewableBy: 'Tenants' });
        fetchRequests(); // Refresh the list
      }
    } catch (e) {
      console.error('Error adding request:', e);
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    try {
      const response = await fetch(`${API_URL}/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchRequests(); // Refresh the list
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const renderCol = (status: Status, title: string, icon: React.ReactNode) => (
    <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200 shadow-sm min-h-[400px]">
      <div className="flex items-center gap-2 mb-4 font-bold text-zinc-900">
        {icon} {title}
      </div>
      <div className="space-y-3">
        {requests.filter(r => r.status === status).map(r => (
          <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 space-y-3">
            <h4 className="font-bold">{r.title}</h4>
            <p className="text-sm text-zinc-500">{r.property}</p>
            <div className="flex gap-2 justify-end pt-2">
                {status === 'NEW' && <button onClick={() => updateStatus(r.id, 'IN_PROGRESS')} className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded">Start</button>}
                {status === 'IN_PROGRESS' && (
                    <>
                        <button onClick={() => updateStatus(r.id, 'NEW')} className="text-xs font-semibold bg-zinc-100 text-zinc-800 px-2 py-1 rounded"><ChevronLeft className="w-3 h-3"/></button>
                        <button onClick={() => updateStatus(r.id, 'COMPLETED')} className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Complete</button>
                    </>
                )}
                {status === 'COMPLETED' && <button onClick={() => updateStatus(r.id, 'IN_PROGRESS')} className="text-xs font-semibold bg-zinc-100 text-zinc-800 px-2 py-1 rounded"><ChevronLeft className="w-3 h-3"/></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fadeIn bg-zinc-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-zinc-900">Maintenance</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700" onClick={() => setShowModal(true)}>
          <PlusCircle className="h-4 w-4" /> New request
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCol('NEW', 'NEW', <Wrench className="h-5 w-5 text-indigo-600" />)}
        {renderCol('IN_PROGRESS', 'IN PROGRESS', <Clock className="h-5 w-5 text-orange-500" />)}
        {renderCol('COMPLETED', 'COMPLETED', <CheckCircle2 className="h-5 w-5 text-emerald-600" />)}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-6">New Maintenance Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Title" className="w-full border p-3 rounded-lg" value={newReq.title} onChange={e => setNewReq({...newReq, title: e.target.value})} />
              <input type="text" placeholder="Property" className="w-full border p-3 rounded-lg" value={newReq.property} onChange={e => setNewReq({...newReq, property: e.target.value})} />
              <textarea placeholder="Description" className="w-full border p-3 rounded-lg" value={newReq.description} onChange={e => setNewReq({...newReq, description: e.target.value})}></textarea>
              <button 
                className={`w-full p-3 rounded-lg font-semibold ${
                  newReq.title.trim() && newReq.description.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                }`}
                onClick={handleSave}
                disabled={!newReq.title.trim() || !newReq.description.trim()}
              >
                Save
              </button>
              <button className="w-full bg-zinc-100 p-3 rounded-lg font-semibold" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
