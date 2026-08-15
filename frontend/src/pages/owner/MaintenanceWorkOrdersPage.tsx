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
    description: 'Door won't stay closed during cycle.',
    assignedVendor: 'All-Pro Handyman',
    estimatedCost: 75,
  },
];

export const MaintenanceWorkOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
