'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  Plus,
  ArrowLeft,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  ShoppingBag,
  BarChart3,
  Trash2,
  ImageIcon,
  Pencil,
  X
} from 'lucide-react';
import { getBoutiqueById, getProduits, adjustStockAction, deleteProduitAction } from '@/lib/actions/boutiques';
import { Boutique, Produit, MouvementType } from '@/lib/types';
import { formatFCFA } from '@/lib/utils/invoice';

export default function StockBoutiquePage() {
  const params = useParams();
  const boutiqueId = params.id as string;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Produit | null>(null);
  const [adjustType, setAdjustType] = useState<MouvementType>('entree');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustMotif, setAdjustMotif] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, pData] = await Promise.all([
          getBoutiqueById(boutiqueId),
          getProduits(boutiqueId)
        ]);
        setBoutique(bData);
        setProduits(pData);
      } catch (err) {
        console.error('Error loading stock:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [boutiqueId]);

  const filteredProduits = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStockCount = produits.filter(p => p.quantite_stock <= p.seuil_alerte).length;
  const totalStockValue = produits.reduce((acc, p) => acc + (p.quantite_stock * p.prix_achat), 0);

  const handleOpenAdjust = (prod: Produit) => {
    setSelectedProd(prod);
    setAdjustType('entree');
    setAdjustQty(1);
    setAdjustMotif('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    try {
      setAdjusting(true);
      await adjustStockAction(selectedProd.id, adjustType, adjustQty, adjustMotif);
      
      // Refresh list
      const updated = await getProduits(boutiqueId);
      setProduits(updated);
      setAdjustModalOpen(false);
    } catch (err) {
      console.error('Error adjusting stock:', err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleDeleteProduit = async (produitId: string, produitNom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${produitNom}" ?Cette action retirera le produit du catalogue de cette boutique.`)) {
      try {
        const success = await deleteProduitAction(produitId, boutiqueId);
        if (success) {
          setProduits(produits.filter(p => p.id !== produitId));
        } else {
          alert('Erreur lors de la suppression du produit.');
        }
      } catch {
        alert('Erreur de communication avec le serveur.');
      }
    }
  };

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
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">{boutique?.devise || 'FCFA'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Inventaire & Gestion des Stocks
            </h1>
          </div>
        </div>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stock/nouveau`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nouveau Produit
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stock`}
          className="flex items-center gap-2 border-b-2 border-brand-600 pb-3 text-sm font-bold text-brand-600"
        >
          <Package className="h-4 w-4" />
          Inventaire Stock
        </Link>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/ventes`}
          className="flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Références</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{produits.length} produits</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Alertes Stock Bas</span>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-2xl font-extrabold text-slate-900">{lowStockCount}</div>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-3 w-3" /> À réapprovisionner
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valeur Totale du Stock (Achat)</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">{formatFCFA(totalStockValue)}</div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-premium overflow-hidden">
        {/* Search Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Produit</th>
                <th className="px-6 py-3.5">Prix Achat</th>
                <th className="px-6 py-3.5">Prix Vente</th>
                <th className="px-6 py-3.5">Quantité Stock</th>
                <th className="px-6 py-3.5">Statut Stock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Chargement de l&apos;inventaire...
                  </td>
                </tr>
              ) : filteredProduits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Aucun produit trouvé.
                  </td>
                </tr>
              ) : (
                filteredProduits.map((p) => {
                  const isLow = p.quantite_stock <= p.seuil_alerte;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <div className="h-10 w-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image_url} alt={p.nom} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 shrink-0">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{p.nom}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">Réf: {p.reference || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{formatFCFA(p.prix_achat)}</td>
                      <td className="px-6 py-4 font-bold text-brand-600">{formatFCFA(p.prix_vente)}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                        {p.quantite_stock} un.
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Alerte ({p.quantite_stock} ≤ {p.seuil_alerte})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Stock Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/boutiques/${boutiqueId}/stock/${p.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-brand-600 bg-brand-50/50 hover:bg-brand-100/60 transition-colors"
                            title="Modifier ce produit"
                          >
                            <Pencil className="h-3.5 w-3.5 text-brand-600" />
                            Modifier
                          </Link>

                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            title="Ajuster la quantité en stock"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                            Ajuster
                          </button>

                          <button
                            onClick={() => handleDeleteProduit(p.id, p.nom)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ajustement du Stock</h3>
                <p className="text-xs text-slate-500">{selectedProd.nom}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Type d&apos;opération</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('entree')}
                    className={`flex items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                      adjustType === 'entree'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" /> Entrée
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('sortie')}
                    className={`flex items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                      adjustType === 'sortie'
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" /> Sortie
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('ajustement')}
                    className={`flex items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                      adjustType === 'ajustement'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" /> Valeur fixe
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {adjustType === 'ajustement' ? 'Nouvelle quantité exacte' : 'Quantité à ajouter / retirer'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Motif / Commentaire</label>
                <input
                  type="text"
                  placeholder="ex: Inventaire mensuel, Casse, Réapprovisionnement"
                  value={adjustMotif}
                  onChange={(e) => setAdjustMotif(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {adjusting ? 'Validation...' : 'Valider l&apos;ajustement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
