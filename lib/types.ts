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

export interface Expense {
  id: string;
  company_id: string;
  boutique_id?: string | null;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  created_at?: string;

  // Joined field for display
  boutique?: Boutique | null;
}

export interface CompanySummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  owner_id: string;
  created_at: string;
  client_count: number;
  invoice_count: number;
  total_invoiced: number;
  boutique_count: number;
}

export interface Boutique {
  id: string;
  company_id: string;
  nom: string;
  adresse: string | null;
  devise: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined or calculated fields
  produits_count?: number;
  low_stock_count?: number;
  total_revenue?: number;
  total_expenses?: number;
}

export interface Produit {
  id: string;
  boutique_id: string;
  nom: string;
  reference: string | null;
  prix_achat: number;
  prix_vente: number;
  quantite_stock: number;
  seuil_alerte: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MouvementType = 'entree' | 'sortie' | 'ajustement';

export interface MouvementStock {
  id: string;
  produit_id: string;
  type: MouvementType;
  quantite: number;
  motif: string | null;
  created_at?: string;

  // Joined fields
  produit?: Produit;
}

export interface Vente {
  id: string;
  boutique_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  facture_id: string | null;
  created_at?: string;

  // Joined fields
  produit?: Produit;
  boutique?: Boutique;
}

export interface BoutiqueStats {
  boutiqueId: string;
  nomBoutique: string;
  chiffreAffaires: number;
  coutAchats: number;
  totalExpenses: number;
  beneficeNet: number;
  unitesVendues: number;
  topProduits: {
    nom: string;
    quantite: number;
    ca: number;
    benefice: number;
  }[];
  monthlySales: {
    month: string;
    ca: number;
    benefice: number;
  }[];
}

export interface StockAlert {
  produitId: string;
  produitNom: string;
  boutiqueId: string;
  boutiqueNom: string;
  quantiteStock: number;
  seuilAlerte: number;
}

