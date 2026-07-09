'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Building, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { mockCompany } from '@/lib/mock-data';
import { getCompany, updateCompany } from '@/lib/actions/db';

export default function SettingsPage() {
  const [name, setName] = useState(mockCompany.name);
  const [email, setEmail] = useState(mockCompany.email || '');
  const [phone, setPhone] = useState(mockCompany.phone || '');
  const [address, setAddress] = useState(mockCompany.address || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(mockCompany.logo_url || null);
  
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const company = await getCompany();
      if (company) {
        setName(company.name);
        setEmail(company.email || '');
        setPhone(company.phone || '');
        setAddress(company.address || '');
        setLogoPreview(company.logo_url || null);
      }
    }
    loadData();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogoPreview(result);
        await updateCompany({ logo_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateCompany({
      name,
      email,
      phone,
      address,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Paramètres de l&apos;entreprise</h2>
        <p className="text-xs text-slate-500">Configurez l&apos;identité visuelle et les mentions obligatoires pour vos factures.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-premium">
        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              <div className="h-24 w-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo entreprise" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <Building className="h-8 w-8 mb-1 text-slate-300" />
                    <span className="text-[10px] font-bold">Logo</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-800">Logo de l&apos;entreprise</h3>
              <p className="text-xs text-slate-400 mt-1">Recommandé : PNG ou JPG carré de 200x200px. Taille max 2Mo.</p>
              {logoPreview && (
                <button
                  type="button"
                  onClick={async () => {
                    setLogoPreview(null);
                    mockCompany.logo_url = null;
                    await updateCompany({ logo_url: null });
                  }}
                  className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600"
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                Nom de l&apos;entreprise *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Adresse email de contact *
              </label>
              <input
                type="email"
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Adresse de l&apos;entreprise *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Point E, Avenue Cheikh Anta Diop, Dakar"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Action button & saved indicator */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div>
              {isSaved && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold animate-fadeIn">
                  <CheckCircle className="h-4.5 w-4.5" />
                  <span>Modifications enregistrées !</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
