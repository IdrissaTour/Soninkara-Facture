'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Save, Building } from 'lucide-react';
import { createBoutiqueAction } from '@/lib/actions/boutiques';

export default function NouvelleBoutiquePage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [devise, setDevise] = useState('FCFA');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Veuillez indiquer le nom de la boutique');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createBoutiqueAction({
        nom: nom.trim(),
        adresse: adresse.trim() || undefined,
        devise
      });
      router.push('/dashboard/boutiques');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la boutique';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
      {/* Header Back Link */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/boutiques"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
            Créer une Nouvelle Boutique
          </h1>
          <p className="text-xs text-slate-500">
            Ajoutez un nouveau point de vente pour votre entreprise.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-premium space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nom de la boutique <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="ex: Soninkara Express - Point E"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Adresse / Emplacement
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ex: Avenue Cheikh Anta Diop, Dakar"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Devise d&apos;affichage
          </label>
          <select
            value={devise}
            onChange={(e) => setDevise(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="FCFA">FCFA (Franc CFA - XOF/XAF)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/boutiques"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 transition-all duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Enregistrement...' : 'Créer la boutique'}
          </button>
        </div>
      </form>
    </div>
  );
}
