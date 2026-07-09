'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Save, Receipt, Calendar, User, Send } from 'lucide-react';
import { calculateInvoiceTotals, formatFCFA } from '@/lib/utils/invoice';
import { Client, InvoiceStatus } from '@/lib/types';
import { getClients, getInvoiceById, updateInvoiceAction } from '@/lib/actions/db';

interface FormItem {
  description: string;
  quantity: string;
  unit_price: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditInvoicePage({ params }: PageProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form fields state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue'>('draft');

  // Dynamic items lines state
  const [items, setItems] = useState<FormItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [clis, result] = await Promise.all([
          getClients(),
          getInvoiceById(params.id)
        ]);
        
        setClients(clis);
        
        if (result) {
          const { invoice, items: invItems } = result;
          setInvoiceNumber(invoice.invoice_number);
          setClientId(invoice.client_id);
          setIssueDate(invoice.issue_date);
          setDueDate(invoice.due_date);
          setStatus(invoice.status);
          setNotes(invoice.notes || '');
          
          if (invItems && invItems.length > 0) {
            setItems(invItems.map(item => ({
              description: item.description,
              quantity: String(item.quantity),
              unit_price: String(item.unit_price)
            })));
          } else {
            setItems([{ description: '', quantity: '1', unit_price: '0' }]);
          }
        } else {
          setFormError('Facture introuvable.');
        }
      } catch {
        setFormError('Erreur lors du chargement des données.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: '1', unit_price: '0' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItems(updated);
  };

  // Real-time calculations
  const parsedItemsForCalculation = items.map(item => ({
    quantity: parseFloat(item.quantity) || 0,
    unit_price: parseFloat(item.unit_price) || 0
  }));
  const { subtotal, tva, total } = calculateInvoiceTotals(parsedItemsForCalculation);

  const handleSave = async (targetStatus: 'draft' | 'sent' | 'paid' | 'overdue') => {
    setFormError('');

    // Validations
    if (!clientId) {
      setFormError('Veuillez sélectionner un client.');
      return;
    }

    const hasEmptyItem = items.some(item => !item.description.trim() || parseFloat(item.quantity) <= 0 || parseFloat(item.unit_price) < 0);
    if (hasEmptyItem) {
      setFormError('Veuillez renseigner correctement toutes les lignes de la facture (description obligatoire, quantité > 0).');
      return;
    }

    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: clientId,
      status: targetStatus,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tva,
      total,
      notes: notes || null,
    };

    const itemsData = items.map(item => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      return {
        description: item.description,
        quantity: q,
        unit_price: p,
        total: q * p
      };
    });

    try {
      await updateInvoiceAction(params.id, invoiceData, itemsData);
      router.push(`/dashboard/invoices/${params.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la facture.';
      setFormError(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-2"></div>
        <p className="text-xs text-slate-500">Chargement de la facture...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href={`/dashboard/invoices/${params.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Retour au détail de la facture
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Modifier la facture {invoiceNumber}</h2>
        </div>
      </div>

      {formError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-semibold animate-fadeIn">
          {formError}
        </div>
      )}

      {/* Main Form container */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form details input - Left column */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-premium">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2 flex items-center gap-1.5">
              <Receipt className="h-4.5 w-4.5 text-slate-400" />
              Informations générales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Sélectionner le client *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-colors"
                  required
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} ({client.phone || client.email || 'Pas de contact'})</option>
                  ))}
                </select>
              </div>

              {/* Invoice status selector (in editing mode we can change initial status as well) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-colors"
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyée</option>
                  <option value="paid">Payée</option>
                  <option value="overdue">En retard</option>
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date d&apos;émission *
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date d&apos;échéance *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Dynamic Items Lines */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lignes de facturation</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-brand-600" />
                  Ajouter une ligne
                </button>
              </div>

              <div className="space-y-3.5">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    {/* Description */}
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase sm:hidden mb-1">Description *</label>
                      <input
                        type="text"
                        placeholder="Description de la prestation..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-24">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase sm:hidden mb-1">Quantité *</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 text-center bg-white"
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-full sm:w-36">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase sm:hidden mb-1">Prix Unitaire (FCFA) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="P.U."
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 text-right bg-white font-semibold"
                        required
                      />
                    </div>

                    {/* Line Total display */}
                    <div className="w-full sm:w-32 text-right px-2 py-2 sm:py-0">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase sm:hidden mb-1">Total</label>
                      <span className="text-xs font-bold text-slate-800">
                        {formatFCFA((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                      </span>
                    </div>

                    {/* Delete Line button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="absolute right-3 top-3 sm:relative sm:top-0 sm:right-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note text area */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Conditions ou notes de bas de page</label>
              <textarea
                placeholder="Ex: Conditions de paiement : 30 jours net. Coordonnées bancaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Calculations Totals Sidebar - Right column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-premium">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Résumé financier</h3>
              
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total HT</span>
                  <span className="font-semibold text-slate-800">{formatFCFA(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span>TVA fiscale</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Taux harmonisé de 18%</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatFCFA(tva)}</span>
                </div>

                <div className="border-t border-slate-150 my-3 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total à émettre</span>
                  <span className="text-brand-600 text-base">{formatFCFA(total)}</span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSave(status === 'draft' ? 'sent' : status)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/10"
                >
                  <Send className="h-4 w-4" />
                  Mettre à jour & Envoyer
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer Brouillon
                </button>
                <Link
                  href={`/dashboard/invoices/${params.id}`}
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
