import { Receipt } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-600/30">
          <Receipt className="h-9 w-9 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Soninkara Facture
          </h2>
          <p className="text-xs text-slate-500 font-medium">Chargement en cours...</p>
        </div>
      </div>
    </div>
  );
}
