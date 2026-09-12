'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Droplets, 
  Zap, 
  Wifi, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  Gauge,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { AutresInvoice, InvoiceStatus } from '@/lib/types';
import { clsx } from 'clsx';
import { getAutresInvoices } from '@/lib/actions/other-invoices';

type ServiceTypeFilter = 'all' | 'eau' | 'electricite' | 'connexion';

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as ServiceTypeFilter) || 'all';

  const [invoices, setInvoices] = useState<AutresInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceTypeFilter>(
    ['all', 'eau', 'electricite', 'connexion'].includes(initialType) ? initialType : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAutresInvoices();
        setInvoices(data);
      } catch (err) {
        console.error('Error loading service invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const safeInvoices = invoices || [];

  // Filter invoices
  const filteredInvoices = safeInvoices.filter((invoice) => {
    // 1. Filter by Service Type (Eau, Électricité, Connexion)
    if (activeTab !== 'all' && invoice.type_facture !== activeTab) {
      return false;
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

  // Calculate totals for KPI cards
  const eauInvoices = safeInvoices.filter(i => i.type_facture === 'eau');
  const elecInvoices = safeInvoices.filter(i => i.type_facture === 'electricite');
  const wifiInvoices = safeInvoices.filter(i => i.type_facture === 'connexion');

  const totalEau = eauInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalElec = elecInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalWifi = wifiInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalGeneral = safeInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const getStatusBadge = (status: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { label: string; classes: string; icon: typeof CheckCircle2 }> = {
      paid: { label: 'Payée', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      sent: { label: 'Envoyée', classes: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
      draft: { label: 'Brouillon', classes: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
      overdue: { label: 'En retard', classes: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle }
    };
    const config = configs[status] || configs.draft;
    const IconComponent = config.icon;
    return (
      <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.classes)}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'eau':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200/80">
            <Droplets className="h-3.5 w-3.5 text-sky-600" />
            Facture Eau
          </span>
        );
      case 'electricite':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Facture Électricité
          </span>
        );
      case 'connexion':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80">
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            Forfait Wifi / Internet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            <Gauge className="h-3.5 w-3.5 text-slate-600" />
            {type}
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-64 rounded-xl bg-slate-200/80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/80 animate-pulse" />
          ))}
        </div>
        <div className="h-96 w-full rounded-3xl bg-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md mb-3 border border-white/10">
            <Gauge className="h-3.5 w-3.5 text-brand-300" />
            Facturation de Services & Compteurs
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Factures Eau, Électricité & Wifi
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mt-1">
            Gérez vos factures sur relevés d&apos;index de compteur (Eau, Électricité) et vos abonnements Wifi/Internet connectés à Supabase.
          </p>
        </div>

        {/* Quick Create Buttons */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <Link
            href="/dashboard/invoices/new?type=eau"
            className="flex items-center gap-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 px-3.5 py-2.5 text-xs font-bold transition-all hover:scale-102"
          >
            <Droplets className="h-4 w-4 text-sky-300" />
            Facture Eau
          </Link>

          <Link
            href="/dashboard/invoices/new?type=electricite"
            className="flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 px-3.5 py-2.5 text-xs font-bold transition-all hover:scale-102"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            Facture Électricité
          </Link>

          <Link
            href="/dashboard/invoices/new?type=connexion"
            className="flex items-center gap-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-3.5 py-2.5 text-xs font-bold transition-all hover:scale-102"
          >
            <Wifi className="h-4 w-4 text-emerald-300" />
            Forfait Wifi
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total General */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Services Facturé</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Gauge className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalGeneral)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{safeInvoices.length} factures au total</p>
        </div>

        {/* Total Eau */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Compteurs Eau 💧</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Droplets className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalEau)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{eauInvoices.length} factures d&apos;eau</p>
        </div>

        {/* Total Électricité */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Compteurs Électricité ⚡</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalElec)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{elecInvoices.length} factures électricité</p>
        </div>

        {/* Total Wifi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Abonnements Wifi 📶</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wifi className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatFCFA(totalWifi)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{wifiInvoices.length} forfaits Wifi</p>
        </div>
      </div>

      {/* Navigation Tabs for Services */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <Gauge className="h-4 w-4" />
            Tous les Services
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {safeInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('eau')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              activeTab === 'eau'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <Droplets className="h-4 w-4 text-sky-400" />
            Factures Eau
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', activeTab === 'eau' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {eauInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('electricite')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              activeTab === 'electricite'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <Zap className="h-4 w-4 text-amber-300" />
            Factures Électricité
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', activeTab === 'electricite' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {elecInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connexion')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0',
              activeTab === 'connexion'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            )}
          >
            <Wifi className="h-4 w-4 text-emerald-300" />
            Wifi / Internet
            <span className={clsx('ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold', activeTab === 'connexion' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
              {wifiInvoices.length}
            </span>
          </button>
        </div>

        <Link
          href="/dashboard/invoices/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Créer une facture
        </Link>
      </div>

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
                  <th className="py-4 px-6">Service</th>
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Compteur N° / Index</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date d&apos;émission
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('total')}>
                    <div className="flex items-center gap-1">
                      Total TTC
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
                      {invoice.client?.name || 'Client Général'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {invoice.compteur?.numero_compteur ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{invoice.compteur.numero_compteur}</span>
                          {invoice.consommation !== undefined && invoice.consommation !== null && (
                            <span className="text-[10px] text-slate-400">Conso: {invoice.consommation} {invoice.compteur.unite || ''}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDateFrench(invoice.issue_date)}
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
              <Gauge className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Aucune facture de service trouvée</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {searchQuery || statusFilter !== 'all' || activeTab !== 'all'
                ? "Essayez de modifier vos critères de recherche ou vos filtres."
                : "Émettez votre première facture d'eau, d'électricité ou forfait wifi."}
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

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement des services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
