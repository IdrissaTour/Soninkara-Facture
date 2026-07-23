'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt, Check, ArrowRight, ShieldCheck, Zap, Download, Users, TrendingUp, Store, Mic } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/invoice';
import { clsx } from 'clsx';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      title: 'Facturation 100% FCFA',
      description: 'Générez des factures parfaitement formatées pour le franc CFA (XOF / XAF), adaptées aux usages locaux.',
      icon: Receipt,
    },
    {
      title: 'Gestion Boutiques & Stocks',
      description: 'Suivez vos points de vente, contrôlez vos stocks en temps réel et recevez des alertes de réapprovisionnement.',
      icon: Store,
    },
    {
      title: 'Export PDF & Impression',
      description: 'Téléchargez vos factures et bilans financiers de boutique en PDF en un clic ou imprimez-les directement.',
      icon: Download,
    },
    {
      title: 'Calcul TVA 18% automatique',
      description: 'Calcul automatique conforme aux normes de la zone UEMOA/CEMAC pour éviter toute erreur comptable.',
      icon: Zap,
    },
    {
      title: 'Registre des Dépenses',
      description: 'Affectez chaque dépense à une boutique spécifique ou à l\'entreprise globale pour mesurer le bénéfice net réel.',
      icon: TrendingUp,
    },
    {
      title: 'Fichier clients & Suivi',
      description: 'Conservez les coordonnées de vos clients et sachez quelles factures sont payées, en attente ou en retard.',
      icon: Users,
    }
  ];

  const pricing = [
    {
      name: 'Gratuit',
      price: 0,
      description: 'Pour tester le service et démarrer en toute sérénité.',
      features: [
        'Jusqu\'à 5 factures par mois',
        'Gestion de 5 clients',
        'Calcul automatique TVA 18%',
        'Export PDF standard',
        'Monodevise FCFA'
      ],
      cta: 'Commencer gratuitement',
      href: '/dashboard',
      popular: false
    },
    {
      name: 'Professionnel',
      price: billingCycle === 'monthly' ? 5000 : 4000,
      description: 'Idéal pour les freelances et PME en pleine croissance.',
      features: [
        'Factures & Devis illimités',
        'Clients illimités',
        'Logo d\'entreprise personnalisé',
        'Rapports financiers complets',
        'Support client prioritaire WhatsApp',
        'Relance automatique des retards'
      ],
      cta: 'Démarrer l\'essai gratuit',
      href: '/dashboard',
      popular: true
    },
    {
      name: 'Entreprise',
      price: billingCycle === 'monthly' ? 12000 : 10000,
      description: 'Conçu pour les structures gérant plusieurs activités.',
      features: [
        'Tout le plan Professionnel',
        'Gestion multi-entreprises (jusqu\'à 3)',
        'Accès collaborateur pour votre comptable',
        'Intégration API de paiement locale',
        'Sauvegarde Cloud automatique'
      ],
      cta: 'Contacter notre équipe',
      href: '/dashboard',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth selection:bg-brand-600 selection:text-white">
      {/* Navbar Section */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-950 to-brand-900 bg-clip-text text-transparent">
              Soninkara Facture
            </span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Tarifs</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200"
            >
              Essai Gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 lg:pt-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text and CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-3.5 py-1 text-xs font-bold text-brand-700 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Conforme aux normes fiscales régionales</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm animate-pulse">
                <Mic className="h-3.5 w-3.5" />
                <span>Facturation Vocale dispo (Bambara, Wolof, Soninké)</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 leading-tight tracking-tight">
              Facturation, Boutiques & Stocks pour les <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">entrepreneurs africains</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              Émettez vos factures en FCFA, suivez le stock de vos boutiques en direct, calculez automatiquement la TVA à 18% et contrôlez la rentabilité réelle de chaque point de vente.
            </p>
            <div className="flex items-center gap-2.5 text-xs text-brand-700 bg-brand-50/50 border border-brand-100 rounded-xl p-3.5 max-w-xl mx-auto lg:mx-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                <Mic className="h-4 w-4" />
              </div>
              <p className="text-left font-medium">
                <span className="font-bold text-brand-900">Nouveau :</span> Vous pouvez désormais créer vos factures par commande vocale en <span className="font-bold text-brand-900">Bambara</span>, <span className="font-bold text-brand-900">Wolof</span> et <span className="font-bold text-brand-900">Soninké</span> !
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Voir comment ça marche
              </a>
            </div>
          </div>

          {/* Simulated App Dashboard Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-200/40 to-indigo-200/30 rounded-3xl blur-2xl -z-10 transform scale-95" />
            
            {/* Main Mockup Card */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden">
              {/* Toolbar */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1">
                  app.soninkarafacture.sn/dashboard
                </div>
              </div>

              {/* Mockup content */}
              <div className="space-y-4">
                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payé ce mois</span>
                    <span className="text-base font-extrabold text-slate-900 block mt-1">{formatFCFA(3186000)}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Factures en retard</span>
                    <span className="text-base font-extrabold text-rose-600 block mt-1">{formatFCFA(5015000)}</span>
                  </div>
                </div>

                {/* Simulated Invoice creation form snapshot */}
                <div className="p-4 bg-brand-950 text-white rounded-2xl space-y-3 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">Création Facture</span>
                    <span className="text-[10px] font-semibold bg-brand-800 text-white px-2 py-0.5 rounded">TVA 18% Actif</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Prestation Développement</span>
                      <span className="font-bold text-white">{formatFCFA(1500000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>TVA (18%)</span>
                      <span>{formatFCFA(270000)}</span>
                    </div>
                    <div className="border-t border-brand-850 pt-2 flex justify-between font-extrabold text-brand-300">
                      <span>Total à payer</span>
                      <span>{formatFCFA(1770000)}</span>
                    </div>
                  </div>
                </div>

                {/* Recent invoices activity */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Derniers paiements</span>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">FAC-2026-005</span>
                    <span className="font-medium text-slate-600">Orange Money</span>
                    <span className="font-bold text-emerald-600">{formatFCFA(1062000)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlap floating elements */}
            <div className="absolute -right-4 top-1/4 bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-3 flex items-center gap-2.5 animate-bounce-slow">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Facture Payée</span>
                <span className="text-xs font-extrabold text-slate-800">{formatFCFA(2124000)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trust logos Section */}
      <section className="bg-white border-y border-slate-200/60 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejoint par plus de 10,000 entrepreneurs en Afrique francophone</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale select-none">
            <span className="text-sm font-black tracking-tight text-slate-700">TERANGA GROUP</span>
            <span className="text-sm font-black tracking-tight text-slate-700">BAOBAB CARS</span>
            <span className="text-sm font-black tracking-tight text-slate-700">KOUROUMA & SONS</span>
            <span className="text-sm font-black tracking-tight text-slate-700">SAHEL TECH</span>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tout pour gérer votre facturation professionnelle</h2>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Une interface intuitive et complète avec tous les outils nécessaires aux entreprises locales pour encadrer légalement leurs ventes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How does it work steps */}
      <section id="how-it-works" className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">Comment fonctionne Soninkara Facture ?</h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Un workflow ultra-simplifié pour vous concentrer sur ce qui compte vraiment : développer votre business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Profil de l\'entreprise',
                description: 'Configurez vos coordonnées (Sénégal, Côte d\'ivoire, Mali...) et uploadez le logo de votre marque.'
              },
              {
                step: '02',
                title: 'Fiche client',
                description: 'Enregistrez les adresses de vos clients pour que les coordonnées se chargent automatiquement.'
              },
              {
                step: '03',
                title: 'Facturation & Téléchargement',
                description: 'Ajoutez les lignes de services, les totaux se calculent en direct avec TVA 18%, et exportez en PDF.'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-850 border border-slate-800 rounded-3xl p-8 space-y-4 relative">
                <span className="text-3xl font-black text-brand-500/30 absolute right-6 top-6">{step.step}</span>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Des tarifs transparents pour toutes les tailles</h2>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Choisissez la formule qui convient le mieux à vos besoins professionnels. Annulez ou modifiez votre forfait à tout moment.
          </p>

          {/* Pricing Billing Cycle selector */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={clsx('rounded-lg px-4 py-1.5 text-xs font-bold transition-all', billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={clsx('rounded-lg px-4 py-1.5 text-xs font-bold transition-all', billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >
              Annuel (-20%)
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.map((tier) => (
            <div
              key={tier.name}
              className={clsx(
                'bg-white border rounded-3xl p-8 flex flex-col justify-between relative shadow-premium',
                tier.popular ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/80'
              )}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Recommandé
                </span>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-normal">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-950">
                    {tier.price === 0 ? 'Gratuit' : formatFCFA(tier.price)}
                  </span>
                  {tier.price > 0 && <span className="text-[10px] font-bold text-slate-400">/mois</span>}
                </div>

                <ul className="mt-8 space-y-3.5 text-xs text-slate-600">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 leading-tight">
                      <Check className="h-4.5 w-4.5 text-brand-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={tier.href}
                  className={clsx(
                    'w-full flex items-center justify-center rounded-xl py-3 text-xs font-bold transition-all duration-150',
                    tier.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/10'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-900 pb-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold text-white">Soninkara Facture</span>
          </div>
          <div className="flex gap-8 text-xs font-semibold">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center md:text-left flex flex-col md:flex-row justify-between text-[11px] text-slate-500 font-semibold gap-4">
          <p>© {new Date().getFullYear()} Soninkara Facture. Conçu pour le développement des entrepreneurs africains.</p>
          <p>Mentions Légales · CGU · Politique de confidentialité</p>
        </div>
      </footer>
    </div>
  );
}
