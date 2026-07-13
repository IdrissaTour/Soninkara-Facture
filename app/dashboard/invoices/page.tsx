'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, FileText, ArrowUpDown } from 'lucide-react';
import { mockInvoices } from '@/lib/mock-data';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { InvoiceStatus, Invoice } from '@/lib/types';
import { clsx } from 'clsx';
import { getInvoices } from '@/lib/actions/db';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadData() {
      const data = await getInvoices();
      setInvoices(data);
    }
    loadData();
  }, []);

  // Filter invoices based on queries and status selector
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const toggleSort = (field: 'date' | 'total') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registre des factures</h2>
          <p className="text-xs text-slate-500">Visualisez, filtrez et gérez vos documents de facturation clients.</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Émettre une facture
        </Link>
      </div>

      {/* Filters and search panel */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-premium">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 px-1">
            <Filter className="h-3.5 w-3.5" />
            Filtrer par :
          </span>
          {[
            { id: 'all', label: 'Toutes' },
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
                  <th className="py-4 px-6">Client</th>
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
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {invoice.client?.name}
                    </td>
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
              {searchQuery || statusFilter !== 'all'
                ? "Essayez de modifier vos critères de recherche ou vos filtres."
                : "Commencez par émettre votre première facture pour être payé plus rapidement."}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href="/dashboard/invoices/new"
                className="mt-4 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all duration-150"
              >
                Créer ma première facture
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
