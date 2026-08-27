'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Save, Send, Wifi, User, Calendar, Clock } from 'lucide-react';
import { Client, Compteur } from '@/lib/types';
import { getClients, getInvoices } from '@/lib/actions/db';
import { getCompteurs, getTarifs, createMeterInvoiceAction } from '@/lib/actions/meter';
import { generateMeterInvoiceDescription } from '@/lib/utils/meter-billing';
import { formatFCFA } from '@/lib/utils/invoice';
import QuickCreateClientModal from '@/components/clients/QuickCreateClientModal';
import QuickCreateCompteurModal from '@/components/compteurs/QuickCreateCompteurModal';

interface ForfaitInvoiceFormProps {
  onBackToSelection: () => void;
}

export default function ForfaitInvoiceForm({ onBackToSelection }: ForfaitInvoiceFormProps) {
  const router = useRouter();

  // Data lists
  const [clients, setClients] = useState<Client[]>([]);
  const [compteurs, setCompteurs] = useState<Compteur[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Form fields
  const [clientId, setClientId] = useState('');
  const [compteurId, setCompteurId] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(25000);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [applyTax, setApplyTax] = useState(true);

  // Modals & UI states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCompteurModal, setShowCompteurModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const [clis, invs, cpts, tfs] = await Promise.all([
          getClients(),
          getInvoices(),
          getCompteurs('connexion'),
          getTarifs('connexion')
        ]);

        setClients(clis);
        setCompteurs(cpts);

        if (tfs.length > 0) {
          setMonthlyPrice(tfs[0].prix_unitaire);
        }

        const year = new Date().getFullYear();
        const count = invs.length + 1;
        setInvoiceNumber(`FAC-${year}-${String(count).padStart(3, '0')}`);
      } catch (err) {
        console.error('Error loading forfait form data:', err);
      }
    }
    initData();
  }, []);

  const clientCompteurs = compteurs.filter(c => c.client_id === clientId);

  // Calculations
  const subtotal = (durationMonths || 0) * (monthlyPrice || 0);
  const tva = applyTax ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + tva;

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    setClientId(newClient.id);
  };

  const handleCompteurCreated = (newCompteur: Compteur) => {
    setCompteurs(prev => [newCompteur, ...prev]);
    setCompteurId(newCompteur.id);
    if (newCompteur.client_id) {
      setClientId(newCompteur.client_id);
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    setFormError('');

    if (!clientId) {
      setFormError('Veuillez sélectionner un client.');
      return;
    }
    if (durationMonths <= 0) {
      setFormError('Veuillez préciser une durée valide en mois.');
      return;
    }
    if (monthlyPrice < 0) {
      setFormError('Le prix du forfait ne peut pas être négatif.');
      return;
    }

    setIsSubmitting(true);

    try {
      const description = generateMeterInvoiceDescription('connexion', durationMonths, 'mois');

      const createdInvoice = await createMeterInvoiceAction({
        type_facture: 'connexion',
        client_id: clientId,
        compteur_id: compteurId || undefined,
        issue_date: issueDate,
        due_date: dueDate,
        notes,
        apply_tax: applyTax,
        description,
        quantity: durationMonths,
        unit_price: monthlyPrice,
        subtotal,
        tva,
        total,
        status
      });

      router.push(`/dashboard/invoices/${createdInvoice.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du forfait.';
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToSelection}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              Changer de type
            </button>
            <span className="text-slate-300">/</span>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Factures
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50">
              <Wifi className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Facture Connexion / Abonnement Internet {invoiceNumber && `(${invoiceNumber})`}</h2>
          </div>
        </div>
      </div>

      {formError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-600 font-semibold animate-fadeIn">
          ⚠️ {formError}
        </div>
      )}

      {/* Main Form container */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-premium">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2 flex items-center gap-1.5">
              <User className="h-4.5 w-4.5 text-slate-400" />
              Informations du Client & Service
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Sélectionner le client *</label>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau client
                  </button>
                </div>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setCompteurId('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                  required
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email || 'Sans contact'})</option>
                  ))}
                </select>
              </div>

              {/* Compteur/Ligne Internet optionnel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Ligne Connexion (Optionnel)</label>
                  <button
                    type="button"
                    onClick={() => setShowCompteurModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle ligne
                  </button>
                </div>
                <select
                  value={compteurId}
                  onChange={(e) => setCompteurId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="">-- Ligne par défaut --</option>
                  {(clientId ? clientCompteurs : compteurs).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numero_compteur ? `Réf: ${c.numero_compteur}` : `Ligne #${c.id.substring(0,6)}`}
                    </option>
                  ))}
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            {/* Subscription Parameters */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-slate-400" />
                Paramètres de l&apos;Abonnement
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {/* Duration Months */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Durée de l&apos;abonnement (Mois) *
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value={1}>1 Mois</option>
                    <option value={2}>2 Mois</option>
                    <option value={3}>3 Mois (Trimestriel)</option>
                    <option value={6}>6 Mois (Semestriel)</option>
                    <option value={12}>12 Mois (Annuel)</option>
                  </select>
                </div>

                {/* Monthly Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tarif Forfait Mensuel (FCFA) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                      FCFA / mois
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Conditions de l&apos;abonnement ou notes</label>
              <textarea
                placeholder="Ex: Forfait Fibre Pro 100 Mbps. Reconnexion automatique sous 24h après règlement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-premium">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Résumé financier</h3>

              {/* TVA Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Appliquer la TVA (18%)</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Taux harmonisé UEMOA</span>
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

              {/* Calculations breakdown */}
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Période souscrite</span>
                  <span className="font-bold text-slate-900">{durationMonths} mois</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix unitaire mensuel</span>
                  <span className="font-bold text-slate-900">{formatFCFA(monthlyPrice)}</span>
                </div>
                
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span>Sous-total HT</span>
                  <span className="font-semibold text-slate-800">{formatFCFA(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>TVA (18%)</span>
                  <span className="font-semibold text-slate-800">{formatFCFA(tva)}</span>
                </div>

                <div className="border-t border-slate-150 my-3 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total TTC</span>
                  <span className="text-brand-600 text-base">{formatFCFA(total)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave('sent')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Émission...' : 'Enregistrer & Émettre'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave('draft')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder en brouillon
                </button>
                <button
                  type="button"
                  onClick={onBackToSelection}
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Modals */}
      <QuickCreateClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientCreated={handleClientCreated}
      />
      <QuickCreateCompteurModal
        isOpen={showCompteurModal}
        onClose={() => setShowCompteurModal(false)}
        onCompteurCreated={handleCompteurCreated}
        clients={clients}
        initialClientId={clientId}
        initialType="connexion"
      />
    </div>
  );
}
