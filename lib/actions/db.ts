'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { mockCompany, mockClients, mockInvoices, mockInvoiceItems, mockExpenses, mockBoutiques, mockAbonnement } from '@/lib/mock-data';
import { Company, Client, Invoice, InvoiceItem, InvoiceStatus, Expense, Abonnement } from '@/lib/types';

function checkSupabaseConfiguredSync() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return false;
  }
  return true;
}

export async function isSupabaseConfigured() {
  return checkSupabaseConfiguredSync();
}

export async function markSupabaseOffline() {
  // No-op to prevent transient timeouts from locking out Supabase for 30s
}

export async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Supabase query timed out (${ms}ms)`));
    }, ms);
  });

  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return res;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

// ----------------------------------------------------
// COMPANY ACTIONS
// ----------------------------------------------------

export async function getCompany(): Promise<Company | null> {
  if (!checkSupabaseConfiguredSync()) {
    return mockCompany;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Company;
  } catch {
    return null;
  }
}

export async function updateCompany(companyData: Partial<Company>): Promise<Company | null> {
  if (!checkSupabaseConfiguredSync()) {
    Object.assign(mockCompany, companyData);
    return mockCompany;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update company');
    }

    try {
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return data as Company;
  } catch (err) {
    console.error('Error updating company:', err);
    throw err;
  }
}

// ----------------------------------------------------
// CLIENT ACTIONS
// ----------------------------------------------------

export async function getClients(): Promise<Client[]> {
  if (!checkSupabaseConfiguredSync()) {
    return mockClients;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get client's company first
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as Client[];
  } catch {
    return [];
  }
}

export async function createClientAction(clientData: Omit<Client, 'id' | 'company_id'>): Promise<Client> {
  const createMockClient = (): Client => {
    const newId = `cli-${Date.now()}`;
    const mockNewClient: Client = {
      ...clientData,
      id: newId,
      company_id: 'comp-1'
    };
    mockClients.unshift(mockNewClient);
    return mockNewClient;
  };

  if (!checkSupabaseConfiguredSync()) {
    return createMockClient();
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return createMockClient();
    }

    // Get company ID safely using maybeSingle
    let { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) {
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name: 'Ma Société',
          owner_id: user.id
        })
        .select('id')
        .maybeSingle();
      company = newCompany;
    }

    if (!company) {
      return createMockClient();
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        company_id: company.id
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase error creating client:', error);
      return createMockClient();
    }

    try {
      revalidatePath('/dashboard/clients');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return data as Client;
  } catch (err) {
    console.error('Error creating client:', err);
    return createMockClient();
  }
}

// ----------------------------------------------------
// INVOICE ACTIONS
// ----------------------------------------------------

export async function getInvoices(): Promise<Invoice[]> {
  if (!checkSupabaseConfiguredSync()) {
    return mockInvoices;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockInvoices;

    // Get company ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) return mockInvoices;

    const { data: initialData, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        compteur:compteurs(*)
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    let data = initialData;

    // Fallback in case compteur table/join fails
    if (error || !data || data.length === 0) {
      const fallback = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (fallback.data && fallback.data.length > 0) {
        data = fallback.data;
      }
    }

    if (!data || data.length === 0) {
      return mockInvoices;
    }

    return data as unknown as Invoice[];
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return mockInvoices;
  }
}

export async function getInvoiceById(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  const getMockInvoiceResult = () => {
    const foundInvoice = mockInvoices.find(inv => inv.id === id);
    if (!foundInvoice) return null;
    const items = mockInvoiceItems[id] || [];
    return { invoice: foundInvoice, items };
  };

  if (!checkSupabaseConfiguredSync()) {
    return getMockInvoiceResult();
  }

  // Check mock store first for mock generated invoice IDs
  if (id.startsWith('inv-')) {
    const mockRes = getMockInvoiceResult();
    if (mockRes) return mockRes;
  }

  try {
    const supabase = createClient();

    // Fetch invoice with client and compteur details
    let invoiceData: (Record<string, unknown> & { compteur_id?: string }) | null = null;
    let invError: unknown = null;

    const firstTry = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        compteur:compteurs(*)
      `)
      .eq('id', id)
      .maybeSingle();

    invoiceData = firstTry.data;
    invError = firstTry.error;

    // Fallback: If joining compteur:compteurs(*) failed or returned error, try fetching invoice with client only
    if (invError || !invoiceData) {
      const fallbackTry = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (fallbackTry.data) {
        const found = fallbackTry.data;
        invoiceData = found;
        invError = null;

        // Manually fetch compteur if compteur_id exists
        if (found.compteur_id) {
          const { data: cptData } = await supabase
            .from('compteurs')
            .select('*, client:clients(*)')
            .eq('id', found.compteur_id)
            .maybeSingle();
          if (cptData) {
            found.compteur = cptData;
          }
        }
      }
    }

    if (!invoiceData) {
      const { getAutresInvoiceById } = await import('./other-invoices');
      const autre = await getAutresInvoiceById(id);
      if (autre) {
        return {
          invoice: autre as unknown as Invoice,
          items: [{
            description: autre.notes || `Facture ${autre.type_facture.toUpperCase()}`,
            quantity: autre.consommation || 1,
            unit_price: autre.prix_unitaire || autre.subtotal,
            total: autre.subtotal
          }]
        };
      }
      return getMockInvoiceResult();
    }

    // Fetch line items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    return {
      invoice: invoiceData as unknown as Invoice,
      items: (itemsError || !items) ? [] : (items as InvoiceItem[])
    };
  } catch (err) {
    console.error('Error in getInvoiceById:', err);
    return getMockInvoiceResult();
  }
}

