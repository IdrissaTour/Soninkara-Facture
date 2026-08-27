'use client';

import { ShoppingBag, Droplets, Zap, Wifi, ArrowRight } from 'lucide-react';
import { InvoiceType } from '@/lib/types';

interface InvoiceTypeSelectorProps {
  onSelectType: (type: InvoiceType) => void;
}

interface TypeCardOption {
  id: InvoiceType;
  title: string;
  subtitle: string;
  unit: string;
  icon: React.ElementType;
  badgeText: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  hoverBorderColor: string;
  badgeBg: string;
  badgeColor: string;
}

const typeOptions: TypeCardOption[] = [
  {
    id: 'produits',
    title: 'Vente Produits / Services',
    subtitle: 'Facturation classique d\'articles en stock ou prestations de services standard.',
    unit: 'Quantité × P.U.',
    icon: ShoppingBag,
    badgeText: 'Facture Standard',
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-600',
    borderColor: 'border-slate-200/80',
    hoverBorderColor: 'hover:border-brand-500',
    badgeBg: 'bg-brand-50',
    badgeColor: 'text-brand-700',
  },
  {
    id: 'eau',
    title: 'Compteur d\'Eau',
    subtitle: 'Facturation sur relevé d\'index avec calcul de consommation et tranches tarifaires.',
    unit: 'Unité : m³',
    icon: Droplets,
    badgeText: 'Relevé Compteur',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    borderColor: 'border-slate-200/80',
    hoverBorderColor: 'hover:border-sky-500',
    badgeBg: 'bg-sky-50',
    badgeColor: 'text-sky-700',
  },
  {
    id: 'electricite',
    title: 'Compteur d\'Électricité',
    subtitle: 'Facturation sur relevé d\'index d\'électricité par tranches progressives.',
    unit: 'Unité : kWh',
    icon: Zap,
    badgeText: 'Relevé Compteur',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-slate-200/80',
    hoverBorderColor: 'hover:border-amber-500',
    badgeBg: 'bg-amber-50',
    badgeColor: 'text-amber-700',
  },
  {
    id: 'connexion',
    title: 'Forfait Connexion / Internet',
    subtitle: 'Facturation d\'abonnement récurrent sans relevé de compteur (durée × prix mensuel).',
    unit: 'Unité : Forfait / Mois',
    icon: Wifi,
    badgeText: 'Abonnement',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-slate-200/80',
    hoverBorderColor: 'hover:border-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeColor: 'text-emerald-700',
  },
];

export default function InvoiceTypeSelector({ onSelectType }: InvoiceTypeSelectorProps) {
  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-200 backdrop-blur-md mb-3 border border-white/10">
          ✨ Choisir le type d&apos;émission
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Quel type de facture souhaitez-vous émettre ?
        </h2>
        <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-2xl">
          Sélectionnez le mode adapté à votre activité : facturation classique par articles, relevé de compteur (eau/électricité) ou forfait d&apos;abonnement.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {typeOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectType(opt.id)}
              className={`group text-left bg-white rounded-3xl p-6 border ${opt.borderColor} ${opt.hoverBorderColor} shadow-premium hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col justify-between overflow-hidden cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${opt.iconBg} ${opt.iconColor} transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${opt.badgeBg} ${opt.badgeColor}`}>
                    {opt.badgeText}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {opt.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {opt.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  {opt.unit}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
