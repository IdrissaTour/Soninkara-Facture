'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { mockCompteurs, mockReleves, mockTarifs, mockClients } from '@/lib/mock-data';
import { Compteur, CompteurType, Releve, Tarif, Invoice, InvoiceItem } from '@/lib/types';
import { createInvoiceAction, getCompany } from './db';
import { getDefaultTarifs } from '@/lib/utils/meter-billing';

function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ----------------------------------------------------
// COMPTEURS ACTIONS
// ----------------------------------------------------

export async function getCompteurs(type?: CompteurType, clientId?: string): Promise<Compteur[]> {
  if (!isSupabaseConfigured()) {
    let result = [...mockCompteurs];
    if (type) {
      result = result.filter(c => c.type === type);
    }
    if (clientId) {
      result = result.filter(c => c.client_id === clientId);
    }
    return result;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const company = await getCompany();
    if (!company) return [];

    let query = supabase
      .from('compteurs')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data as unknown as Compteur[];
  } catch (err) {
    console.error('Error fetching compteurs:', err);
    return [];
  }
}

export async function createCompteurAction(
  data: Omit<Compteur, 'id' | 'boutique_id' | 'created_at'>
): Promise<Compteur> {
  if (!isSupabaseConfigured()) {
    const newId = `cpt-${Date.now()}`;
    const selectedClient = mockClients.find(c => c.id === data.client_id);

    const newCompteur: Compteur = {
      ...data,
      id: newId,
      boutique_id: 'bout-1',
      created_at: new Date().toISOString(),
      client: selectedClient
    };

    mockCompteurs.unshift(newCompteur);
    return newCompteur;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Get boutique linked to user company
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!company) throw new Error('Entreprise non configurée');

    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id')
      .eq('company_id', company.id)
      .maybeSingle();

    let boutiqueId = boutique?.id;

    if (!boutiqueId) {
      const { data: newBoutique } = await supabase
        .from('boutiques')
        .insert({
          company_id: company.id,
          nom: 'Boutique Principale',
          devise: 'XOF'
        })
        .select('id')
        .single();

      boutiqueId = newBoutique?.id;
    }

    if (!boutiqueId) {
      throw new Error('Impossible d\'associer une boutique valide à votre entreprise');
    }

    const { data: newCompteur, error } = await supabase
      .from('compteurs')
      .insert({
        client_id: data.client_id,
        boutique_id: boutiqueId,
        type: data.type,
        numero_compteur: data.numero_compteur || null,
        unite: data.unite,
        prix_unitaire: data.prix_unitaire || null,
        date_installation: data.date_installation || null
      })
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (error || !newCompteur) {
      throw new Error(error?.message || 'Échec de la création du compteur');
    }

    revalidatePath('/dashboard/invoices/new');
    return newCompteur as unknown as Compteur;
  } catch (err) {
    console.error('Error creating compteur:', err);
    throw err;
  }
}

// ----------------------------------------------------
// RELEVES ACTIONS
// ----------------------------------------------------

export async function getLastReleve(compteurId: string): Promise<Releve | null> {
  if (!isSupabaseConfigured()) {
    const releves = mockReleves
      .filter(r => r.compteur_id === compteurId)
      .sort((a, b) => new Date(b.date_releve).getTime() - new Date(a.date_releve).getTime());

    return releves.length > 0 ? releves[0] : null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('releves')
      .select('*')
      .eq('compteur_id', compteurId)
      .order('date_releve', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Releve;
  } catch {
    return null;
  }
}

export async function createReleveAction(data: Omit<Releve, 'id' | 'created_at'>): Promise<Releve> {
  if (!isSupabaseConfigured()) {
    const newReleve: Releve = {
      ...data,
      id: `rel-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockReleves.unshift(newReleve);
    return newReleve;
  }

  try {
    const supabase = createClient();
    const { data: newReleve, error } = await supabase
      .from('releves')
      .insert({
        compteur_id: data.compteur_id,
        index_value: data.index_value,
        date_releve: data.date_releve,
        source: data.source || 'manuel'
      })
      .select()
      .single();

    if (error || !newReleve) {
      throw new Error(error?.message || 'Échec de la création du relevé');
    }

    return newReleve as Releve;
  } catch (err) {
    console.error('Error creating releve:', err);
    throw err;
  }
}

// ----------------------------------------------------
// TARIFS ACTIONS
// ----------------------------------------------------

export async function getTarifs(type: CompteurType): Promise<Tarif[]> {
  if (!isSupabaseConfigured()) {
    const found = mockTarifs.filter(t => t.type === type && t.actif);
    return found.length > 0 ? found : getDefaultTarifs(type);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tarifs')
      .select('*')
      .eq('type', type)
      .eq('actif', true)
      .order('tranche_min', { ascending: true });

    if (error || !data || data.length === 0) {
      return getDefaultTarifs(type);
    }

    return data as Tarif[];
  } catch {
    return getDefaultTarifs(type);
  }
}

// ----------------------------------------------------
// FACTURATION COMPTEUR / FORFAIT COMBINED ACTION
// ----------------------------------------------------

export interface CreateMeterInvoiceParams {
  type_facture: CompteurType;
  client_id: string;
  compteur_id?: string;
  issue_date: string;
  due_date: string;
  notes?: string;
  apply_tax: boolean;

  // Meter reading parameters (for eau/electricite)
  previous_index?: number;
  new_index?: number;
  periode_debut?: string;
  periode_fin?: string;

  // Invoice line details
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tva: number;
  total: number;
  status: 'draft' | 'sent';
}

export async function createMeterInvoiceAction(params: CreateMeterInvoiceParams): Promise<Invoice> {
  const consumption = params.new_index !== undefined && params.previous_index !== undefined
    ? Math.max(0, params.new_index - params.previous_index)
    : params.quantity;

  // 1. Create standard invoice using existing createInvoiceAction engine
  const invoiceData = {
    invoice_number: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    client_id: params.client_id,
    status: params.status,
    issue_date: params.issue_date,
    due_date: params.due_date,
    subtotal: params.subtotal,
    tva: params.tva,
    total: params.total,
    notes: params.notes || null,
    type_facture: params.type_facture,
    compteur_id: params.compteur_id || null,
    ancien_index: params.previous_index !== undefined ? params.previous_index : null,
    nouveau_index: params.new_index !== undefined ? params.new_index : null,
    consommation: consumption,
    prix_unitaire_compteur: params.unit_price,
    periode_debut: params.periode_debut || params.issue_date,
    periode_fin: params.periode_fin || params.due_date,
  };

  const itemData: Omit<InvoiceItem, 'id' | 'invoice_id'> = {
    description: params.description,
    quantity: params.quantity,
    unit_price: params.unit_price,
    total: params.subtotal
  };

  const createdInvoice = await createInvoiceAction(invoiceData, [itemData]);

  // 2. If a new meter reading index was provided, record it in releves table
  if (params.compteur_id && params.new_index !== undefined && !isNaN(params.new_index)) {
    await createReleveAction({
      compteur_id: params.compteur_id,
      index_value: params.new_index,
      date_releve: params.issue_date,
      source: 'manuel'
    });
  }

  revalidatePath('/dashboard/invoices');
  return createdInvoice;
}
