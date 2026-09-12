'use client';

import { useState, useEffect } from 'react';
import { X, Gauge, Plus, UserPlus } from 'lucide-react';
import { Client, Compteur, CompteurType } from '@/lib/types';
import { createCompteurAction } from '@/lib/actions/meter';
import QuickCreateClientModal from '@/components/clients/QuickCreateClientModal';

interface QuickCreateCompteurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompteurCreated: (compteur: Compteur) => void;
  clients: Client[];
  initialClientId?: string;
  initialType?: CompteurType;
  onClientCreated?: (client: Client) => void;
}

export default function QuickCreateCompteurModal({
  isOpen,
  onClose,
  onCompteurCreated,
  clients,
  initialClientId = '',
  initialType = 'eau',
  onClientCreated
}: QuickCreateCompteurModalProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [type, setType] = useState<CompteurType>(initialType);
  const [numeroCompteur, setNumeroCompteur] = useState('');
  const [unite, setUnite] = useState(initialType === 'eau' ? 'm3' : initialType === 'electricite' ? 'kWh' : 'forfait');
  const [prixUnitaireInput, setPrixUnitaireInput] = useState<string>(initialType === 'eau' ? '400' : initialType === 'electricite' ? '110' : '');
  const [dateInstallation, setDateInstallation] = useState(new Date().toISOString().split('T')[0]);
  
  const [localClients, setLocalClients] = useState<Client[]>(clients);
  const [showClientModal, setShowClientModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (initialType) {
      setType(initialType);
      if (initialType === 'eau') {
        setUnite('m3');
        setPrixUnitaireInput('400');
      } else if (initialType === 'electricite') {
        setUnite('kWh');
        setPrixUnitaireInput('110');
      } else {
        setUnite('forfait');
      }
    }
  }, [initialType]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: CompteurType) => {
    setType(newType);
    if (newType === 'eau') {
      setUnite('m3');
      if (!prixUnitaireInput) setPrixUnitaireInput('400');
    } else if (newType === 'electricite') {
      setUnite('kWh');
      if (!prixUnitaireInput) setPrixUnitaireInput('110');
    } else {
      setUnite('forfait');
    }
  };

  const handleNestedClientCreated = (newClient: Client) => {
    setLocalClients(prev => [newClient, ...prev]);
    setClientId(newClient.id);
    if (onClientCreated) {
      onClientCreated(newClient);
    }
    setShowClientModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Veuillez sélectionner un client.');
      return;
    }

    setLoading(true);

    try {
      const parsedPrix = parseFloat(prixUnitaireInput);
      const created = await createCompteurAction({
        client_id: clientId,
        type,
        numero_compteur: numeroCompteur.trim() || null,
        unite: unite.trim() || (type === 'eau' ? 'm3' : type === 'electricite' ? 'kWh' : 'forfait'),
        prix_unitaire: !isNaN(parsedPrix) ? parsedPrix : null,
        date_installation: dateInstallation || null
      });

      onCompteurCreated(created);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compteur.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-150 animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Gauge className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Ajouter un nouveau compteur</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Client select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Client associé *</label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Nouveau client
                </button>
              </div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                required
              >
                <option value="">-- Choisir un client --</option>
                {localClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Type select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de compteur / service *</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as CompteurType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 bg-white"
                required
              >
                <option value="eau">Eau (m³)</option>
                <option value="electricite">Électricité (kWh)</option>
                <option value="connexion">Connexion / Forfait Internet</option>
              </select>
            </div>

            {/* Numéro de compteur */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Numéro de compteur / Référence</label>
              <input
                type="text"
                placeholder="Ex: H 21804547 ou EAU-9982-DK"
                value={numeroCompteur}
                onChange={(e) => setNumeroCompteur(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Prix Unitaire & Unité */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Prix unitaire par {type === 'eau' ? 'm³' : type === 'electricite' ? 'kWh' : 'unité'} (FCFA)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={prixUnitaireInput}
                  onChange={(e) => setPrixUnitaireInput(e.target.value)}
                  placeholder="Ex: 400"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Unité de mesure *</label>
                <input
                  type="text"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                  placeholder="Ex: m3, kWh, forfait"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            {/* Date d'installation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date d&apos;installation</label>
              <input
                type="date"
                value={dateInstallation}
                onChange={(e) => setDateInstallation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Création...' : 'Créer le compteur'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <QuickCreateClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientCreated={handleNestedClientCreated}
      />
    </>
  );
}
