import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  UserCheck, 
  Calendar, 
  CheckSquare,
  Clock,
  DollarSign,
  TrendingUp,
  Home,
  X,
  Send,
  Upload,
  User,
  MapPin,
  Phone,
  MessageSquare
} from 'lucide-react';

const API_URL = '/api';

// Types
type Severity = 'emergency' | 'medium' | 'low';
type Status = 'NEW' | 'IN_PROGRESS' | 'DISPATCHED' | 'RESOLVED';

interface WorkOrder {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  status: Status;
  propertyId: string;
  propertyName: string;
  renterName: string;
  submittedAt: string;
  description: string;
  assignedVendor?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  photoUrl?: string;
}

interface Vendor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}

const severityConfig: Record<Severity, { label: string; cls: string; icon: React.ReactNode }> = {
  emergency: { 
    label: 'Emergency', 
    cls: 'bg-rose-100 text-rose-700 border-rose-300',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  medium: { 
    label: 'Medium', 
    cls: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: <Clock className="h-3 w-3" />
  },
  low: { 
    label: 'Low', 
    cls: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: <Wrench className="h-3 w-3" />
  },
};

const statusColumns: { id: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'NEW', label: 'New Requests', icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-slate-700' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: <Clock className="h-5 w-5" />, color: 'bg-indigo-600' },
  { id: 'DISPATCHED', label: 'Dispatched', icon: <UserCheck className="h-5 w-5" />, color: 'bg-amber-600' },
  { id: 'RESOLVED', label: 'Resolved', icon: <CheckSquare className="h-5 w-5" />, color: 'bg-emerald-600' },
];

const mockVendors: Vendor[] = [
  { id: '1', name: "John's Plumbing LLC", specialty: 'Plumbing', phone: '(555) 123-4567' },
  { id: '2', name: 'Elite Electrical Services', specialty: 'Electrical', phone: '(555) 234-5678' },
  { id: '3', name: 'QuickFix HVAC', specialty: 'HVAC', phone: '(555) 345-6789' },
  { id: '4', name: 'All-Pro Handyman', specialty: 'General', phone: '(555) 456-7890' },
];

const mockOrders: WorkOrder[] = [
  {
    id: '1',
    title: 'Leaking Kitchen Sink',
    category: 'Plumbing',
    severity: 'emergency',
    status: 'NEW',
    propertyId: 'P-1042',
    propertyName: 'Sunset Villa #4B',
    renterName: 'Alex Johnson',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'Water leaking under the sink, tenant reports standing water on floor.',
    photoUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  },
  {
    id: '2',
    title: 'HVAC Not Cooling',
    category: 'HVAC',
    severity: 'medium',
    status: 'IN_PROGRESS',
    propertyId: 'P-8821',
    propertyName: 'Downtown Studio 12',
    renterName: 'Maria Garcia',
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    description: 'AC unit running but not cooling properly. Temperature staying at 78°F.',
  },
  {
    id: '3',
    title: 'Broken Outlet in Bedroom',
    category: 'Electrical',
    severity: 'low',
    status: 'DISPATCHED',
    propertyId: 'P-5501',
    propertyName: 'Oak Office Complex',
    renterName: 'David Chen',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    description: 'Outlet not working, no power to devices.',
    assignedVendor: 'Elite Electrical Services',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedCost: 150,
  },
  {
    id: '4',
    title: 'Dishwasher Door Latch Broken',
    category: 'Appliances',
    severity: 'low',
    status: 'RESOLVED',
    propertyId: 'P-1042',
    propertyName: 'Sunset Villa #4B',
    renterName: 'Sarah Williams',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Door won't stay closed during cycle.",
    assignedVendor: 'All-Pro Handyman',
    estimatedCost: 75,
  },
];

export const MaintenanceWorkOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);


  const moveOrder = (orderId: string, newStatus: Status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const ordersForColumn = (col: Status) => orders.filter(o => o.status === col);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-emerald-600" /> Maintenance Work Orders
      </h2>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusColumns.map(col => (
          <div key={col.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Column header */}
            <div className={`flex items-center gap-2 px-4 py-3 text-white text-sm font-bold ${col.color}`}>
              {col.icon}
              <span>{col.label}</span>
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {ordersForColumn(col.id).length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-3 min-h-[120px]">
              {ordersForColumn(col.id).map(order => {
                const sev = severityConfig[order.severity];
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{order.title}</p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.cls} shrink-0`}>
                        {sev.icon} {sev.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Home className="h-3 w-3" /> {order.propertyName}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="h-3 w-3" /> {order.renterName}
                    </p>
                    {order.assignedVendor && (
                      <p className="text-xs text-indigo-600 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> {order.assignedVendor}
                      </p>
                    )}
                    {/* Move buttons */}
                    <div className="flex gap-1 pt-1">
                      {col.id !== 'IN_PROGRESS' && col.id !== 'RESOLVED' && (
                        <button
                          onClick={e => { e.stopPropagation(); moveOrder(order.id, 'IN_PROGRESS'); }}
                          className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold hover:bg-indigo-200 transition"
                        >
                          Start
                        </button>
                      )}
                      {col.id === 'IN_PROGRESS' && (
                        <button
                          onClick={e => { e.stopPropagation(); moveOrder(order.id, 'DISPATCHED'); }}
                          className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold hover:bg-amber-200 transition"
                        >
                          Dispatch
                        </button>
                      )}
                      {col.id === 'DISPATCHED' && (
                        <button
                          onClick={e => { e.stopPropagation(); moveOrder(order.id, 'RESOLVED'); }}
                          className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold hover:bg-emerald-200 transition"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">{selectedOrder.title}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {selectedOrder.propertyName}</p>
              <p className="flex items-center gap-2 text-slate-600"><User className="h-4 w-4 text-slate-400" /> {selectedOrder.renterName}</p>
              {selectedOrder.assignedVendor && (
                <p className="flex items-center gap-2 text-slate-600"><UserCheck className="h-4 w-4 text-slate-400" /> {selectedOrder.assignedVendor}</p>
              )}
              {selectedOrder.estimatedCost && (
                <p className="flex items-center gap-2 text-slate-600"><DollarSign className="h-4 w-4 text-slate-400" /> ${selectedOrder.estimatedCost} estimated</p>
              )}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Description</p>
                <p className="text-slate-700">{selectedOrder.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
