'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  mockBoutiques,
  mockProduits,
  mockMouvementsStock,
  mockVentes
} from '@/lib/mock-data';
import {
  Boutique,
  Produit,
  MouvementType,
  Vente,
  BoutiqueStats,
  StockAlert
} from '@/lib/types';
import { createInvoiceAction, getExpenses } from './db';

interface BoutiqueRecord extends Boutique {
  produits?: Produit[];
  ventes?: Vente[];
}

function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ----------------------------------------------------
// BOUTIQUES ACTIONS
// ----------------------------------------------------

export async function getBoutiques(): Promise<Boutique[]> {
  const allExpenses = await getExpenses();

  if (!isSupabaseConfigured()) {
    return mockBoutiques.map(boutique => {
      const prods = mockProduits.filter(p => p.boutique_id === boutique.id);
      const lowStock = prods.filter(p => p.quantite_stock <= p.seuil_alerte).length;
      const sales = mockVentes.filter(v => v.boutique_id === boutique.id);
      const totalRev = sales.reduce((acc, v) => acc + (v.quantite * v.prix_unitaire), 0);
      const bExpenses = allExpenses.filter(e => e.boutique_id === boutique.id);
      const totalExp = bExpenses.reduce((acc, e) => acc + e.amount, 0);
      return {
        ...boutique,
        produits_count: prods.length,
        low_stock_count: lowStock,
        total_revenue: totalRev,
        total_expenses: totalExp
      };
    });
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!company) return [];

    const { data: boutiques, error } = await supabase
      .from('boutiques')
      .select(`
        *,
        produits(*),
        ventes(*)
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error || !boutiques) return [];

    return (boutiques as BoutiqueRecord[]).map((b) => {
      const prods = b.produits || [];
      const lowStock = prods.filter((p) => p.quantite_stock <= (p.seuil_alerte || 5)).length;
      const sales = b.ventes || [];
      const totalRev = sales.reduce((acc: number, v) => acc + (Number(v.quantite) * Number(v.prix_unitaire)), 0);
      const bExpenses = allExpenses.filter(e => e.boutique_id === b.id);
      const totalExp = bExpenses.reduce((acc, e) => acc + e.amount, 0);

      return {
        id: b.id,
        company_id: b.company_id,
        nom: b.nom,
        adresse: b.adresse,
        devise: b.devise || 'FCFA',
        created_at: b.created_at,
        updated_at: b.updated_at,
        produits_count: prods.length,
        low_stock_count: lowStock,
        total_revenue: totalRev,
        total_expenses: totalExp
      };
    });
  } catch (err) {
    console.error('Error fetching boutiques:', err);
    return [];
  }
}

export async function getBoutiqueById(id: string): Promise<Boutique | null> {
  const boutiques = await getBoutiques();
  return boutiques.find(b => b.id === id) || null;
}

export async function createBoutiqueAction(boutiqueData: { nom: string; adresse?: string; devise?: string }): Promise<Boutique> {
  if (!isSupabaseConfigured()) {
    const newBoutique: Boutique = {
      id: `bout-${Date.now()}`,
      company_id: 'comp-1',
      nom: boutiqueData.nom,
      adresse: boutiqueData.adresse || null,
      devise: boutiqueData.devise || 'FCFA',
      created_at: new Date().toISOString(),
      produits_count: 0,
      low_stock_count: 0,
      total_revenue: 0
    };
    mockBoutiques.unshift(newBoutique);
    revalidatePath('/dashboard/boutiques');
    return newBoutique;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!company) throw new Error('Entreprise non trouvée');

    const { data, error } = await supabase
      .from('boutiques')
      .insert({
        company_id: company.id,
        nom: boutiqueData.nom,
        adresse: boutiqueData.adresse || null,
        devise: boutiqueData.devise || 'FCFA'
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Erreur lors de la création de la boutique');

    revalidatePath('/dashboard/boutiques');
    return data as Boutique;
  } catch (err) {
    console.error('Error creating boutique:', err);
    throw err;
  }
}

// ----------------------------------------------------
// PRODUITS & STOCKS ACTIONS
// ----------------------------------------------------

export async function getProduits(boutiqueId: string): Promise<Produit[]> {
  if (!isSupabaseConfigured()) {
    return mockProduits.filter(p => p.boutique_id === boutiqueId);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('nom', { ascending: true });

    if (error || !data) return [];
    return data as Produit[];
  } catch {
    return [];
  }
}

export async function createProduitAction(produitData: Omit<Produit, 'id' | 'created_at' | 'updated_at'>): Promise<Produit> {
  if (!isSupabaseConfigured()) {
    const newProduit: Produit = {
      ...produitData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockProduits.unshift(newProduit);
    
    // Initial movement
    mockMouvementsStock.unshift({
      id: `mvt-${Date.now()}`,
      produit_id: newProduit.id,
      type: 'entree',
      quantite: newProduit.quantite_stock,
      motif: 'Création initiale du produit',
      created_at: new Date().toISOString()
    });

    revalidatePath(`/dashboard/boutiques/${produitData.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    return newProduit;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('produits')
      .insert(produitData)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Erreur lors de la création du produit');

    // Create initial stock movement if quantity > 0
    if (data.quantite_stock > 0) {
      await supabase.from('mouvements_stock').insert({
        produit_id: data.id,
        type: 'entree',
        quantite: data.quantite_stock,
        motif: 'Stock initial à la création'
      });
    }

    revalidatePath(`/dashboard/boutiques/${produitData.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    return data as Produit;
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
}

export async function adjustStockAction(
  produitId: string,
  type: MouvementType,
  quantite: number,
  motif?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const prod = mockProduits.find(p => p.id === produitId);
    if (!prod) return false;

    if (type === 'entree') {
      prod.quantite_stock += quantite;
    } else if (type === 'sortie') {
      prod.quantite_stock = Math.max(0, prod.quantite_stock - quantite);
    } else if (type === 'ajustement') {
      prod.quantite_stock = quantite;
    }

    mockMouvementsStock.unshift({
      id: `mvt-${Date.now()}`,
      produit_id: produitId,
      type,
      quantite,
      motif: motif || `Ajustement manuel (${type})`,
      created_at: new Date().toISOString()
    });

    revalidatePath(`/dashboard/boutiques/${prod.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    return true;
  }

  try {
    const supabase = createClient();
    const { data: prod } = await supabase.from('produits').select('quantite_stock, boutique_id').eq('id', produitId).single();
    if (!prod) return false;

    let newStock = prod.quantite_stock;
    if (type === 'entree') newStock += quantite;
    else if (type === 'sortie') newStock = Math.max(0, newStock - quantite);
    else if (type === 'ajustement') newStock = quantite;

    await supabase.from('produits').update({ quantite_stock: newStock }).eq('id', produitId);
    await supabase.from('mouvements_stock').insert({
      produit_id: produitId,
      type,
      quantite,
      motif: motif || `Ajustement manuel (${type})`
    });

    revalidatePath(`/dashboard/boutiques/${prod.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    return true;
  } catch (err) {
    console.error('Error adjusting stock:', err);
    return false;
  }
}

export async function deleteProduitAction(produitId: string, boutiqueId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const foundIdx = mockProduits.findIndex(p => p.id === produitId);
    if (foundIdx !== -1) {
      mockProduits.splice(foundIdx, 1);
    }
    revalidatePath(`/dashboard/boutiques/${boutiqueId}/stock`);
    revalidatePath('/dashboard/boutiques');
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from('produits').delete().eq('id', produitId);
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    revalidatePath(`/dashboard/boutiques/${boutiqueId}/stock`);
    revalidatePath('/dashboard/boutiques');
    return true;
  } catch (err) {
    console.error('Exception deleting product:', err);
    return false;
  }
}

export async function getProduitByIdAction(produitId: string): Promise<Produit | null> {
  if (!isSupabaseConfigured()) {
    const prod = mockProduits.find(p => p.id === produitId);
    return prod || null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('id', produitId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Produit;
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    return null;
  }
}

export async function updateProduitAction(
  produitId: string,
  produitData: Partial<Omit<Produit, 'id' | 'created_at' | 'updated_at'>>
): Promise<Produit | null> {
  if (!isSupabaseConfigured()) {
    const idx = mockProduits.findIndex(p => p.id === produitId);
    if (idx !== -1) {
      mockProduits[idx] = {
        ...mockProduits[idx],
        ...produitData,
        updated_at: new Date().toISOString()
      };
      revalidatePath(`/dashboard/boutiques/${mockProduits[idx].boutique_id}/stock`);
      revalidatePath('/dashboard/boutiques');
      return mockProduits[idx];
    }
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('produits')
      .update({
        ...produitData,
        updated_at: new Date().toISOString()
      })
      .eq('id', produitId)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Erreur lors de la modification du produit');

    revalidatePath(`/dashboard/boutiques/${data.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    return data as Produit;
  } catch (err) {
    console.error('Error updating product:', err);
    throw err;
  }
}

// ----------------------------------------------------
// VENTES & FACTURATION ACTIONS
// ----------------------------------------------------

export async function getVentes(boutiqueId: string): Promise<Vente[]> {
  if (!isSupabaseConfigured()) {
    return mockVentes
      .filter(v => v.boutique_id === boutiqueId)
      .map(v => ({
        ...v,
        produit: mockProduits.find(p => p.id === v.produit_id),
        boutique: mockBoutiques.find(b => b.id === v.boutique_id)
      }));
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ventes')
      .select(`
        *,
        produit:produits(*),
        boutique:boutiques(*)
      `)
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Vente[];
  } catch {
    return [];
  }
}

export async function createVenteAction(
  venteData: {
    boutique_id: string;
    produit_id: string;
    quantite: number;
    prix_unitaire: number;
  },
  options?: {
    genererFacture?: boolean;
    client_id?: string;
    notes?: string;
  }
): Promise<Vente> {
  let createdFactureId: string | null = null;

  // 1. If user checked "générer une facture", generate invoice via engine
  if (options?.genererFacture && options.client_id) {
    const prodName = isSupabaseConfigured()
      ? (await createClient().from('produits').select('nom').eq('id', venteData.produit_id).single()).data?.nom || 'Article Vente Boutique'
      : mockProduits.find(p => p.id === venteData.produit_id)?.nom || 'Article Vente Boutique';

    const subtotal = venteData.quantite * venteData.prix_unitaire;
    const tva = Math.round(subtotal * 0.18);
    const total = subtotal + tva;
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = issueDate;

    const newInvoice = await createInvoiceAction(
      {
        client_id: options.client_id,
        invoice_number: `FAC-BOUT-${Date.now().toString().slice(-4)}`,
        status: 'paid',
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tva,
        total,
        notes: options.notes || `Facture générée automatiquement depuis vente boutique.`
      },
      [
        {
          description: `${prodName} (x${venteData.quantite})`,
          quantity: venteData.quantite,
          unit_price: venteData.prix_unitaire,
          total: subtotal
        }
      ]
    );

    createdFactureId = newInvoice.id;
  }

  // 2. Insert Vente record
  if (!isSupabaseConfigured()) {
    const newVente: Vente = {
      id: `vent-${Date.now()}`,
      boutique_id: venteData.boutique_id,
      produit_id: venteData.produit_id,
      quantite: venteData.quantite,
      prix_unitaire: venteData.prix_unitaire,
      facture_id: createdFactureId,
      created_at: new Date().toISOString()
    };

    // Decrement stock manually in mock
    const prod = mockProduits.find(p => p.id === venteData.produit_id);
    if (prod) {
      prod.quantite_stock = Math.max(0, prod.quantite_stock - venteData.quantite);
      mockMouvementsStock.unshift({
        id: `mvt-${Date.now()}`,
        produit_id: prod.id,
        type: 'sortie',
        quantite: venteData.quantite,
        motif: `Vente #${newVente.id.substring(0, 8)}`,
        created_at: new Date().toISOString()
      });
    }

    mockVentes.unshift(newVente);
    revalidatePath(`/dashboard/boutiques/${venteData.boutique_id}/ventes`);
    revalidatePath(`/dashboard/boutiques/${venteData.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    revalidatePath('/dashboard');
    return newVente;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ventes')
      .insert({
        boutique_id: venteData.boutique_id,
        produit_id: venteData.produit_id,
        quantite: venteData.quantite,
        prix_unitaire: venteData.prix_unitaire,
        facture_id: createdFactureId
      })
      .select(`
        *,
        produit:produits(*),
        boutique:boutiques(*)
      `)
      .single();

    if (error || !data) throw new Error(error?.message || 'Erreur lors de la vente');

    revalidatePath(`/dashboard/boutiques/${venteData.boutique_id}/ventes`);
    revalidatePath(`/dashboard/boutiques/${venteData.boutique_id}/stock`);
    revalidatePath('/dashboard/boutiques');
    revalidatePath('/dashboard');
    return data as unknown as Vente;
  } catch (err) {
    console.error('Error creating sale:', err);
    throw err;
  }
}

// ----------------------------------------------------
// STATISTIQUES & ALERTES DE STOCK
// ----------------------------------------------------

export async function getBoutiqueStats(boutiqueId: string): Promise<BoutiqueStats | null> {
  const boutique = await getBoutiqueById(boutiqueId);
  if (!boutique) return null;

  const produits = await getProduits(boutiqueId);
  const ventes = await getVentes(boutiqueId);

  let chiffreAffaires = 0;
  let coutAchats = 0;
  let unitesVendues = 0;

  const productStatsMap: Record<string, { nom: string; quantite: number; ca: number; benefice: number }> = {};

  ventes.forEach(v => {
    const prod = produits.find(p => p.id === v.produit_id) || v.produit;
    const prixAchat = prod?.prix_achat || 0;
    const caVente = v.quantite * v.prix_unitaire;
    const coutVente = v.quantite * prixAchat;
    const benVente = caVente - coutVente;

    chiffreAffaires += caVente;
    coutAchats += coutVente;
    unitesVendues += v.quantite;

    const prodNom = prod?.nom || 'Produit inconnu';
    if (!productStatsMap[prodNom]) {
      productStatsMap[prodNom] = { nom: prodNom, quantite: 0, ca: 0, benefice: 0 };
    }
    productStatsMap[prodNom].quantite += v.quantite;
    productStatsMap[prodNom].ca += caVente;
    productStatsMap[prodNom].benefice += benVente;
  });

  const allExpenses = await getExpenses();
  const boutiqueExpenses = allExpenses.filter(e => e.boutique_id === boutiqueId);
  const totalExpenses = boutiqueExpenses.reduce((sum, e) => sum + e.amount, 0);

  const beneficeNet = chiffreAffaires - coutAchats - totalExpenses;

  const topProduits = Object.values(productStatsMap)
    .sort((a, b) => b.benefice - a.benefice)
    .slice(0, 5);

  const monthlySales = [
    { month: 'Jan', ca: Math.round(chiffreAffaires * 0.1), benefice: Math.max(0, Math.round(beneficeNet * 0.1)) },
    { month: 'Fév', ca: Math.round(chiffreAffaires * 0.15), benefice: Math.max(0, Math.round(beneficeNet * 0.15)) },
    { month: 'Mar', ca: Math.round(chiffreAffaires * 0.2), benefice: Math.max(0, Math.round(beneficeNet * 0.2)) },
    { month: 'Avr', ca: Math.round(chiffreAffaires * 0.25), benefice: Math.max(0, Math.round(beneficeNet * 0.25)) },
    { month: 'Mai', ca: Math.round(chiffreAffaires * 0.3), benefice: Math.max(0, Math.round(beneficeNet * 0.3)) },
  ];

  return {
    boutiqueId,
    nomBoutique: boutique.nom,
    chiffreAffaires,
    coutAchats,
    totalExpenses,
    beneficeNet,
    unitesVendues,
    topProduits,
    monthlySales
  };
}

export async function getAllStockAlerts(): Promise<StockAlert[]> {
  const boutiques = await getBoutiques();
  const alerts: StockAlert[] = [];

  for (const b of boutiques) {
    const prods = await getProduits(b.id);
    prods.forEach(p => {
      if (p.quantite_stock <= p.seuil_alerte) {
        alerts.push({
          produitId: p.id,
          produitNom: p.nom,
          boutiqueId: b.id,
          boutiqueNom: b.nom,
          quantiteStock: p.quantite_stock,
          seuilAlerte: p.seuil_alerte
        });
      }
    });
  }

  return alerts;
}
