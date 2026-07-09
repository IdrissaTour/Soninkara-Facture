'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Phone, Mail, MapPin, Camera, Save, Receipt, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { mockCompany } from '@/lib/mock-data';

export default function OnboardingPage() {
  const router = useRouter();
  const isSupabase = typeof window !== 'undefined' && !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        mockCompany.logo_url = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fallback if environment variables are not configured yet (Demo Onboarding)
    if (!supabaseUrl || !supabaseAnonKey) {
      mockCompany.name = name;
      mockCompany.email = email;
      mockCompany.phone = phone;
      mockCompany.address = address;
      
      setTimeout(() => {
        setLoading(false);
        window.location.href = '/dashboard';
      }, 1000);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Session utilisateur introuvable. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // Insert new company configuration
      const { error: dbError } = await supabase
        .from('companies')
        .insert({
          name,
          email,
          phone,
          address,
          logo_url: logoPreview,
          owner_id: user.id
        });

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      // Synchronize in-memory mockCompany too, just in case
      mockCompany.name = name;
      mockCompany.email = email;
      mockCompany.phone = phone;
      mockCompany.address = address;

      window.location.href = '/dashboard';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleSkipDemo = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 p-8 md:p-10 shadow-2xl space-y-6">
        {/* Header logo */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900">
            Configuration Soninkara Facture
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Configurez votre entreprise</h2>
          <p className="text-xs text-slate-500">
            Ces informations figureront sur l&apos;en-tête de toutes vos factures.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex gap-2.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Card Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              <div className="h-20 w-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo entreprise" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <Building className="h-7 w-7 mb-0.5 text-slate-300" />
                    <span className="text-[9px] font-bold">Logo</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-md"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="text-center sm:text-left space-y-0.5">
              <h3 className="text-xs font-bold text-slate-800">Ajouter votre logo</h3>
              <p className="text-[10px] text-slate-400">Format PNG ou JPG carré recommandé. Max 2Mo.</p>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => setLogoPreview(null)}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 block pt-1"
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>

          {/* Form input fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                Nom de l&apos;entreprise *
              </label>
              <input
                type="text"
                placeholder="Ex: Teranga Consulting"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Adresse email professionnelle *
              </label>
              <input
                type="email"
                placeholder="contact@entreprise.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Numéro de téléphone *
              </label>
              <input
                type="text"
                placeholder="Ex: +221 33 800 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Adresse physique *
              </label>
              <input
                type="text"
                placeholder="Ex: Point E, Rue de Diourbel, Dakar"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
            {!isSupabase && (
              <button
                type="button"
                onClick={handleSkipDemo}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Ignorer & Utiliser la démo
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer et Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
