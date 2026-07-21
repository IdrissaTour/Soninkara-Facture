import { Client, Invoice, InvoiceItem, Company, Expense, Boutique, Produit, MouvementStock, Vente } from './types';

export const mockCompany: Company = {
  id: 'comp-1',
  owner_id: 'user-123',
  name: 'Soninkara Tech Solutions',
  address: 'Point E, Avenue Cheikh Anta Diop, Dakar, Sénégal',
  phone: '+221 33 824 10 10',
  email: 'contact@soninkaratech.sn',
  logo_url: null, // We'll put a default fallback in the UI
};

export const mockClients: Client[] = [
  {
    id: 'cli-1',
    company_id: 'comp-1',
    name: 'Amadou Diallo',
    email: 'amadou.diallo@teranga-group.sn',
    phone: '+221 77 569 82 41',
    address: 'Les Almadies, Dakar, Sénégal',
  },
  {
    id: 'cli-2',
    company_id: 'comp-1',
    name: 'Fatou Kourouma',
    email: 'fatou.k@kourouma-corp.ci',
    phone: '+225 07 48 92 15 32',
    address: 'Cocody, Abidjan, Côte d\'Ivoire',
  },
  {
    id: 'cli-3',
    company_id: 'comp-1',
    name: 'Ousmane Traoré',
    email: 'o.traore@mali-import.ml',
    phone: '+223 66 12 45 78',
    address: 'ACI 2000, Bamako, Mali',
  },
  {
    id: 'cli-4',
    company_id: 'comp-1',
    name: 'Kadiatou Sow',
    email: 'kadi.sow@sow-boutique.sn',
    phone: '+221 78 123 45 67',
    address: 'Plateau, Dakar, Sénégal',
  },
  {
    id: 'cli-5',
    company_id: 'comp-1',
    name: 'Moussa Ndiaye',
    email: 'm.ndiaye@baobab-logistics.sn',
    phone: '+221 70 895 62 14',
    address: 'Mermoz, Dakar, Sénégal',
  }
];

