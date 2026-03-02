export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  medicalHistory?: string;
  createdAt: string;
}

export interface Dentist {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  schedule?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  dentistId: number;
  patientName?: string;
  dentistName?: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  treatment: string;
  notes?: string;
  createdAt: string;
}

export interface Treatment {
  id: number;
  name: string;
  description: string;
  duration: number;
  cost: number;
  category: string;
}

export interface Invoice {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName?: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  recentAppointments: Appointment[];
  upcomingAppointments: Appointment[];
}