function createMockInvoice(
  invoiceData: Omit<Invoice, 'id' | 'company_id' | 'client'>,
  itemsData: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Invoice {
  const newInvoiceId = `inv-${Date.now()}`;
  const selectedClient: Client = mockClients.find(c => c.id === invoiceData.client_id) || {
    id: invoiceData.client_id,
    name: 'Client Facturé',
    company_id: 'comp-1',
    email: null,
    phone: null,
    address: null,
    created_at: new Date().toISOString()
  };
  
  const mockNewInvoice: Invoice = {
    ...invoiceData,
    type_facture: invoiceData.type_facture || 'produits',
    compteur_id: invoiceData.compteur_id || null,
    id: newInvoiceId,
    company_id: 'comp-1',
    client: selectedClient
  };

  const mockNewItems: InvoiceItem[] = itemsData.map(item => ({
    ...item,
    invoice_id: newInvoiceId
  }));

  mockInvoices.unshift(mockNewInvoice);
  mockInvoiceItems[newInvoiceId] = mockNewItems;
  return mockNewInvoice;
}

export async function createInvoiceAction(
  invoiceData: Omit<Invoice, 'id' | 'company_id' | 'client'>,
  itemsData: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<Invoice> {
  if (!checkSupabaseConfiguredSync()) {
    return createMockInvoice(invoiceData, itemsData);
  }

  try {
    return await withTimeout((async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return createMockInvoice(invoiceData, itemsData);
      }

      // Get company ID safely with limit(1)
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

      if (!company) {
        return createMockInvoice(invoiceData, itemsData);
      }

      // Check client_id in Supabase or fallback to valid company client
      let targetClientId = invoiceData.client_id;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', targetClientId)
        .limit(1)
        .maybeSingle();

      if (!existingClient) {
        const { data: companyClients } = await supabase
          .from('clients')
          .select('id')
          .eq('company_id', company.id)
          .limit(1);

        if (companyClients && companyClients.length > 0) {
          targetClientId = companyClients[0].id;
        } else {
          const { data: newCl } = await supabase
            .from('clients')
            .insert({
              company_id: company.id,
              name: 'Client Facturé',
              email: null,
              phone: null
            })
            .select('id')
            .single();
          if (newCl) targetClientId = newCl.id;
        }
      }

      // Check compteur_id if provided
      let compteurIdToUse: string | null = invoiceData.compteur_id || null;
      if (compteurIdToUse) {
        const { data: existingCompteur } = await supabase
          .from('compteurs')
          .select('id')
          .eq('id', compteurIdToUse)
          .limit(1)
          .maybeSingle();
        
        if (!existingCompteur) {
          compteurIdToUse = null;
        }
      }

      // Insert invoice
      let { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          company_id: company.id,
          client_id: targetClientId,
          invoice_number: invoiceData.invoice_number,
          status: invoiceData.status,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          subtotal: invoiceData.subtotal,
          tva: invoiceData.tva,
          total: invoiceData.total,
          notes: invoiceData.notes,
          type_facture: invoiceData.type_facture || 'produits',
          compteur_id: compteurIdToUse,
          ancien_index: invoiceData.ancien_index !== undefined ? invoiceData.ancien_index : null,
          nouveau_index: invoiceData.nouveau_index !== undefined ? invoiceData.nouveau_index : null,
          consommation: invoiceData.consommation !== undefined ? invoiceData.consommation : null,
          prix_unitaire_compteur: invoiceData.prix_unitaire_compteur !== undefined ? invoiceData.prix_unitaire_compteur : null,
          periode_debut: invoiceData.periode_debut || null,
          periode_fin: invoiceData.periode_fin || null,
        })
        .select(`
          *,
          client:clients(*)
        `)
        .single();

      // Fallback: If insert failed due to missing meter columns in Supabase schema
      if (invError && (invError.code === 'PGRST204' || invError.message?.includes('column'))) {
        console.warn('Meter columns missing in Supabase invoices table, falling back to standard insert:', invError.message);
        const fallbackRes = await supabase
          .from('invoices')
          .insert({
            company_id: company.id,
            client_id: targetClientId,
            invoice_number: invoiceData.invoice_number,
            status: invoiceData.status,
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            subtotal: invoiceData.subtotal,
            tva: invoiceData.tva,
            total: invoiceData.total,
            notes: invoiceData.notes
          })
          .select(`
            *,
            client:clients(*)
          `)
          .single();

        invoice = fallbackRes.data;
        invError = fallbackRes.error;
      }

      if (invError || !invoice) {
        console.error('Supabase error creating invoice:', invError);
        return createMockInvoice(invoiceData, itemsData);
      }

      // Insert invoice items
      const itemsWithInvoiceId = itemsData.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        console.error('Error inserting invoice items:', itemsError);
      }

      try {
        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard');
      } catch (e) {
        console.warn('revalidatePath warning:', e);
      }
      return invoice as unknown as Invoice;
    })(), 12000);
  } catch (err) {
    console.error('Error creating invoice:', err);
    return createMockInvoice(invoiceData, itemsData);
  }
}

