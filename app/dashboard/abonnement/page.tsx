'use client';

import { useState, useEffect } from 'react';
import { Check, Receipt, Sparkles, Shield, Rocket, HelpCircle, Loader2 } from 'lucide-react';
import { getAbonnement, updateMockAbonnement } from '@/lib/actions/db';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { Abonnement } from '@/lib/types';

export default function AbonnementPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentAbonnement, setCurrentAbonnement] = useState<Abonnement | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    async function loadSub() {
      const sub = await getAbonnement();
      setCurrentAbonnement(sub);
      setLoading(false);
    }
    loadSub();
    
    // Check if redirecting from payment success
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('succes') === 'true') {
        setSuccessMsg("Félicitations ! Votre paiement a été traité avec succès et votre abonnement est désormais actif.");
      }
      if (params.get('expire') === 'true') {
        setErrorMsg("Votre période d'essai gratuit a expiré. Veuillez choisir un plan pour continuer à utiliser l'application.");
      }
    }
  }, []);

  const handleSelectPlan = async (planKey: string, price: number) => {
    if (price === 0) {
      // Free trial is not purchasable
      return;
    }

    setPaymentLoading(planKey);
    setSuccessMsg(null);
    setErrorMsg(null);

    // MOCK MODE: Update local subscription in memory
    if (!isSupabase) {
      setTimeout(async () => {
        const nextSub = await updateMockAbonnement({
          plan: planKey as any,
          statut: 'actif',
          date_debut_abonnement: new Date().toISOString(),
          date_prochaine_facturation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          montant: price,
          cycle_facturation: billingCycle === 'monthly' ? 'mensuel' : 'annuel',
          statut_paiement: 'paye'
        });
        setCurrentAbonnement(nextSub);
        setSuccessMsg(`[Mode Démo] Abonnement au plan ${planKey.toUpperCase()} activé avec succès !`);
        setPaymentLoading(null);
      }, 1000);
      return;
    }

    // PRODUCTION MODE: Initiate CinetPay checkout
    try {
      const response = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utilisateurId: currentAbonnement?.utilisateur_id,
          plan: planKey,
          montant: price,
          cycleFacturation: billingCycle
        })
      });

      const data = await response.json();
      if (data.lienPaiement) {
        // Redirect to CinetPay payment portal
        window.location.href = data.lienPaiement;
      } else {
        throw new Error(data.error || "Impossible d'initier le paiement CinetPay.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue lors de l'initialisation du paiement.");
      setPaymentLoading(null);
    }
  };

  const plans = [
    {
      key: 'essai',
      name: 'Essai gratuit',
      icon: HelpCircle,
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Pour tester le service et démarrer en toute sérénité.',
      features: [
        'Accès complet à toutes les fonctionnalités',
        'Calcul automatique TVA 18%',
        'Facturation 100% en FCFA',
        'Support standard par email',
        'Valide pendant 30 jours'
      ],
      cta: 'Plan initial'
    },
    {
      key: 'starter',
      name: 'Starter',
      icon: Sparkles,
      priceMonthly: 5000,
      priceYearly: 50000,
      description: 'Idéal pour les freelances et petites entreprises locales.',
      features: [
        '1 entreprise configurée',
        'Factures & devis illimités',
        '1 boutique physique / stock',
        'Saisie vocale Wolof, Bambara, Soninké',
        'Export PDF standard'
      ],
      cta: 'Choisir Starter'
    },
    {
      key: 'pro',
      name: 'Pro',
      icon: Shield,
      priceMonthly: 12000,
      priceYearly: 120000,
      description: 'Conçu pour les commerces et PME en pleine croissance.',
      features: [
        'Starter inclus',
        'Multi-boutiques (jusqu\'à 3)',
        'Statistiques & rapports avancés',
        'Affiliation active & commissions',
        'Personnalisation complète du logo',
        'Support WhatsApp prioritaire'
      ],
      cta: 'Choisir Pro',
      popular: true
    },
    {
      key: 'entreprise',
      name: 'Entreprise',
      icon: Rocket,
      priceMonthly: 25000,
      priceYearly: 250000,
      description: 'Pour les structures gérant plusieurs activités complexes.',
      features: [
        'Pro inclus',
        'Entreprises illimitées',
        'Boutiques & stocks illimités',
        'Accès aux APIs de facturation',
        'Support dédié 24h/7j',
        'Intégration comptable sur-mesure'
      ],
      cta: 'Choisir Entreprise'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Abonnement & Forfaits
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Gérez vos forfaits de facturation et suivez le statut de votre période d&apos;essai.
          </p>
        </div>

        {/* Current status display */}
        {currentAbonnement && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl shadow-premium text-xs">
            <span className="font-bold text-slate-500">Statut actuel :</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-bold uppercase ${
              currentAbonnement.statut === 'actif'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {currentAbonnement.statut === 'actif' ? 'Actif' : 'Expiré'}
            </span>
            <span className="text-slate-400 font-bold">|</span>
            <span className="font-bold text-slate-800">
              Plan {currentAbonnement.plan.toUpperCase()}
            </span>
            {currentAbonnement.plan === 'essai' && (
              <>
                <span className="text-slate-450 font-bold">·</span>
                <span className="text-slate-500">
                  Fin le {formatDateFrench(currentAbonnement.date_fin_essai)}
                </span>
              </>
            )}
            {currentAbonnement.date_prochaine_facturation && (
              <>
                <span className="text-slate-450 font-bold">·</span>
                <span className="text-slate-500">
                  Renouvellement le {formatDateFrench(currentAbonnement.date_prochaine_facturation)}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-bold text-emerald-800 animate-fadeIn">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs font-bold text-rose-800 animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* Toggle Selector */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Périodicité de facturation</span>
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Annuel (-20% / 2 mois offerts)
          </button>
        </div>
      </div>

      {/* Grid of pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isCurrentPlan = currentAbonnement?.plan === plan.key;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.key}
              className={`bg-white border rounded-3xl p-6 flex flex-col justify-between relative shadow-premium transition-all duration-300 hover:shadow-premium-hover ${
                plan.popular ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/80'
              } ${isCurrentPlan ? 'ring-2 ring-emerald-500/40 border-emerald-500' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Recommandé
                </span>
              )}

              {isCurrentPlan && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Votre Plan Actuel
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-xl ${
                    plan.popular ? 'bg-brand-50 text-brand-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    <PlanIcon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{plan.name}</h3>
                </div>

                <p className="text-[11px] text-slate-405 leading-normal h-10">{plan.description}</p>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-950">
                    {price === 0 ? 'Gratuit' : formatFCFA(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      /{billingCycle === 'monthly' ? 'mois' : 'an'}
                    </span>
                  )}
                </div>

                <ul className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-xs text-slate-600">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 leading-tight">
                      <Check className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                {plan.key === 'essai' ? (
                  <div className="w-full text-center py-2.5 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-slate-200/60">
                    {isCurrentPlan ? 'Essai en cours' : 'Non disponible'}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.key, price)}
                    disabled={isCurrentPlan || paymentLoading !== null}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all duration-200 ${
                      isCurrentPlan
                        ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : paymentLoading === plan.key
                        ? 'bg-brand-600 text-white cursor-wait opacity-80'
                        : plan.popular
                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/10 hover:-translate-y-0.5'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:-translate-y-0.5'
                    }`}
                  >
                    {paymentLoading === plan.key ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Traitement...
                      </>
                    ) : isCurrentPlan ? (
                      'Votre forfait actuel'
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
