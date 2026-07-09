'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Receipt, Mail, Lock, ArrowRight, AlertCircle, Info, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Les variables d'environnement Supabase ne sont pas configurées. Veuillez utiliser le mode Démo ci-dessous.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        let errorMsg = authError.message;
        if (authError.message === 'Invalid login credentials') {
          errorMsg = 'Identifiants de connexion invalides. Veuillez vérifier votre email et mot de passe.';
        } else if (authError.message === 'Email not confirmed' || authError.message.includes('confirm')) {
          errorMsg = "Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception ou vos spams pour valider votre compte.";
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Check if user has a company configured
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: companies, error: dbError } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (dbError || !companies || companies.length === 0) {
          window.location.href = '/onboarding';
        } else {
          // Use location.href instead of router.push to force browser cookie sync for the SSR middleware
          window.location.href = '/dashboard';
        }
      } else {
        setError('Impossible de récupérer les informations de session.');
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    window.location.href = '/dashboard';
  };

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

        {/* Brand Core Value Pitch & Mini Premium Dashboard Preview */}
        <div className="relative z-10 my-auto space-y-12 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              SaaS de Facturation Régionale
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Simplifiez votre facturation en <span className="bg-gradient-to-r from-brand-300 via-indigo-200 to-white bg-clip-text text-transparent">Franc CFA</span>.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Conçu sur-mesure pour les entrepreneurs, freelances et PME d&apos;Afrique de l&apos;Ouest. Calculez automatiquement la TVA à 18% et générez des PDF premium pour vos clients.
            </p>
          </div>

          {/* Miniature premium dashboard card mockup */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-200">Activité Récente (Dakar, SN)</span>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Encaissé</span>
                <p className="text-sm font-bold text-white">4 500 000 FCFA</p>
              </div>
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">En attente</span>
                <p className="text-sm font-bold text-brand-300">1 250 000 FCFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>© {new Date().getFullYear()} Soninkara Facture.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-brand-400" /> TVA 18%</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-brand-400" /> Conforme UEMOA</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-20 relative bg-slate-50/50">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex lg:hidden items-center gap-2.5 justify-center sm:justify-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Receipt className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Soninkara Facture
          </span>
        </div>

        {/* Center Container */}
        <div className="my-auto max-w-md w-full mx-auto space-y-8 pt-8 lg:pt-0">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Bon retour parmi nous !</h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Connectez-vous pour accéder à votre tableau de bord.</p>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex gap-3 text-xs text-rose-600 font-medium animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-xs font-bold text-white hover:bg-brand-700 transition-all duration-200 shadow-lg shadow-brand-600/15 disabled:opacity-50 hover:-translate-y-0.5"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter à mon espace'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Separator line & Demo Mode Action Panel (Only shown if Supabase is NOT configured) */}
          {mounted && !isSupabaseConfigured && (
            <>
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <span className="relative bg-slate-50 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OU</span>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex gap-3 text-[11px] text-slate-500 leading-relaxed font-medium">
                  <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                  <p>
                    Vous n&apos;avez pas encore de projet Supabase connecté ? Accédez au dashboard en mode démo avec des données locales simulées en un clic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDemoMode}
                  className="w-full rounded-xl border border-slate-250 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Lancer l&apos;application (Mode Démo)
                </button>
              </div>
            </>
          )}

          {/* Footer Account Prompt */}
          <p className="text-center text-xs text-slate-400 font-semibold">
            Nouveau sur la plateforme ?{' '}
            <Link href="/signup" className="font-bold text-brand-600 hover:text-brand-700 transition-colors underline decoration-brand-200 underline-offset-4">
              Créer un compte gratuit
            </Link>
          </p>
        </div>

        {/* Footer legal notes */}
        <div className="text-center text-[10px] text-slate-400 font-semibold mt-8 border-t border-slate-200/40 pt-4">
          En vous connectant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité.
        </div>
      </div>
    </div>
  );
}
