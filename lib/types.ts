export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at?: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tva: number; // 18%
  total: number;
  notes: string | null;
  created_at?: string;
  
  // Joined fields for display
  client?: Client;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface DashboardStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
}
