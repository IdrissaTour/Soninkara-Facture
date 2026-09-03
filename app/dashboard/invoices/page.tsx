'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Plus, FileText, ArrowUpDown, Droplets, Zap, Wifi, ShoppingBag, Gauge } from 'lucide-react';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { InvoiceStatus, Invoice, InvoiceType } from '@/lib/types';
import { clsx } from 'clsx';
import { getInvoices } from '@/lib/actions/db';

type MainTab = 'all' | 'charges' | 'produits';
type ChargeSubTab = 'all' | 'eau' | 'electricite' | 'connexion';

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialTabParam = searchParams.get('tab') as MainTab | null;
  const initialTypeParam = searchParams.get('type') as InvoiceType | null;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    if (initialTabParam && ['all', 'charges', 'produits'].includes(initialTabParam)) {
      return initialTabParam;
    }
    if (initialTypeParam) {
      return initialTypeParam === 'produits' ? 'produits' : 'charges';
    }
    return 'all';
  });

  const [chargeSubTab, setChargeSubTab] = useState<ChargeSubTab>(() => {
    if (initialTypeParam && ['eau', 'electricite', 'connexion'].includes(initialTypeParam)) {
      return initialTypeParam as ChargeSubTab;
    }
    return 'all';
  });

  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getInvoices();
        setInvoices(data);
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync tab state if searchParams change
  useEffect(() => {
    if (initialTabParam && ['all', 'charges', 'produits'].includes(initialTabParam)) {
      setMainTab(initialTabParam);
    }
    if (initialTypeParam && ['eau', 'electricite', 'connexion'].includes(initialTypeParam)) {
      setMainTab('charges');
      setChargeSubTab(initialTypeParam as ChargeSubTab);
    }
  }, [initialTabParam, initialTypeParam]);

  const safeInvoices = invoices || [];

  // Filter invoices based on main tab, sub tab, query, and status selector
  const filteredInvoices = safeInvoices.filter((invoice) => {
    const invType = invoice.type_facture || 'produits';

    // 1. Filter by Main Tab
    if (mainTab === 'produits') {
      if (invType !== 'produits') return false;
    } else if (mainTab === 'charges') {
      if (invType === 'produits') return false;
      // Filter by Charge Sub Tab
      if (chargeSubTab !== 'all' && invType !== chargeSubTab) {
        return false;
      }
    }

    // 2. Filter by Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      invoice.invoice_number.toLowerCase().includes(query) ||
      (invoice.client?.name && invoice.client.name.toLowerCase().includes(query)) ||
      (invoice.compteur?.numero_compteur && invoice.compteur.numero_compteur.toLowerCase().includes(query));

    // 3. Filter by Status
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortField === 'date') {
      const timeA = new Date(a.issue_date).getTime();
      const timeB = new Date(b.issue_date).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    } else {
      return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
    }
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { label: string; classes: string }> = {
      paid: { label: 'Payée', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      sent: { label: 'Envoyée', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
      draft: { label: 'Brouillon', classes: 'bg-slate-100 text-slate-800 border-slate-200' },
      overdue: { label: 'En retard', classes: 'bg-rose-100 text-rose-800 border-rose-200' }
    };
    const config = configs[status] || configs.draft;
    return (
      <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.classes)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type?: InvoiceType) => {
    switch (type) {
      case 'eau':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200/80">
            <Droplets className="h-3.5 w-3.5 text-sky-600" />
            Eau
          </span>
        );
      case 'electricite':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Électricité
          </span>
        );
      case 'connexion':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80">
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            Wifi / Internet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/80">
            <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
            Produits
          </span>
        );
    }
  };

  const toggleSort = (field: 'date' | 'total') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Counts calculation for tabs
  const chargesCount = safeInvoices.filter(i => i.type_facture && i.type_facture !== 'produits').length;
  const produitsCount = safeInvoices.filter(i => !i.type_facture || i.type_facture === 'produits').length;
  const allCount = safeInvoices.length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-48 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="h-10 w-36 rounded-xl bg-slate-200/80 animate-pulse" />
        </div>
        <div className="h-14 w-full rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-96 w-full rounded-3xl bg-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registre des factures</h2>
          <p className="text-xs text-slate-500">Visualisez et filtrez vos factures par charges (Eau, Électricité, Wifi) ou produits.</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Émettre une facture
        </Link>
      </div>

      {/* Main Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setMainTab('all')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              mainTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <FileText className="h-4 w-4" />
            Toutes les Factures
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', mainTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {allCount}
            </span>
          </button>

          <button
            onClick={() => setMainTab('charges')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              mainTab === 'charges'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <div className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              <Zap className="h-3.5 w-3.5" />
              <Wifi className="h-3.5 w-3.5" />
            </div>
            Factures Charges (Eau, Élec, Wifi)
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', mainTab === 'charges' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {chargesCount}
            </span>
          </button>

          <button
            onClick={() => setMainTab('produits')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              mainTab === 'produits'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Factures Produits
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', mainTab === 'produits' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {produitsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-pills for Charges tab */}
      {mainTab === 'charges' && (
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 animate-fadeIn">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5 text-brand-600" />
            Filtrer les charges par type :
          </span>
          {[
            { id: 'all', label: 'Toutes les charges', icon: null },
            { id: 'eau', label: 'Factures Eau', icon: Droplets, color: 'text-sky-600' },
            { id: 'electricite', label: 'Factures Électricité', icon: Zap, color: 'text-amber-600' },
            { id: 'connexion', label: 'Wifi / Internet', icon: Wifi, color: 'text-emerald-600' },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setChargeSubTab(tab.id as ChargeSubTab)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all duration-150',
                  chargeSubTab === tab.id
                    ? 'bg-white border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                )}
              >
                {IconComp && <IconComp className={clsx('h-3.5 w-3.5', tab.color)} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters and search panel */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-premium">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° facture, client ou N° compteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 px-1">
            <Filter className="h-3.5 w-3.5" />
            Statut :
          </span>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'draft', label: 'Brouillons' },
            { id: 'sent', label: 'Envoyées' },
            { id: 'paid', label: 'Payées' },
            { id: 'overdue', label: 'En retard' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all duration-150',
                statusFilter === tab.id
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Display */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-premium overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-4 px-6">Numéro</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Client</th>
                  {(mainTab === 'charges' || mainTab === 'all') && <th className="py-4 px-6">Compteur N°</th>}
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date d&apos;émission
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Échéance</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('total')}>
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {invoice.invoice_number}
                    </td>
                    <td className="py-4 px-6">
                      {getTypeBadge(invoice.type_facture)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {invoice.client?.name}
                    </td>
                    {(mainTab === 'charges' || mainTab === 'all') && (
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {invoice.compteur?.numero_compteur || '-'}
                      </td>
                    )}
                    <td className="py-4 px-6 text-slate-500">
                      {formatDateFrench(invoice.issue_date)}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDateFrench(invoice.due_date)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatFCFA(invoice.total)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Consulter
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Aucune facture trouvée</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {searchQuery || statusFilter !== 'all' || (mainTab === 'charges' && chargeSubTab !== 'all')
                ? "Essayez de modifier vos critères de recherche ou vos filtres."
                : mainTab === 'charges'
                ? "Aucune facture de charge enregistrée pour le moment."
                : "Commencez par émettre votre première facture pour être payé plus rapidement."}
            </p>
            <Link
              href="/dashboard/invoices/new"
              className="mt-4 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all duration-150"
            >
              Émettre une facture
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement du registre...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}


