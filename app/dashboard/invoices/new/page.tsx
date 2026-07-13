'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Save, Receipt, Calendar, User, Send, Mic, Loader2, X } from 'lucide-react';
import { calculateInvoiceTotals, formatFCFA } from '@/lib/utils/invoice';
import { Client } from '@/lib/types';
import { getClients, createInvoiceAction, getInvoices } from '@/lib/actions/db';
import { transcribeVoiceInvoice } from '@/lib/actions/voice';

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

  // Voice Assistant states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper helper to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Stop recording. 'save' indicates whether to process or discard
  const stopRecording = (save: boolean) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!save) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
  };

  // Start voice recording
  const startRecording = async () => {
    setVoiceError('');
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser decide
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) return;
        
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const base64 = await blobToBase64(audioBlob);
          const detectedMime = recorder.mimeType || 'audio/webm';
          
          const result = await transcribeVoiceInvoice(base64, detectedMime);
          
          if (result) {
            // 1. Match client if detected
            if (result.clientName) {
              const matched = clients.find(c => 
                c.name.toLowerCase().includes(result.clientName.toLowerCase()) ||
                result.clientName.toLowerCase().includes(c.name.toLowerCase())
              );
              if (matched) {
                setClientId(matched.id);
              }
            }

            // 2. Set invoice items if detected
            if (result.items && result.items.length > 0) {
              const formatted: FormItem[] = result.items.map((item: any) => ({
                description: item.description || 'Article dicté',
                quantity: String(item.quantity ?? 1),
                unit_price: String(item.price ?? 0)
              }));
              setItems(formatted);
            }

            setShowVoiceModal(false);
          } else {
            throw new Error("L'IA n'a retourné aucune donnée exploitable.");
          }
        } catch (err) {
          console.error("Voice processing error:", err);
          const msg = err instanceof Error ? err.message : "Erreur de traitement de la note vocale.";
          setVoiceError(msg);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      setVoiceError("Impossible d'accéder au microphone. Veuillez accorder les permissions nécessaires.");
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
          onClick={() => {
            setVoiceError('');
            setShowVoiceModal(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-100 transition-all hover:scale-102 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Mic className="h-4.5 w-4.5 text-brand-600" />
          Créer par la voix
        </button>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {
            if (!isRecording && !isProcessing) setShowVoiceModal(false);
          }} />
          
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-150 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Mic className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Assistant Vocal IA</h3>
              </div>
              <button
                onClick={() => {
                  stopRecording(false);
                  setShowVoiceModal(false);
                }}
                disabled={isProcessing}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
              {isProcessing ? (
                <>
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-brand-600"></div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Transcription et analyse en cours...</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto">
                      L&apos;IA extrait le client et les lignes de facture (quantités, prix unitaires, articles).
                    </p>
                  </div>
                </>
              ) : isRecording ? (
                <>
                  {/* Pulsating Record Button */}
                  <div className="relative flex items-center justify-center h-24 w-24">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400/30 opacity-75 animate-ping"></span>
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-rose-500/20 opacity-90 animate-pulse"></span>
                    <button
                      onClick={() => stopRecording(true)}
                      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all hover:scale-105"
                    >
                      <div className="h-5 w-5 bg-white rounded-sm" />
                    </button>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[10px] font-bold text-rose-600 border border-rose-100 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                      Enregistrement : 00:{String(recordingDuration).padStart(2, '0')} / 00:30
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">Je vous écoute...</h4>
                    <p className="text-[10px] text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                      Parlez naturellement en Français, Wolof, Bambara, Swahili, etc.<br />
                      Ex: <i>&quot;Facture pour Amadou, 5 sacs de ciment à 5000 FCFA chacun.&quot;</i>
                    </p>
                  </div>

                  <div className="flex gap-3 w-full pt-4 border-t border-slate-100">
                    <button
                      onClick={() => stopRecording(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => stopRecording(true)}
                      className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                    >
                      Terminer & Analyser
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 border border-brand-100 text-brand-600 shadow-md">
                    <Mic className="h-8 w-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Générer la facture par la voix</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Dictez le client, les articles, les prix et les quantités pour créer la facture en 1 clic.
                    </p>
                  </div>

                  {voiceError && (
                    <div className="w-full text-left rounded-xl bg-rose-50 border border-rose-100 p-3 text-[10px] text-rose-600 font-semibold">
                      {voiceError}
                    </div>
                  )}

                  <button
                    onClick={startRecording}
                    className="w-full rounded-xl bg-brand-600 py-3 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/10 flex items-center justify-center gap-2"
                  >
                    <Mic className="h-4.5 w-4.5" />
                    Commencer à parler
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
