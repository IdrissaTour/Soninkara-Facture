'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error Caught:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-slate-50 font-sans text-slate-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
            ⚠️
          </div>
          <h1 className="text-lg font-bold text-slate-900">Une erreur système est survenue</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Une erreur critique s&apos;est produite dans l&apos;application. Veuillez rafraîchir la page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-md"
          >
            Réessayer de charger
          </button>
        </div>
      </body>
    </html>
  );
}
