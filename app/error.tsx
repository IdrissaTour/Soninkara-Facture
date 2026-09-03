'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Une erreur temporaire est survenue</h2>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Une interruption inattendue s&apos;est produite lors du chargement de la page.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-md"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