export const mockInvoiceItems: Record<string, InvoiceItem[]> = {
  'inv-1': [
    { description: 'Création de site e-commerce Next.js', quantity: 1, unit_price: 1500000, total: 1500000 },
    { description: 'Hébergement annuel VPS Cloud', quantity: 1, unit_price: 300000, total: 300000 },
  ],
  'inv-2': [
    { description: 'Consulting Stratégie Digitale (par jour)', quantity: 5, unit_price: 150000, total: 750000 },
  ],
  'inv-3': [
    { description: 'Développement d\'application mobile Flutter', quantity: 1, unit_price: 3500000, total: 3500000 },
    { description: 'Maintenance applicative mensuelle', quantity: 3, unit_price: 250000, total: 750000 },
  ],
  'inv-4': [
    { description: 'Audit de sécurité des systèmes d\'information', quantity: 1, unit_price: 1200000, total: 1200000 },
  ],
  'inv-5': [
    { description: 'Formation d\'équipe à Supabase & Next.js', quantity: 2, unit_price: 450000, total: 900000 },
  ],
  'inv-6': [
    { description: 'Création de logo et charte graphique', quantity: 1, unit_price: 350000, total: 350000 },
  ]
};

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    company_id: 'comp-1',
    client_id: 'cli-1',
    invoice_number: 'FAC-2026-001',
    status: 'paid',
    issue_date: '2026-05-01',
    due_date: '2026-05-15',
    subtotal: 1800000,
    tva: 324000,
    total: 2124000,
    notes: 'Paiement reçu par Wave le 12 mai. Merci pour votre confiance !',
    client: mockClients[0]
  },
  {
    id: 'inv-2',
    company_id: 'comp-1',
    client_id: 'cli-2',
    invoice_number: 'FAC-2026-002',
    status: 'sent',
    issue_date: '2026-05-10',
    due_date: '2026-06-10',
    subtotal: 750000,
    tva: 135000,
    total: 885000,
    notes: 'Paiement attendu par virement bancaire ou Orange Money.',
    client: mockClients[1]
  },
  {
    id: 'inv-3',
    company_id: 'comp-1',
    client_id: 'cli-3',
    invoice_number: 'FAC-2026-003',
    status: 'overdue',
    issue_date: '2026-04-15',
    due_date: '2026-05-15',
    subtotal: 4250000,
    tva: 765000,
    total: 5015000,
    notes: 'Facture en retard. Première relance envoyée le 16 mai.',
    client: mockClients[2]
  },
  {
    id: 'inv-4',
    company_id: 'comp-1',
    client_id: 'cli-4',
    invoice_number: 'FAC-2026-004',
    status: 'draft',
    issue_date: '2026-05-20',
    due_date: '2026-06-20',
    subtotal: 1200000,
    tva: 216000,
    total: 1416000,
    notes: 'Brouillon - À envoyer après confirmation du devis.',
    client: mockClients[3]
  },
  {
    id: 'inv-5',
    company_id: 'comp-1',
    client_id: 'cli-5',
    invoice_number: 'FAC-2026-005',
    status: 'paid',
    issue_date: '2026-04-20',
    due_date: '2026-05-20',
    subtotal: 900000,
    tva: 162000,
    total: 1062000,
    notes: 'Payé par Orange Money. Reçu le 19 mai 2026.',
    client: mockClients[4]
  },
  {
    id: 'inv-6',
    company_id: 'comp-1',
    client_id: 'cli-1',
    invoice_number: 'FAC-2026-006',
    status: 'draft',
    issue_date: '2026-05-22',
    due_date: '2026-06-05',
    subtotal: 350000,
    tva: 63000,
    total: 413000,
    notes: null,
    client: mockClients[0]
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    company_id: 'comp-1',
    boutique_id: 'bout-1',
    description: 'Loyer mensuel point de vente Plateau',
    amount: 350000,
    date: '2026-05-02',
    category: 'Loyer',
    created_at: '2026-05-02T10:00:00Z'
  },
  {
    id: 'exp-2',
    company_id: 'comp-1',
    boutique_id: 'bout-1',
    description: 'Abonnement Internet Fibre Boutique',
    amount: 35000,
    date: '2026-05-05',
    category: 'Télécoms',
    created_at: '2026-05-05T11:00:00Z'
  },
  {
    id: 'exp-3',
    company_id: 'comp-1',
    boutique_id: 'bout-2',
    description: 'Achat de fournitures et sacoches Abidjan',
    amount: 15000,
    date: '2026-05-12',
    category: 'Fournitures',
    created_at: '2026-05-12T09:30:00Z'
  },
  {
    id: 'exp-4',
    company_id: 'comp-1',
    boutique_id: null,
    description: 'Serveurs AWS et hébergement Cloud SI',
    amount: 75000,
    date: '2026-05-18',
    category: 'Logiciels & Cloud',
    created_at: '2026-05-18T15:45:00Z'
  },
  {
    id: 'exp-5',
    company_id: 'comp-1',
    boutique_id: 'bout-1',
    description: 'Indemnité mensuelle vendeur Plateau',
    amount: 150000,
    date: '2026-05-25',
    category: 'Salaires',
    created_at: '2026-05-25T17:00:00Z'
  }
];

export const mockBoutiques: Boutique[] = [
  {
    id: 'bout-1',
    company_id: 'comp-1',
    nom: 'Soninkara Express - Dakar Plateau',
    adresse: 'Rue Pinet Laprade x Felix Faure, Dakar',
    devise: 'FCFA',
    created_at: '2026-01-15T09:00:00Z'
  },
  {
    id: 'bout-2',
    company_id: 'comp-1',
    nom: 'Soninkara Tech - Abidjan Mall',
    adresse: 'Cocody Riviera 3, Abidjan',
    devise: 'FCFA',
    created_at: '2026-02-01T10:00:00Z'
  }
];

