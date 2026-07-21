'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Plus, Package, AlertTriangle, TrendingUp, ShoppingBag, BarChart3, Building2, Tag } from 'lucide-react';
import { getBoutiques, getAllStockAlerts } from '@/lib/actions/boutiques';
import { Boutique, StockAlert } from '@/lib/types';
import { formatFCFA } from '@/lib/utils/invoice';

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, aData] = await Promise.all([
          getBoutiques(),
          getAllStockAlerts()
        ]);
        setBoutiques(bData);
        setAlerts(aData);
      } catch (err) {
        console.error('Error loading boutiques:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalRevenueAll = boutiques.reduce((acc, b) => acc + (b.total_revenue || 0), 0);
  const totalExpensesAll = boutiques.reduce((acc, b) => acc + (b.total_expenses || 0), 0);
  const totalProductsAll = boutiques.reduce((acc, b) => acc + (b.produits_count || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5" />
              Gestion Multi-Boutiques & Stocks
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Vos Boutiques & Points de Vente
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Gérez votre inventaire, enregistrez vos ventes, affectez vos dépenses par point de vente et contrôlez votre bénéfice net en direct.
            </p>
          </div>

          <Link
            href="/dashboard/boutiques/nouvelle"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all duration-200 shrink-0"
          >
            <Plus className="h-5 w-5" />
            Nouvelle Boutique
          </Link>
        </div>

        {/* Decorative SVG background shapes */}
        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
          <Store className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Global Low Stock Warning Banner if alerts exist */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Alerte de Stock Bas ({alerts.length} produit{alerts.length > 1 ? 's' : ''})
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Certains articles ont atteint ou dépassé leur seuil minimal de réapprovisionnement.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {alerts.slice(0, 3).map(alert => (
                  <span
                    key={alert.produitId}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 border border-rose-200 shadow-xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {alert.produitNom} ({alert.quantiteStock} en stock dans {alert.boutiqueNom})
                  </span>
                ))}
                {alerts.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-rose-700">
                    +{alerts.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Boutiques Actives</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-brand-600">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">{boutiques.length}</div>
            <p className="text-xs text-slate-500 mt-1">Points de vente configurés</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Produits</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">{totalProductsAll}</div>
            <p className="text-xs text-slate-500 mt-1">Articles référencés en stock</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d&apos;Affaires</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">{formatFCFA(totalRevenueAll)}</div>
            <p className="text-xs text-slate-500 mt-1">Cumul des ventes réalisées</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dépenses Boutiques</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-rose-600">{formatFCFA(totalExpensesAll)}</div>
            <p className="text-xs text-slate-500 mt-1">Total des charges affectées</p>
          </div>
        </div>
      </div>

      {/* Boutiques List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Liste des Boutiques</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse h-48" />
            ))}
          </div>
        ) : boutiques.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-4">
              <Store className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Aucune boutique créée pour le moment</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajoutez votre première boutique pour suivre vos produits, gérer vos stocks et enregistrer vos ventes en direct.
            </p>
            <Link
              href="/dashboard/boutiques/nouvelle"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Créer une boutique
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {boutiques.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium card-hover-effect flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-600 font-bold text-sm">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{b.nom}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{b.adresse || 'Adresse non renseignée'}</p>
                      </div>
                    </div>

                    {b.low_stock_count && b.low_stock_count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-700 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {b.low_stock_count} stock bas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Stock OK
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Produits</span>
                      <span className="text-sm md:text-base font-extrabold text-slate-800">{b.produits_count || 0} réf.</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ventes</span>
                      <span className="text-sm md:text-base font-extrabold text-brand-600">{formatFCFA(b.total_revenue || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Dépenses</span>
                      <span className="text-sm md:text-base font-extrabold text-rose-600">{formatFCFA(b.total_expenses || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Links */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/boutiques/${b.id}/stock`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    Stock
                  </Link>

                  <Link
                    href={`/dashboard/boutiques/${b.id}/ventes`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-brand-600" />
                    Ventes
                  </Link>

                  <Link
                    href={`/dashboard/boutiques/${b.id}/stats`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Statistiques de la boutique"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
