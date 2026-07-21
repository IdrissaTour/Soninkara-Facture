'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  ArrowLeft,
  Search,
  FileText,
  Package,
  BarChart3,
  UserPlus,
  X
} from 'lucide-react';
import { getBoutiqueById, getProduits, getVentes, createVenteAction } from '@/lib/actions/boutiques';
import { getClients, createClientAction } from '@/lib/actions/db';
import { Boutique, Produit, Vente, Client } from '@/lib/types';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';

export default function VentesBoutiquePage() {
  const params = useParams();
  const boutiqueId = params.id as string;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quick Sale Drawer / Modal
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number | ''>('');
  const [genererFacture, setGenererFacture] = useState(false);
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline Quick Client Form State
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const handleCreateInlineClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      setError('Veuillez renseigner le nom du nouveau client');
      return;
    }

    try {
      setCreatingClient(true);
      setError(null);
      const createdClient = await createClientAction({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
        email: newClientEmail.trim() || null,
        address: null
      });

      setClients(prev => [createdClient, ...prev]);
      setClientId(createdClient.id);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du client';
      setError(msg);
    } finally {
      setCreatingClient(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, pData, vData, cData] = await Promise.all([
          getBoutiqueById(boutiqueId),
          getProduits(boutiqueId),
          getVentes(boutiqueId),
          getClients()
        ]);
        setBoutique(bData);
        setProduits(pData);
        setVentes(vData);
        setClients(cData);
      } catch (err) {
        console.error('Error loading sales data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [boutiqueId]);

  const handleProductSelect = (prodId: string) => {
    setSelectedProdId(prodId);
    const prod = produits.find(p => p.id === prodId);
    if (prod) {
      setPrixUnitaire(prod.prix_vente);
    }
  };

  const handleOpenSaleModal = () => {
    if (produits.length > 0) {
      handleProductSelect(produits[0].id);
    }
    setQuantite(1);
    setGenererFacture(false);
    setClientId(clients.length > 0 ? clients[0].id : '');
    setNotes('');
    setShowNewClientForm(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setError(null);
    setSaleModalOpen(true);
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || !quantite || prixUnitaire === '') {
      setError('Veuillez sélectionner un produit et valider les prix');
      return;
    }

    const prod = produits.find(p => p.id === selectedProdId);
    if (prod && quantite > prod.quantite_stock) {
      setError(`Quantité en stock insuffisante (Disponible: ${prod.quantite_stock} un.)`);
      return;
    }

    if (genererFacture && !clientId) {
      setError('Veuillez sélectionner un client pour la facturation');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createVenteAction(
        {
          boutique_id: boutiqueId,
          produit_id: selectedProdId,
          quantite,
          prix_unitaire: Number(prixUnitaire)
        },
        {
          genererFacture,
          client_id: clientId || undefined,
          notes: notes || undefined
        }
      );

      // Refresh list
      const [updatedVentes, updatedProds] = await Promise.all([
        getVentes(boutiqueId),
        getProduits(boutiqueId)
      ]);
      setVentes(updatedVentes);
      setProduits(updatedProds);
      setSaleModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la vente';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVentes = ventes.filter(v => {
    const prodNom = v.produit?.nom || '';
    return prodNom.toLowerCase().includes(search.toLowerCase());
  });

  const totalSalesCount = ventes.length;
  const totalRevenue = ventes.reduce((acc, v) => acc + (v.quantite * v.prix_unitaire), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/boutiques"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{boutique?.nom || 'Boutique'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Historique des Ventes & Enregistrement Rapide
            </h1>
          </div>
        </div>

        <button
          onClick={handleOpenSaleModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Enregistrer une Vente
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stock`}
          className="flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Package className="h-4 w-4" />
          Inventaire Stock
        </Link>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/ventes`}
          className="flex items-center gap-2 border-b-2 border-brand-600 pb-3 text-sm font-bold text-brand-600"
        >
          <ShoppingBag className="h-4 w-4" />
          Ventes & Caisse
        </Link>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stats`}
          className="flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          Statistiques & Bénéfices
        </Link>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nombre de Ventes Effectuées</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalSalesCount} transactions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Chiffre d&apos;Affaires Encaissé</span>
          <div className="mt-2 text-2xl font-extrabold text-brand-600">{formatFCFA(totalRevenue)}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-premium overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Produit</th>
                <th className="px-6 py-3.5">Quantité</th>
                <th className="px-6 py-3.5">Prix Unitaire</th>
                <th className="px-6 py-3.5">Total Vente</th>
                <th className="px-6 py-3.5">Facture Liée</th>
                <th className="px-6 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Chargement de l&apos;historique...
                  </td>
                </tr>
              ) : filteredVentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Aucune vente enregistrée.
                  </td>
                </tr>
              ) : (
                filteredVentes.map((v) => {
                  const prodName = v.produit?.nom || 'Article de boutique';
                  const totalVente = v.quantite * v.prix_unitaire;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {prodName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {v.quantite} un.
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {formatFCFA(v.prix_unitaire)}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-brand-600 text-sm">
                        {formatFCFA(totalVente)}
                      </td>
                      <td className="px-6 py-4">
                        {v.facture_id ? (
                          <Link
                            href={`/dashboard/invoices/${v.facture_id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" /> Facture émise
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Vente directe en caisse</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                        {v.created_at ? formatDateFrench(v.created_at) : 'Récemment'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Modal / Drawer */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Enregistrer une Vente</h3>
                <p className="text-xs text-slate-500">Sélectionnez le produit et validez la sortie de stock</p>
              </div>
              <button
                onClick={() => setSaleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Produit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none"
                >
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} — En stock: {p.quantite_stock} un. — {formatFCFA(p.prix_vente)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantité <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantite}
                    onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prix unitaire FCFA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prixUnitaire}
                    onChange={(e) => setPrixUnitaire(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Vente</span>
                <span className="text-base font-extrabold text-brand-600">
                  {formatFCFA((quantite || 0) * (Number(prixUnitaire) || 0))}
                </span>
              </div>

              {/* Option Générer Facture */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genererFacture}
                    onChange={(e) => setGenererFacture(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Générer automatiquement une Facture Client
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Émet la facture avec TVA 18% et l&apos;ajoute à la liste des factures.
                    </span>
                  </div>
                </label>

                {genererFacture && (
                  <div className="pl-7 space-y-3 pt-1 animate-fadeIn">
                    {!showNewClientForm ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Sélectionner le Client <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowNewClientForm(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            <UserPlus className="h-3 w-3" /> + Nouveau client
                          </button>
                        </div>
                        <select
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none"
                        >
                          <option value="">-- Sélectionner un client --</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email || 'N/A'})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                            <UserPlus className="h-3.5 w-3.5 text-brand-600" />
                            Créer un nouveau client
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowNewClientForm(false)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Sélectionner existant
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nom du client <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="ex: Mamadou Diop"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone</label>
                            <input
                              type="text"
                              placeholder="ex: +221 77 000 00 00"
                              value={newClientPhone}
                              onChange={(e) => setNewClientPhone(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail</label>
                            <input
                              type="email"
                              placeholder="ex: client@gmail.com"
                              value={newClientEmail}
                              onChange={(e) => setNewClientEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowNewClientForm(false)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateInlineClient}
                            disabled={creatingClient}
                            className="rounded-lg bg-brand-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50"
                          >
                            {creatingClient ? 'Création...' : 'Ajouter et sélectionner'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaleModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Validation...' : 'Valider la Vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
