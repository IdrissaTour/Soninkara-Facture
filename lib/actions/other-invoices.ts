'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { AutresInvoice, InvoiceStatus } from '@/lib/types';
import { withTimeout } from './db';

function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Memory store fallback for demo mode
const mockAutresInvoices: AutresInvoice[] = [];

export async function getAutresInvoices(): Promise<AutresInvoice[]> {
  if (!isSupabaseConfigured()) {
    return mockAutresInvoices;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockAutresInvoices;

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!company) return mockAutresInvoices;

    const { data, error } = await supabase
      .from('factures_autres')
      .select(`
        *,
        client:clients(*),
        compteur:compteurs(*)
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      // Try fallback without compteur join in case of schema discrepancy
      const fallback = await supabase
        .from('factures_autres')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (fallback.data) {
        return fallback.data as unknown as AutresInvoice[];
      }
      return mockAutresInvoices;
    }

    return data as unknown as AutresInvoice[];
  } catch (err) {
    console.error('Error in getAutresInvoices:', err);
    return mockAutresInvoices;
  }
}

export async function getAutresInvoiceById(id: string): Promise<AutresInvoice | null> {
  const findMock = () => mockAutresInvoices.find(inv => inv.id === id) || null;

  if (!isSupabaseConfigured()) {
    return findMock();
  }

  if (id.startsWith('inv-autre-')) {
    return findMock();
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('factures_autres')
      .select(`
        *,
        client:clients(*),
        compteur:compteurs(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const fallback = await supabase
        .from('factures_autres')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (fallback.data) {
        return fallback.data as unknown as AutresInvoice;
      }
      return findMock();
    }

    return data as unknown as AutresInvoice;
  } catch (err) {
    console.error('Error in getAutresInvoiceById:', err);
    return findMock();
  }
}

export interface CreateAutresInvoiceInput {
  client_id?: string | null;
  compteur_id?: string | null;
  invoice_number: string;
  type_facture: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  ancien_index?: number | null;
  nouveau_index?: number | null;
  consommation?: number | null;
  prix_unitaire?: number | null;
  subtotal: number;
  tva: number;
  total: number;
  periode_debut?: string | null;
  periode_fin?: string | null;
  notes?: string | null;
}

export async function createAutresInvoiceAction(input: CreateAutresInvoiceInput): Promise<AutresInvoice> {
  const createMock = (): AutresInvoice => {
    const mockId = `inv-autre-${Date.now()}`;
    const newMock: AutresInvoice = {
      ...input,
      id: mockId,
      company_id: 'comp-1',
      created_at: new Date().toISOString()
    };
    mockAutresInvoices.unshift(newMock);
    return newMock;
  };

  if (!isSupabaseConfigured()) {
    return createMock();
  }

  try {
    return await withTimeout((async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return createMock();

      let { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!company) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({ name: 'Ma Société', owner_id: user.id })
          .select('id')
          .single();
        company = newCompany;
      }

      if (!company) return createMock();

      // Check client_id in Supabase if passed
      let targetClientId: string | null = input.client_id || null;
      if (targetClientId) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('id', targetClientId)
          .limit(1)
          .maybeSingle();
        if (!existingClient) {
          targetClientId = null;
        }
      }

      // Check compteur_id in Supabase if passed
      let targetCompteurId: string | null = input.compteur_id || null;
      if (targetCompteurId) {
        const { data: existingCompteur } = await supabase
          .from('compteurs')
          .select('id')
          .eq('id', targetCompteurId)
          .limit(1)
          .maybeSingle();
        if (!existingCompteur) {
          targetCompteurId = null;
        }
      }

      const { data: newInvoice, error } = await supabase
        .from('factures_autres')
        .insert({
          company_id: company.id,
          client_id: targetClientId,
          compteur_id: targetCompteurId,
          invoice_number: input.invoice_number,
          type_facture: input.type_facture,
          status: input.status,
          issue_date: input.issue_date,
          due_date: input.due_date,
          ancien_index: input.ancien_index ?? null,
          nouveau_index: input.nouveau_index ?? null,
          consommation: input.consommation ?? null,
          prix_unitaire: input.prix_unitaire ?? null,
          subtotal: input.subtotal,
          tva: input.tva,
          total: input.total,
          periode_debut: input.periode_debut || null,
          periode_fin: input.periode_fin || null,
          notes: input.notes || null,
        })
        .select(`
          *,
          client:clients(*),
          compteur:compteurs(*)
        `)
        .single();

      if (error || !newInvoice) {
        console.error('Error inserting into factures_autres:', error);
        return createMock();
      }

      try {
        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard');
      } catch (e) {
        console.warn('revalidatePath warning:', e);
      }

      return newInvoice as unknown as AutresInvoice;
    })(), 12000);
  } catch (err) {
    console.error('Error in createAutresInvoiceAction:', err);
    return createMock();
  }
}

export async function updateAutresInvoiceStatusAction(id: string, status: InvoiceStatus): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const found = mockAutresInvoices.find(inv => inv.id === id);
    if (found) found.status = status;
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('factures_autres')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating status in factures_autres:', error);
      return false;
    }

    try {
      revalidatePath('/dashboard/invoices');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  } catch (err) {
    console.error('Error in updateAutresInvoiceStatusAction:', err);
    return false;
  }
}

export async function deleteAutresInvoiceAction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const idx = mockAutresInvoices.findIndex(inv => inv.id === id);
    if (idx !== -1) mockAutresInvoices.splice(idx, 1);
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('factures_autres')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting from factures_autres:', error);
      return false;
    }

    try {
      revalidatePath('/dashboard/invoices');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  } catch (err) {
    console.error('Error in deleteAutresInvoiceAction:', err);
    return false;
  }
}