export async function updateInvoiceStatusAction(id: string, status: InvoiceStatus): Promise<boolean> {
  if (!checkSupabaseConfiguredSync()) {
    const found = mockInvoices.find(inv => inv.id === id);
    if (found) {
      found.status = status;
    }
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status in DB:', error);
      return false;
    }

    try {
      revalidatePath(`/dashboard/invoices/${id}`);
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  } catch (err) {
    console.error('Exception updating invoice status:', err);
    return false;
  }
}

export async function updateInvoiceAction(
  id: string,
  invoiceData: Omit<Invoice, 'id' | 'company_id' | 'client'>,
  itemsData: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<Invoice> {
  if (!checkSupabaseConfiguredSync()) {
    const selectedClient = mockClients.find(c => c.id === invoiceData.client_id);
    const foundIdx = mockInvoices.findIndex(inv => inv.id === id);
    
    const mockUpdatedInvoice: Invoice = {
      ...invoiceData,
      id,
      company_id: 'comp-1',
      client: selectedClient
    };

    const mockNewItems: InvoiceItem[] = itemsData.map(item => ({
      ...item,
      invoice_id: id
    }));

    if (foundIdx !== -1) {
      mockInvoices[foundIdx] = mockUpdatedInvoice;
    }
    mockInvoiceItems[id] = mockNewItems;
    try {
      revalidatePath(`/dashboard/invoices/${id}`);
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return mockUpdatedInvoice;
  }

  try {
    const supabase = createClient();
    
    // Update invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .update({
        client_id: invoiceData.client_id,
        invoice_number: invoiceData.invoice_number,
        status: invoiceData.status,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        subtotal: invoiceData.subtotal,
        tva: invoiceData.tva,
        total: invoiceData.total,
        notes: invoiceData.notes
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (invError || !invoice) {
      throw new Error(invError?.message || 'Failed to update invoice');
    }

    // Delete existing invoice items and insert new ones
    await supabase.from('invoice_items').delete().eq('invoice_id', id);

    const itemsWithInvoiceId = itemsData.map(item => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);

    if (itemsError) {
      console.error('Error inserting invoice items on update:', itemsError);
    }

    try {
      revalidatePath(`/dashboard/invoices/${id}`);
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return invoice as unknown as Invoice;
  } catch (err) {
    console.error('Error updating invoice:', err);
    throw err;
  }
}

export async function deleteInvoiceAction(id: string): Promise<boolean> {
  if (!checkSupabaseConfiguredSync()) {
    const foundIdx = mockInvoices.findIndex(inv => inv.id === id);
    if (foundIdx !== -1) {
      mockInvoices.splice(foundIdx, 1);
    }
    delete mockInvoiceItems[id];
    try {
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  }

  try {
    const supabase = createClient();
    
    // items will be deleted by CASCADE or we delete them explicitly
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);

    if (error) {
      console.error('Error deleting invoice from DB:', error);
      return false;
    }

    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
    return true;
  } catch (err) {
    console.error('Exception deleting invoice:', err);
    return false;
  }
}

export async function updateClientAction(
  id: string,
  clientData: Omit<Client, 'id' | 'company_id'>
): Promise<Client> {
  if (!checkSupabaseConfiguredSync()) {
    const foundIdx = mockClients.findIndex(c => c.id === id);
    const mockUpdatedClient: Client = {
      ...clientData,
      id,
      company_id: 'comp-1'
    };

    if (foundIdx !== -1) {
      mockClients[foundIdx] = mockUpdatedClient;
      mockInvoices.forEach(inv => {
        if (inv.client_id === id) {
          inv.client = mockUpdatedClient;
        }
      });
    }
    try {
      revalidatePath('/dashboard/clients');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return mockUpdatedClient;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update client');
    }

    try {
      revalidatePath('/dashboard/clients');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return data as Client;
  } catch (err) {
    console.error('Error updating client:', err);
    throw err;
  }
}

export async function deleteClientAction(id: string): Promise<boolean> {
  if (!checkSupabaseConfiguredSync()) {
    const foundIdx = mockClients.findIndex(c => c.id === id);
    if (foundIdx !== -1) {
      mockClients.splice(foundIdx, 1);
    }
    try {
      revalidatePath('/dashboard/clients');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      console.error('Error deleting client from DB:', error);
      return false;
    }

    try {
      revalidatePath('/dashboard/clients');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return true;
  } catch (err) {
    console.error('Exception deleting client:', err);
    return false;
  }
}

// ----------------------------------------------------
// EXPENSE ACTIONS
// ----------------------------------------------------

export async function getExpenses(): Promise<Expense[]> {
  if (!checkSupabaseConfiguredSync()) {
    return mockExpenses.map(exp => ({
      ...exp,
      boutique: mockBoutiques.find(b => b.id === exp.boutique_id) || null
    }));
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get company first
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) return [];

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        boutique:boutiques(*)
      `)
      .eq('company_id', company.id)
      .order('date', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as unknown as Expense[];
  } catch {
    return [];
  }
}

export async function createExpenseAction(expenseData: Omit<Expense, 'id' | 'company_id' | 'boutique'>): Promise<Expense> {
  if (!checkSupabaseConfiguredSync()) {
    const newId = `exp-${Date.now()}`;
    const mockNewExpense: Expense = {
      ...expenseData,
      id: newId,
      company_id: 'comp-1',
      boutique: mockBoutiques.find(b => b.id === expenseData.boutique_id) || null
    };
    mockExpenses.unshift(mockNewExpense);
    return mockNewExpense;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get company ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!company) {
      throw new Error('No company configured yet.');
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expenseData,
        company_id: company.id
      })
      .select(`
        *,
        boutique:boutiques(*)
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create expense');
    }

    try {
      revalidatePath('/dashboard/expenses');
      revalidatePath('/dashboard');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }
    return data as unknown as Expense;
  } catch (err) {
    console.error('Error creating expense:', err);
    throw err;
  }
}

export async function updateExpenseAction(id: string, expenseData: Omit<Expense, 'id' | 'company_id' | 'boutique'>): Promise<Expense> {
  if (!checkSupabaseConfiguredSync()) {
    const foundIdx = mockExpenses.findIndex(e => e.id === id);
    if (foundIdx !== -1) {
      mockExpenses[foundIdx] = {
        ...mockExpenses[foundIdx],
        ...expenseData,
        boutique: mockBoutiques.find(b => b.id === expenseData.boutique_id) || null
      };
      return mockExpenses[foundIdx];
    }
    throw new Error('Expense not found');
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select(`
        *,
        boutique:boutiques(*)
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update expense');
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');
    return data as unknown as Expense;
  } catch (err) {
    console.error('Error updating expense:', err);
    throw err;
  }
}

export async function deleteExpenseAction(id: string): Promise<boolean> {
  if (!checkSupabaseConfiguredSync()) {
    const foundIdx = mockExpenses.findIndex(e => e.id === id);
    if (foundIdx !== -1) {
      mockExpenses.splice(foundIdx, 1);
    }
    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Error deleting expense from DB:', error);
      return false;
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');
    return true;
  } catch (err) {
    console.error('Exception deleting expense:', err);
    return false;
  }
}

// ----------------------------------------------------
// ABONNEMENT ACTIONS
// ----------------------------------------------------

export async function getAbonnement(): Promise<Abonnement | null> {
  if (!isSupabaseConfigured()) {
    return mockAbonnement;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockAbonnement;

    const { data: initialData, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('utilisateur_id', user.id)
      .maybeSingle();

    let finalData = initialData;

    // Auto-create if it doesn't exist
    if (!initialData && !error) {
      const { data: insertedData, error: insertError } = await supabase
        .from('abonnements')
        .insert({
          utilisateur_id: user.id,
          plan: 'essai',
          statut: 'actif',
          date_fin_essai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (!insertError && insertedData) {
        finalData = insertedData;
      }
    }

    return finalData as Abonnement;
  } catch (err) {
    console.error('Error in getAbonnement:', err);
    return null;
  }
}

export async function updateMockAbonnement(abonnementData: Partial<Abonnement>): Promise<Abonnement> {
  Object.assign(mockAbonnement, abonnementData);
  revalidatePath('/dashboard');
  return mockAbonnement;
}