export const mockProduits: Produit[] = [
  {
    id: 'prod-1',
    boutique_id: 'bout-1',
    nom: 'Routeur Wi-Fi 4G LTE High-Speed',
    reference: 'RT-4G-001',
    prix_achat: 18000,
    prix_vente: 32000,
    quantite_stock: 3, // Low stock below threshold 5
    seuil_alerte: 5,
    image_url: null,
    created_at: '2026-01-16T10:00:00Z'
  },
  {
    id: 'prod-2',
    boutique_id: 'bout-1',
    nom: 'Câble Ethernet Cat6 15m Pro',
    reference: 'CAB-CAT6-15M',
    prix_achat: 3500,
    prix_vente: 8500,
    quantite_stock: 24,
    seuil_alerte: 8,
    image_url: null,
    created_at: '2026-01-16T11:00:00Z'
  },
  {
    id: 'prod-3',
    boutique_id: 'bout-1',
    nom: 'Onduleur Line-Interactive 850VA',
    reference: 'UPS-850-PRO',
    prix_achat: 38000,
    prix_vente: 65000,
    quantite_stock: 2, // Low stock below threshold 5
    seuil_alerte: 5,
    image_url: null,
    created_at: '2026-01-20T14:00:00Z'
  },
  {
    id: 'prod-4',
    boutique_id: 'bout-1',
    nom: 'Clé USB 128GB SanDisk Ultra',
    reference: 'USB-128-SD',
    prix_achat: 6000,
    prix_vente: 12500,
    quantite_stock: 45,
    seuil_alerte: 10,
    image_url: null,
    created_at: '2026-02-05T08:30:00Z'
  },
  {
    id: 'prod-5',
    boutique_id: 'bout-2',
    nom: 'Ecran LED 24 pouces Full HD',
    reference: 'DISP-24-FHD',
    prix_achat: 62000,
    prix_vente: 95000,
    quantite_stock: 12,
    seuil_alerte: 4,
    image_url: null,
    created_at: '2026-02-02T12:00:00Z'
  },
  {
    id: 'prod-6',
    boutique_id: 'bout-2',
    nom: 'Clavier Mécanique Sans Fil RGB',
    reference: 'KB-MECH-RGB',
    prix_achat: 25000,
    prix_vente: 45000,
    quantite_stock: 1, // Low stock below threshold 3
    seuil_alerte: 3,
    image_url: null,
    created_at: '2026-02-02T13:15:00Z'
  }
];

export const mockMouvementsStock: MouvementStock[] = [
  {
    id: 'mvt-1',
    produit_id: 'prod-1',
    type: 'entree',
    quantite: 15,
    motif: 'Stock initial réapprovisionnement',
    created_at: '2026-01-16T10:05:00Z'
  },
  {
    id: 'mvt-2',
    produit_id: 'prod-1',
    type: 'sortie',
    quantite: 12,
    motif: 'Vente #vent-1',
    created_at: '2026-05-10T11:20:00Z'
  },
  {
    id: 'mvt-3',
    produit_id: 'prod-3',
    type: 'entree',
    quantite: 10,
    motif: 'Livraison fournisseur IT-Import',
    created_at: '2026-01-20T14:30:00Z'
  },
  {
    id: 'mvt-4',
    produit_id: 'prod-3',
    type: 'sortie',
    quantite: 8,
    motif: 'Vente #vent-2',
    created_at: '2026-05-15T15:45:00Z'
  }
];

export const mockVentes: Vente[] = [
  {
    id: 'vent-1',
    boutique_id: 'bout-1',
    produit_id: 'prod-1',
    quantite: 4,
    prix_unitaire: 32000,
    facture_id: 'inv-1',
    created_at: '2026-05-02T10:15:00Z'
  },
  {
    id: 'vent-2',
    boutique_id: 'bout-1',
    produit_id: 'prod-3',
    quantite: 2,
    prix_unitaire: 65000,
    facture_id: null,
    created_at: '2026-05-11T14:20:00Z'
  },
  {
    id: 'vent-3',
    boutique_id: 'bout-1',
    produit_id: 'prod-4',
    quantite: 10,
    prix_unitaire: 12500,
    facture_id: 'inv-2',
    created_at: '2026-05-18T09:30:00Z'
  },
  {
    id: 'vent-4',
    boutique_id: 'bout-2',
    produit_id: 'prod-5',
    quantite: 3,
    prix_unitaire: 95000,
    facture_id: null,
    created_at: '2026-05-19T16:10:00Z'
  }
];

