'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, CheckCircle, Receipt, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess("Votre mot de passe a été réinitialisé avec succès ! Redirection vers votre espace...");
      setLoading(false);
      
      // Redirect to dashboard after 2.5s
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white flex select-none font-sans">
      {/* LEFT COLUMN: Premium Brand Banner (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-indigo-950 to-brand-950 p-16 flex-col justify-between overflow-hidden text-white">
        {/* Animated background glows */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Soninkara Facture
          </span>
        </div>

        {/* Core Value Pitch */}
        <div className="relative z-10 my-auto space-y-12 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5 animate-pulse" />
              Espace Sécurisé
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Réinitialisez votre <span className="bg-gradient-to-r from-brand-300 via-indigo-200 to-white bg-clip-text text-transparent">mot de passe</span>.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Choisissez un mot de passe robuste d&apos;au moins 6 caractères pour sécuriser l&apos;accès à la facturation de votre entreprise.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-white/10 pt-6 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Soninkara Facture. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT COLUMN: Reset Password Card Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-slate-50">
        {/* Mobile Header Title */}
        <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Soninkara Facture</span>
        </div>

        {/* Center Form Container */}
        <div className="my-auto max-w-md w-full mx-auto space-y-8 bg-white border border-slate-200/80 p-8 rounded-3xl shadow-premium">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Nouveau mot de passe
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Veuillez saisir votre nouveau mot de passe d&apos;accès sécurisé.
            </p>
          </div>

          {/* Alert Blocks */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex gap-3 text-xs text-rose-600 font-medium animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3 text-xs text-emerald-700 font-semibold animate-fadeIn">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-all shadow-sm"
                  minLength={6}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Confirmer votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-all shadow-sm"
                  minLength={6}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-xs font-bold text-white hover:bg-brand-700 transition-all duration-200 shadow-lg shadow-brand-600/15 disabled:opacity-50 hover:-translate-y-0.5"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
