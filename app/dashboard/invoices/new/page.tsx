'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Save, Receipt, Calendar, User, Send, Mic, X } from 'lucide-react';
import { calculateInvoiceTotals, formatFCFA } from '@/lib/utils/invoice';
import { Client } from '@/lib/types';
import { getClients, createInvoiceAction, getInvoices } from '@/lib/actions/db';
import { transcribeVoiceInvoice } from '@/lib/actions/voice';

import BoutonVocalFacture, { ExtractedFacture } from '@/components/voice/BoutonVocalFacture';

interface FormItem {
  description: string;
  quantity: string;
  unit_price: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Form fields state
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [applyTax, setApplyTax] = useState(true);

  // Dynamic items lines state
  const [items, setItems] = useState<FormItem[]>([
    { description: '', quantity: '1', unit_price: '0' }
  ]);

  // Multilingual Voice Assistant states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [texteOriginal, setTexteOriginal] = useState('');
  const [niveauConfiance, setNiveauConfiance] = useState<'haute' | 'moyenne' | 'basse' | ''>('');

  const handleFactureExtraite = (facture: ExtractedFacture, texteTranscrit: string) => {
    // 1. Tenter d'associer le client
    if (facture.client_nom) {
      const targetName = facture.client_nom.toLowerCase();
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase())
      );
      if (matchedClient) {
        setClientId(matchedClient.id);
      }
    }

    // 2. Pré-remplir la ligne de facture
    if (facture.produit || facture.quantite || facture.prix_unitaire) {
      setItems([
        {
          description: facture.produit || 'Prestation / Article dicté',
          quantity: String(facture.quantite || 1),
          unit_price: String(facture.prix_unitaire || 0),
        },
      ]);
    }

    setTexteOriginal(texteTranscrit);
    setNiveauConfiance(facture.confiance || 'moyenne');
    setShowVoiceModal(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [clis, invs] = await Promise.all([
          getClients(),
          getInvoices()
        ]);
        setClients(clis);
        
        const year = new Date().getFullYear();
        const count = invs.length + 1;
        setInvoiceNumber(`FAC-${year}-${String(count).padStart(3, '0')}`);
      } catch (err) {
        console.error('Error loading initial data for new invoice:', err);
      }
    }
    loadData();
  }, []);

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
  const { subtotal, tva: calculatedTva, total: calculatedTotal } = calculateInvoiceTotals(parsedItemsForCalculation);
  const tva = applyTax ? calculatedTva : 0;
  const total = applyTax ? calculatedTotal : subtotal;

  const handleSave = async (status: 'draft' | 'sent') => {
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

    // Refresh count just in case other invoices were added in the meantime
    let finalInvoiceNumber = invoiceNumber;
    try {
      const latestInvoices = await getInvoices();
      const year = new Date().getFullYear();
      const count = latestInvoices.length + 1;
      finalInvoiceNumber = `FAC-${year}-${String(count).padStart(3, '0')}`;
    } catch {
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = `FAC-${new Date().getFullYear()}-001`;
      }
    }

    const invoiceData = {
      invoice_number: finalInvoiceNumber,
      client_id: clientId,
      status: status,
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
      const savedInvoice = await createInvoiceAction(invoiceData, itemsData);
      router.push(`/dashboard/invoices/${savedInvoice.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la création de la facture.';
      setFormError(errorMsg);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Retour aux factures
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Émettre une nouvelle facture {invoiceNumber && `(${invoiceNumber})`}</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowVoiceModal(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-100 transition-all hover:scale-102 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Mic className="h-4.5 w-4.5 text-brand-600" />
          Saisie Vocale (Wolof, Bambara)
        </button>
      </div>

      {formError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-semibold animate-fadeIn">
          {formError}
        </div>
      )}

      {texteOriginal && (
        <div
          className={`rounded-2xl border p-4 text-xs font-semibold animate-fadeIn ${
            niveauConfiance === 'haute'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : niveauConfiance === 'moyenne'
              ? 'bg-amber-50 border-amber-100 text-amber-800'
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span>
              ⚠️ Vérifiez les champs remplis par la voix (Confiance : {niveauConfiance || 'moyenne'})
            </span>
            <button
              type="button"
              onClick={() => setTexteOriginal('')}
              className="hover:opacity-75 font-bold px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-normal italic">&quot;{texteOriginal}&quot;</p>
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

              {/* Empty placeholder to balance grid */}
              <div className="hidden md:block" />

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
                placeholder="Ex: Conditions de paiement : 30 jours net. Coordonnées bancaires pour virement..."
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
              
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Appliquer la TVA (18%)</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Exonérer si décoché</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={applyTax} 
                    onChange={(e) => setApplyTax(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

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
                  onClick={() => handleSave('sent')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/10"
                >
                  <Send className="h-4 w-4" />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder comme brouillon
                </button>
                <Link
                  href="/dashboard/invoices"
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowVoiceModal(false)}
          />
          
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-150 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Mic className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Saisie Vocale Multilingue IA</h3>
              </div>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6">
              <BoutonVocalFacture onFactureExtraite={handleFactureExtraite} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
