'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Save, Hash, ImageIcon, Upload, X } from 'lucide-react';
import { createProduitAction } from '@/lib/actions/boutiques';

export default function NouveauProduitPage() {
  const router = useRouter();
  const params = useParams();
  const boutiqueId = params.id as string;

  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [prixAchat, setPrixAchat] = useState<number | ''>('');
  const [prixVente, setPrixVente] = useState<number | ''>('');
  const [quantiteStock, setQuantiteStock] = useState<number | ''>(0);
  const [seuilAlerte, setSeuilAlerte] = useState<number | ''>(5);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("L'image choisie dépasse 2 Mo. Veuillez utiliser une image plus légère.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || prixVente === '') {
      setError('Veuillez indiquer le nom et le prix de vente du produit');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createProduitAction({
        boutique_id: boutiqueId,
        nom: nom.trim(),
        reference: reference.trim() || null,
        prix_achat: Number(prixAchat || 0),
        prix_vente: Number(prixVente || 0),
        quantite_stock: Number(quantiteStock || 0),
        seuil_alerte: Number(seuilAlerte || 5),
        image_url: imageUrl.trim() || null
      });
      router.push(`/dashboard/boutiques/${boutiqueId}/stock`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du produit';
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
          href={`/dashboard/boutiques/${boutiqueId}/stock`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
            Ajouter un Nouveau Produit
          </h1>
          <p className="text-xs text-slate-500">
            Enregistrez un produit dans le catalogue de cette boutique.
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
        {/* Optional Image Uploader Section */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Image du Produit <span className="text-slate-400 font-normal lowercase">(optionnel)</span>
          </label>
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative h-20 w-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Aperçu produit" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-rose-600 transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                <ImageIcon className="h-7 w-7 text-slate-300" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 text-brand-600" />
                <span>Téléverser une photo</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400">Formats PNG, JPG ou WEBP. Max 2 Mo.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nom du produit <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Package className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="ex: Routeur Wi-Fi 4G LTE High-Speed"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Référence / Code SKU
          </label>
          <div className="relative">
            <Hash className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ex: RT-4G-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Prix d&apos;Achat (HT FCFA)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex: 18000"
              value={prixAchat}
              onChange={(e) => setPrixAchat(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Prix de Vente (TTC FCFA) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="ex: 32000"
              value={prixVente}
              onChange={(e) => setPrixVente(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quantité initiale en Stock
            </label>
            <input
              type="number"
              min="0"
              value={quantiteStock}
              onChange={(e) => setQuantiteStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Seuil d&apos;alerte Stock bas
            </label>
            <input
              type="number"
              min="1"
              value={seuilAlerte}
              onChange={(e) => setSeuilAlerte(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/boutiques/${boutiqueId}/stock`}
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
            {submitting ? 'Enregistrement...' : 'Ajouter au catalogue'}
          </button>
        </div>
      </form>
    </div>
  );
}
