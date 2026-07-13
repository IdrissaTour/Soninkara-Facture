'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { mockCompany, mockClients, mockInvoices, mockInvoiceItems, mockExpenses } from '@/lib/mock-data';
import { Company, Client, Invoice, InvoiceItem, InvoiceStatus, Expense } from '@/lib/types';

// Helper to check if Supabase is fully configured
function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ----------------------------------------------------
// COMPANY ACTIONS
// ----------------------------------------------------

export async function getCompany(): Promise<Company | null> {
  if (!isSupabaseConfigured()) {
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
  if (!isSupabaseConfigured()) {
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

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
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
  if (!isSupabaseConfigured()) {
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
  if (!isSupabaseConfigured()) {
    const newId = `cli-${Date.now()}`;
    const mockNewClient: Client = {
      ...clientData,
      id: newId,
      company_id: 'comp-1'
    };
    mockClients.unshift(mockNewClient);
    return mockNewClient;
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
      .from('clients')
      .insert({
        ...clientData,
        company_id: company.id
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create client');
    }

    revalidatePath('/dashboard/clients');
    return data as Client;
  } catch (err) {
    console.error('Error creating client:', err);
    throw err;
  }
}

// ----------------------------------------------------
// INVOICE ACTIONS
// ----------------------------------------------------

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) {
    return mockInvoices;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get company ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) return [];

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as unknown as Invoice[];
  } catch {
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  if (!isSupabaseConfigured()) {
    const foundInvoice = mockInvoices.find(inv => inv.id === id);
    if (!foundInvoice) return null;
    const items = mockInvoiceItems[id] || [];
    return { invoice: foundInvoice, items };
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch invoice with client details
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    if (invError || !invoice) {
      return null;
    }

    // Fetch line items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    if (itemsError) {
      return { invoice: invoice as unknown as Invoice, items: [] };
    }

    return {
      invoice: invoice as unknown as Invoice,
      items: items as InvoiceItem[]
    };
  } catch {
    return null;
  }
}

export async function createInvoiceAction(
  invoiceData: Omit<Invoice, 'id' | 'company_id' | 'client'>,
  itemsData: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<Invoice> {
  if (!isSupabaseConfigured()) {
    const newInvoiceId = `inv-${Date.now()}`;
    const selectedClient = mockClients.find(c => c.id === invoiceData.client_id);
    
    const mockNewInvoice: Invoice = {
      ...invoiceData,
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

    // Insert invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        company_id: company.id,
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
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (invError || !invoice) {
      throw new Error(invError?.message || 'Failed to create invoice');
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

    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
    return invoice as unknown as Invoice;
  } catch (err) {
    console.error('Error creating invoice:', err);
    throw err;
  }
}

export async function updateInvoiceStatusAction(id: string, status: InvoiceStatus): Promise<boolean> {
  if (!isSupabaseConfigured()) {
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

    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
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
  if (!isSupabaseConfigured()) {
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
    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
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

    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
    return invoice as unknown as Invoice;
  } catch (err) {
    console.error('Error updating invoice:', err);
    throw err;
  }
}

export async function deleteInvoiceAction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const foundIdx = mockInvoices.findIndex(inv => inv.id === id);
    if (foundIdx !== -1) {
      mockInvoices.splice(foundIdx, 1);
    }
    delete mockInvoiceItems[id];
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
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
  if (!isSupabaseConfigured()) {
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
    revalidatePath('/dashboard/clients');
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

    revalidatePath('/dashboard/clients');
    return data as Client;
  } catch (err) {
    console.error('Error updating client:', err);
    throw err;
  }
}

export async function deleteClientAction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const foundIdx = mockClients.findIndex(c => c.id === id);
    if (foundIdx !== -1) {
      mockClients.splice(foundIdx, 1);
    }
    revalidatePath('/dashboard/clients');
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      console.error('Error deleting client from DB:', error);
      return false;
    }

    revalidatePath('/dashboard/clients');
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
  if (!isSupabaseConfigured()) {
    return mockExpenses;
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
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as Expense[];
  } catch {
    return [];
  }
}

export async function createExpenseAction(expenseData: Omit<Expense, 'id' | 'company_id'>): Promise<Expense> {
  if (!isSupabaseConfigured()) {
    const newId = `exp-${Date.now()}`;
    const mockNewExpense: Expense = {
      ...expenseData,
      id: newId,
      company_id: 'comp-1'
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
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create expense');
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');
    return data as Expense;
  } catch (err) {
    console.error('Error creating expense:', err);
    throw err;
  }
}

export async function updateExpenseAction(id: string, expenseData: Omit<Expense, 'id' | 'company_id'>): Promise<Expense> {
  if (!isSupabaseConfigured()) {
    const foundIdx = mockExpenses.findIndex(e => e.id === id);
    if (foundIdx !== -1) {
      mockExpenses[foundIdx] = {
        ...mockExpenses[foundIdx],
        ...expenseData
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
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update expense');
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');
    return data as Expense;
  } catch (err) {
    console.error('Error updating expense:', err);
    throw err;
  }
}

export async function deleteExpenseAction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
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
