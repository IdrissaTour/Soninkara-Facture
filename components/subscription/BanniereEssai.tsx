'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Abonnement } from '@/lib/types';

interface BanniereEssaiProps {
  abonnement: Abonnement | null;
}

export function BanniereEssai({ abonnement }: BanniereEssaiProps) {
  if (!abonnement) return null;
  if (abonnement.plan !== 'essai') return null;

  const dateFin = new Date(abonnement.date_fin_essai);
  const maintenant = new Date();
  
  // Calculate remaining days
  const diffTime = dateFin.getTime() - maintenant.getTime();
  const joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Only show banner if 7 days or less remaining
  if (joursRestants > 7 && abonnement.statut === 'actif') return null;

  const isExpired = joursRestants <= 0 || abonnement.statut === 'expire';

  return (
    <div className="mb-6 animate-fadeIn">
      {isExpired ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 shadow-premium">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-extrabold tracking-tight">Votre essai gratuit est terminé</p>
              <p className="text-xs font-medium text-rose-600 mt-0.5">
                Veuillez souscrire à un abonnement pour continuer à utiliser toutes les fonctionnalités de l&apos;application.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/abonnement"
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-all shrink-0 hover:-translate-y-0.5"
          >
            Choisir un plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl shadow-premium border ${
          joursRestants <= 3 
            ? 'bg-amber-50 border-amber-100 text-amber-900' 
            : 'bg-brand-50 border-brand-100 text-brand-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
              joursRestants <= 3 ? 'bg-amber-500' : 'bg-brand-600'
            }`}>
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-extrabold tracking-tight">
                Essai gratuit — {joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${
                joursRestants <= 3 ? 'text-amber-600' : 'text-brand-600'
              }`}>
                Pensez à choisir votre forfait pour éviter toute interruption de service.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/abonnement"
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all shrink-0 hover:-translate-y-0.5 ${
              joursRestants <= 3 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            Voir les tarifs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
