'use server';

import { createClient } from '@/lib/supabase/server';
import { CompanySummary } from '@/lib/types';

// Helper to check if Supabase is fully configured
function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Configured list of admin emails
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || 
  'soninkaradigital@gmail.com,idrissa@example.com,amadou@example.com,toureidi321@gmail.com,entrepreneur@teranga.sn,contact@soninkaratech.sn'
)
  .split(',')
  .map((email) => email.trim().toLowerCase());

/**
 * Checks if a given email belongs to the admin group
 */
function isUserAdmin(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Direct match
  if (ADMIN_EMAILS.includes(cleanEmail)) return true;
  
  // Custom domains
  if (cleanEmail.endsWith('@soninkara.sn') || cleanEmail.endsWith('@soninkara-facture.sn')) return true;
  
  return false;
}

/**
 * Checks if the currently logged-in user is an administrator
 */
export async function checkAdminStatus(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // In mock/demo mode, we assume the user is admin for showcase purposes if they are at the dashboard
    return true;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return isUserAdmin(user.email);
  } catch {
    return false;
  }
}

/**
 * Fetches summaries of all registered companies (Admin/Developer dashboard data)
 */
export async function getCompaniesSummaryAdmin(): Promise<CompanySummary[]> {
  if (!isSupabaseConfigured()) {
    // Fallback Mock Data for demo mode
    return [
      {
        id: 'comp-1',
        name: 'Soninkara Tech Solutions',
        email: 'contact@soninkaratech.sn',
        phone: '+221 33 824 10 10',
        address: 'Point E, Avenue Cheikh Anta Diop, Dakar, Sénégal',
        owner_id: 'user-123',
        created_at: '2026-05-01T08:00:00Z',
        client_count: 5,
        invoice_count: 6,
        total_invoiced: 8500000,
      },
      {
        id: 'comp-2',
        name: 'Keur Diarra Boulangerie',
        email: 'contact@keurdiarra.sn',
        phone: '+221 77 123 45 67',
        address: 'Medina, Dakar, Sénégal',
        owner_id: 'user-456',
        created_at: '2026-06-15T10:30:00Z',
        client_count: 2,
        invoice_count: 12,
        total_invoiced: 3400000,
      },
      {
        id: 'comp-3',
        name: 'Sahel Agri S.A.R.L.',
        email: 'info@sahelagri.ml',
        phone: '+223 66 12 45 78',
        address: 'ACI 2000, Bamako, Mali',
        owner_id: 'user-789',
        created_at: '2026-07-01T14:15:00Z',
        client_count: 8,
        invoice_count: 24,
        total_invoiced: 18900000,
      },
      {
        id: 'comp-4',
        name: 'Teranga Consulting',
        email: 'contact@teranga.ci',
        phone: '+225 07 48 92 15 32',
        address: 'Cocody, Abidjan, Côte d\'Ivoire',
        owner_id: 'user-101',
        created_at: '2026-07-10T11:00:00Z',
        client_count: 4,
        invoice_count: 9,
        total_invoiced: 5200000,
      },
    ];
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isUserAdmin(user.email)) {
      throw new Error('Non autorisé : Droits administrateur requis.');
    }

    interface DbSummary {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      owner_id: string;
      created_at: string;
      client_count: number | string;
      invoice_count: number | string;
      total_invoiced: number | string;
    }

    const { data, error } = await supabase.rpc('get_companies_summary_admin');

    if (error) {
      console.error('RPC Error:', error);
      throw new Error('Erreur de base de données : ' + error.message);
    }

    const rows = (data || []) as DbSummary[];

    return rows.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      owner_id: item.owner_id,
      created_at: item.created_at,
      client_count: Number(item.client_count || 0),
      invoice_count: Number(item.invoice_count || 0),
      total_invoiced: Number(item.total_invoiced || 0),
    }));
  } catch (err) {
    console.error('Error in getCompaniesSummaryAdmin:', err);
    throw err;
  }
}

/**
 * Verifies the administrator passcode
 */
export async function verifyAdminPasscode(passcode: string): Promise<boolean> {
  const configuredPasscode = process.env.ADMIN_PASSCODE || '73089601Id@';
  return passcode === configuredPasscode;
}
