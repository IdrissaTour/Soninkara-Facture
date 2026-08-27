'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Save, Send, Droplets, Zap, User, Calendar, Gauge, Info, CheckCircle2 } from 'lucide-react';
import { Client, Compteur, Tarif } from '@/lib/types';
import { getClients, getInvoices } from '@/lib/actions/db';
import { getCompteurs, getLastReleve, getTarifs, createMeterInvoiceAction } from '@/lib/actions/meter';
import { calculateConsumption, calculateTieredPrice, generateMeterInvoiceDescription } from '@/lib/utils/meter-billing';
import { formatFCFA } from '@/lib/utils/invoice';
import QuickCreateClientModal from '@/components/clients/QuickCreateClientModal';
import QuickCreateCompteurModal from '@/components/compteurs/QuickCreateCompteurModal';

interface CompteurInvoiceFormProps {
  type: 'eau' | 'electricite';
  onBackToSelection: () => void;
}

export default function CompteurInvoiceForm({ type, onBackToSelection }: CompteurInvoiceFormProps) {
  const router = useRouter();
  const unitLabel = type === 'eau' ? 'm³' : 'kWh';
  const title = type === 'eau' ? 'Facture d\'Eau (Compteur)' : 'Facture d\'Électricité (Compteur)';
  const Icon = type === 'eau' ? Droplets : Zap;
  const iconColor = type === 'eau' ? 'text-sky-600 bg-sky-50' : 'text-amber-600 bg-amber-50';

  // Data lists
  const [clients, setClients] = useState<Client[]>([]);
  const [compteurs, setCompteurs] = useState<Compteur[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Form states
  const [clientId, setClientId] = useState('');
  const [compteurId, setCompteurId] = useState('');
  const [previousIndex, setPreviousIndex] = useState<number>(0);
  const [newIndexInput, setNewIndexInput] = useState<string>('');
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
  const [loadingReleve, setLoadingReleve] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    async function initData() {
      try {
        const [clis, invs, cpts, tfs] = await Promise.all([
          getClients(),
          getInvoices(),
          getCompteurs(type),
          getTarifs(type)
        ]);

        setClients(clis);
        setCompteurs(cpts);
        setTarifs(tfs);

        const year = new Date().getFullYear();
        const count = invs.length + 1;
        setInvoiceNumber(`FAC-${year}-${String(count).padStart(3, '0')}`);
      } catch (err) {
        console.error('Error loading compteur form data:', err);
      }
    }
    initData();
  }, [type]);

  // When client changes, filter compteurs or auto-select if client has 1 meter
  const clientCompteurs = compteurs.filter(c => c.client_id === clientId);

  // When compteur changes, fetch its last recorded releve index
  useEffect(() => {
    async function loadLastReleve() {
      if (!compteurId) {
        setPreviousIndex(0);
        return;
      }
      setLoadingReleve(true);
      try {
        const lastReleve = await getLastReleve(compteurId);
        if (lastReleve) {
          setPreviousIndex(lastReleve.index_value);
          if (!newIndexInput) {
            setNewIndexInput(String(lastReleve.index_value));
          }
        } else {
          setPreviousIndex(0);
        }
      } catch (err) {
        console.error('Error loading last releve:', err);
        setPreviousIndex(0);
      } finally {
        setLoadingReleve(false);
      }
    }
    loadLastReleve();
  }, [compteurId]);

  // Calculations
  const newIndex = parseFloat(newIndexInput) || 0;
  let consumption = 0;
  let calculationError = '';

  try {
    if (newIndexInput !== '') {
      consumption = calculateConsumption(newIndex, previousIndex);
    }
  } catch (err) {
    calculationError = err instanceof Error ? err.message : 'Index invalide';
  }

  const { totalAmount: subtotal, breakdown, averageUnitPrice } = calculateTieredPrice(consumption, tarifs);
  const tva = applyTax ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + tva;

  // Handlers for modal creations
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

  // Submit invoice
  const handleSave = async (status: 'draft' | 'sent') => {
    setFormError('');

    if (!clientId) {
      setFormError('Veuillez sélectionner un client.');
      return;
    }
    if (!compteurId) {
      setFormError('Veuillez sélectionner un compteur.');
      return;
    }
    if (calculationError) {
      setFormError(calculationError);
      return;
    }
    if (newIndexInput === '' || isNaN(newIndex)) {
      setFormError('Veuillez saisir le nouvel index du compteur.');
      return;
    }

    setIsSubmitting(true);

    try {
      const description = generateMeterInvoiceDescription(type, consumption, unitLabel, previousIndex, newIndex);
      
      const createdInvoice = await createMeterInvoiceAction({
        type_facture: type,
        client_id: clientId,
        compteur_id: compteurId,
        issue_date: issueDate,
        due_date: dueDate,
        notes,
        apply_tax: applyTax,
        new_index: newIndex,
        description,
        quantity: consumption,
        unit_price: Math.round(averageUnitPrice),
        subtotal,
        tva,
        total,
        status
      });

      router.push(`/dashboard/invoices/${createdInvoice.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde de la facture.';
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
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{title} {invoiceNumber && `(${invoiceNumber})`}</h2>
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
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-premium">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2 flex items-center gap-1.5">
              <User className="h-4.5 w-4.5 text-slate-400" />
              Client & Compteur
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Client */}
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

              {/* Select Compteur */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Compteur ({type === 'eau' ? 'Eau' : 'Électricité'}) *</label>
                  <button
                    type="button"
                    onClick={() => setShowCompteurModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau compteur
                  </button>
                </div>
                <select
                  value={compteurId}
                  onChange={(e) => setCompteurId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                  required
                >
                  <option value="">-- Choisir un compteur --</option>
                  {(clientId ? clientCompteurs : compteurs).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numero_compteur ? `N° ${c.numero_compteur}` : `Compteur #${c.id.substring(0,6)}`} {c.client ? `(${c.client.name})` : ''}
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

            {/* Relevé de Compteur Section */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Gauge className="h-4.5 w-4.5 text-slate-400" />
                Saisie des Index et Consommation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {/* Previous Index (Read-only or auto loaded) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Ancien Index ({unitLabel})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={previousIndex}
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                    {loadingReleve && (
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 animate-pulse">
                        Chargement...
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Dernier relevé enregistré</span>
                </div>

                {/* New Index Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nouvel Index ({unitLabel}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={previousIndex}
                    placeholder="Saisir le nouvel index"
                    value={newIndexInput}
                    onChange={(e) => setNewIndexInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Valeur relevée sur le compteur</span>
                </div>

                {/* Calculated Volume */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Consommation Calculée
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-extrabold text-emerald-800 flex items-center justify-between">
                    <span>{consumption} {unitLabel}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Nouvel index − Ancien index</span>
                </div>
              </div>

              {calculationError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-semibold">
                  ⚠️ {calculationError}
                </div>
              )}
            </div>

            {/* Tranches Tarifaires Breakdown */}
            {breakdown.length > 0 && (
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-brand-600" />
                  Décomposition par tranche tarifaire progressive
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">
                          Tranche {idx + 1} : {item.trancheMin} à {item.trancheMax !== null ? item.trancheMax : '∞'} {unitLabel}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {item.volume} {unitLabel} × {formatFCFA(item.prixUnitaire)}/{unitLabel}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">{formatFCFA(item.totalTier)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Conditions ou notes de bas de page</label>
              <textarea
                placeholder="Ex: Facture établie sur la base du relevé contradictoire de compteur. Règlement sous 15 jours..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Right Column: Financial Summary */}
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

              {/* Summary calculations */}
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Consommation globale</span>
                  <span className="font-bold text-slate-900">{consumption} {unitLabel}</span>
                </div>
                
                <div className="flex justify-between">
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
        initialType={type}
      />
    </div>
  );
}
