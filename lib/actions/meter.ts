'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { mockCompteurs, mockReleves, mockTarifs, mockClients } from '@/lib/mock-data';
import { Compteur, CompteurType, Releve, Tarif, Client } from '@/lib/types';
import { getCompany, isSupabaseConfigured, withTimeout } from './db';
import { createAutresInvoiceAction } from './other-invoices';
import { getDefaultTarifs } from '@/lib/utils/meter-billing';

// ----------------------------------------------------
// COMPTEURS ACTIONS
// ----------------------------------------------------

function createMockCompteur(data: Omit<Compteur, 'id' | 'boutique_id' | 'created_at'>): Compteur {
  const newId = `cpt-${Date.now()}`;
  const selectedClient: Client = mockClients.find(c => c.id === data.client_id) || {
    id: data.client_id,
    name: 'Client Associé',
    company_id: 'comp-1',
    email: null,
    phone: null,
    address: null,
    created_at: new Date().toISOString()
  };

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

export async function getCompteurs(type?: CompteurType, clientId?: string): Promise<Compteur[]> {
  const getFilteredMock = () => {
    let result = (mockCompteurs || []).filter((c): c is Compteur => Boolean(c && c.id));
    if (type) {
      result = result.filter(c => c.type === type);
    }
    if (clientId) {
      result = result.filter(c => c.client_id === clientId);
    }
    return result;
  };

  if (!(await isSupabaseConfigured())) {
    return getFilteredMock();
  }

  try {
    return await withTimeout((async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return getFilteredMock();

      const company = await getCompany();
      if (!company) return getFilteredMock();

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
      if (error || !data || data.length === 0) return getFilteredMock();

      return (data as unknown as Compteur[]).filter((c): c is Compteur => Boolean(c && c.id));
    })(), 2000);
  } catch (err) {
    console.error('Error fetching compteurs:', err);
    return getFilteredMock();
  }
}

export async function createCompteurAction(
  data: Omit<Compteur, 'id' | 'boutique_id' | 'created_at'>
): Promise<Compteur> {
  if (!(await isSupabaseConfigured())) {
    return createMockCompteur(data);
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return createMockCompteur(data);
    }

    // Get company ID using maybeSingle to avoid 0-row exceptions
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
        .insert({
          name: 'Ma Société',
          owner_id: user.id
        })
        .select('id')
        .single();
      company = newCompany;
    }

    if (!company) {
      return createMockCompteur(data);
    }

    const { data: boutiques } = await supabase
      .from('boutiques')
      .select('id')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })
      .limit(1);

    let boutiqueId = boutiques && boutiques.length > 0 ? boutiques[0].id : null;

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
      return createMockCompteur(data);
    }

    // Check if client exists in Supabase to avoid foreign key errors with mock client IDs
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', data.client_id)
      .maybeSingle();

    if (!existingClient) {
      return createMockCompteur(data);
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
      console.error('Supabase error creating compteur:', error);
      return createMockCompteur(data);
    }

    try {
      revalidatePath('/dashboard/invoices/new');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return newCompteur as unknown as Compteur;
  } catch (err) {
    console.error('Error creating compteur:', err);
    return createMockCompteur(data);
  }
}

// ----------------------------------------------------
// RELEVES ACTIONS
// ----------------------------------------------------

export async function getLastReleve(compteurId: string): Promise<Releve | null> {
  const getMockReleve = () => {
    const releves = mockReleves
      .filter(r => r.compteur_id === compteurId)
      .sort((a, b) => new Date(b.date_releve).getTime() - new Date(a.date_releve).getTime());

    return releves.length > 0 ? releves[0] : null;
  };

  if (!(await isSupabaseConfigured())) {
    return getMockReleve();
  }

  try {
    return await withTimeout((async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('releves')
        .select('*')
        .eq('compteur_id', compteurId)
        .order('date_releve', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return getMockReleve();
      }
      return data as Releve;
    })(), 2000);
  } catch {
    return getMockReleve();
  }
}

export async function createReleveAction(data: Omit<Releve, 'id' | 'created_at'>): Promise<Releve> {
  const createMockReleve = () => {
    const newReleve: Releve = {
      ...data,
      id: `rel-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockReleves.unshift(newReleve);
    return newReleve;
  };

  if (!(await isSupabaseConfigured())) {
    return createMockReleve();
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return createMockReleve();

    // Check if compteur exists in DB
    const { data: existingCompteur } = await supabase
      .from('compteurs')
      .select('id')
      .eq('id', data.compteur_id)
      .maybeSingle();

    if (!existingCompteur) {
      return createMockReleve();
    }

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
      console.error('Supabase error creating releve:', error);
      return createMockReleve();
    }

    return newReleve as Releve;
  } catch (err) {
    console.error('Error creating releve:', err);
    return createMockReleve();
  }
}

// ----------------------------------------------------
// TARIFS ACTIONS
// ----------------------------------------------------

export async function getTarifs(type: CompteurType): Promise<Tarif[]> {
  if (!(await isSupabaseConfigured())) {
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

export async function createMeterInvoiceAction(params: CreateMeterInvoiceParams) {
  const consumption = params.new_index !== undefined && params.previous_index !== undefined
    ? Math.max(0, params.new_index - params.previous_index)
    : params.quantity;

  const invNum = `FAC-${(params.type_facture || 'AUTRE').toUpperCase().slice(0, 4)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const createdInvoice = await createAutresInvoiceAction({
    client_id: params.client_id,
    compteur_id: params.compteur_id || null,
    invoice_number: invNum,
    type_facture: params.type_facture,
    status: params.status,
    issue_date: params.issue_date,
    due_date: params.due_date,
    ancien_index: params.previous_index !== undefined ? params.previous_index : null,
    nouveau_index: params.new_index !== undefined ? params.new_index : null,
    consommation: consumption,
    prix_unitaire: params.unit_price,
    subtotal: params.subtotal,
    tva: params.tva,
    total: params.total,
    periode_debut: params.periode_debut || params.issue_date,
    periode_fin: params.periode_fin || params.due_date,
    notes: params.notes || params.description
  });

  // 2. If a new meter reading index was provided, record it in releves table
  if (params.compteur_id && params.new_index !== undefined && !isNaN(params.new_index)) {
    await createReleveAction({
      compteur_id: params.compteur_id,
      index_value: params.new_index,
      date_releve: params.issue_date,
      source: 'manuel'
    });
  }

  try {
    revalidatePath('/dashboard/invoices');
  } catch (e) {
    console.warn('revalidatePath warning:', e);
  }

  return createdInvoice;
}
