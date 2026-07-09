'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Printer, Calendar, Receipt, User, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { mockCompany } from '@/lib/mock-data';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { InvoiceStatus, Invoice, InvoiceItem, Company } from '@/lib/types';
import { clsx } from 'clsx';
import { getInvoiceById, updateInvoiceStatusAction, deleteInvoiceAction, getCompany } from '@/lib/actions/db';

interface PageProps {
  params: {
    id: string;
  };
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<InvoiceStatus | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    async function loadData() {
      const result = await getInvoiceById(params.id);
      if (result) {
        setInvoice(result.invoice);
        setItems(result.items);
        setStatus(result.invoice.status);
      }
      const comp = await getCompany();
      setCompany(comp);
    }
    loadData();
  }, [params.id]);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-slate-800">Facture introuvable</h3>
        <p className="text-xs text-slate-500 mt-1">La facture demandée n&apos;existe pas ou a été déplacée.</p>
        <Link href="/dashboard/invoices" className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
          Retour aux factures
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setStatus(newStatus);
    await updateInvoiceStatusAction(params.id, newStatus);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture définitivement ?')) {
      const success = await deleteInvoiceAction(params.id);
      if (success) {
        router.push('/dashboard/invoices');
      } else {
        alert('Erreur lors de la suppression de la facture.');
      }
    }
  };

  const getStatusBadge = (statusVal: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { label: string; classes: string }> = {
      paid: { label: 'Payée', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      sent: { label: 'Envoyée', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
      draft: { label: 'Brouillon', classes: 'bg-slate-100 text-slate-800 border-slate-200' },
      overdue: { label: 'En retard', classes: 'bg-rose-100 text-rose-800 border-rose-200' }
    };
    const config = configs[statusVal] || configs.draft;
    return (
      <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.classes)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    );
  };

  const currentCompany = company || mockCompany;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Header Banner - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-slate-900 text-white p-4 rounded-2xl shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Retour au registre
          </Link>
          <div className="flex items-center gap-2 sm:border-l sm:border-slate-700 sm:pl-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Statut :</span>
            <select
              value={status || ''}
              onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link
            href={`/dashboard/invoices/${params.id}/edit`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-950/40 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-900/60 transition-colors border border-rose-900/40"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/10"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Invoice Document Paper Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-premium print-shadow-none print-only:p-0 print-invoice-sheet">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {currentCompany.logo_url ? (
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentCompany.logo_url} alt="Logo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-brand-500/20 shrink-0">
                  <Receipt className="h-5.5 w-5.5" />
                </div>
              )}
              <span className="text-xl font-black tracking-tight text-slate-900">{currentCompany.name}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">FACTURE</h2>
            <p className="text-xs font-bold text-brand-600 mt-1">{invoice.invoice_number}</p>
          </div>

          <div className="text-left sm:text-right space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800">{currentCompany.name}</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed flex sm:justify-end gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{currentCompany.address}</span>
            </p>
            {currentCompany.phone && (
              <p className="text-xs text-slate-500 flex sm:justify-end gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{currentCompany.phone}</span>
              </p>
            )}
            {currentCompany.email && (
              <p className="text-xs text-slate-500 flex sm:justify-end gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{currentCompany.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Invoice Metadata (Dates, Status) & Client details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          {/* Bill To */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturé à</span>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {invoice.client?.name}
              </h4>
              {invoice.client?.address && (
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{invoice.client.address}</span>
                </p>
              )}
              {invoice.client?.phone && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.client.phone}</span>
                </p>
              )}
              {invoice.client?.email && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.client.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Dates & Status info */}
          <div className="flex flex-col justify-between sm:items-end">
            <div className="space-y-1.5 text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Informations de facturation</span>
              <p className="text-xs text-slate-600 flex sm:justify-end items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Date d&apos;émission : <strong>{formatDateFrench(invoice.issue_date)}</strong></span>
              </p>
              <p className="text-xs text-slate-600 flex sm:justify-end items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Date d&apos;échéance : <strong>{formatDateFrench(invoice.due_date)}</strong></span>
              </p>
            </div>

            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Statut de la facture</span>
              {getStatusBadge(status || invoice.status)}
            </div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="py-8">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">Détails des prestations</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center w-20">Quantité</th>
                  <th className="py-3 px-2 text-right w-36">Prix unitaire</th>
                  <th className="py-3 px-2 text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-2 font-medium">{item.description}</td>
                    <td className="py-4 px-2 text-center font-semibold">{item.quantity}</td>
                    <td className="py-4 px-2 text-right font-semibold">{formatFCFA(item.unit_price)}</td>
                    <td className="py-4 px-2 text-right font-bold text-slate-900">{formatFCFA(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Calculations Breakdown & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 print-avoid-break">
          {/* Terms & Notes */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes et conditions de règlement</span>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-16">
                {invoice.notes || 'Aucune mention spécifique ajoutée.'}
              </p>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total HT</span>
                <span className="font-semibold text-slate-900">{formatFCFA(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA (18%)</span>
                <span className="font-semibold text-slate-900">{formatFCFA(invoice.tva)}</span>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total à payer</span>
                <span className="text-brand-600">{formatFCFA(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Footer message */}
        <div className="mt-16 text-center text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-6">
          <p>Merci pour votre collaboration ! Une pénalité de retard de 10% s&apos;applique après la date d&apos;échéance.</p>
        </div>
      </div>
    </div>
  );
}
