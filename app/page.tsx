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
      name: 'Starter',
      price: billingCycle === 'monthly' ? 3000 : 2400,
      description: 'Idéal pour démarrer avec un premier point de vente.',
      features: [
        '1 boutique configurée',
        'Factures & Devis illimités',
        'Clients illimités',
        'Calcul automatique TVA 18%',
        'Saisie vocale Wolof, Bambara, Soninké',
        'Export PDF standard',
        'Support standard par email'
      ],
      cta: 'Démarrer Starter',
      href: '/dashboard',
      popular: false
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? 10000 : 8000,
      description: 'Conçu pour les commerces et PME en pleine croissance.',
      features: [
        'Tout le plan Starter',
        'Jusqu\'à 6 boutiques physiques / stocks',
        'Logo d\'entreprise personnalisé',
        'Rapports & statistiques avancés',
        'Relance automatique des retards',
        'Support client prioritaire WhatsApp'
      ],
      cta: 'Choisir le plan Pro',
      href: '/dashboard',
      popular: true
    },
    {
      name: 'Entreprise',
      price: billingCycle === 'monthly' ? 25000 : 20000,
      description: 'Pour les structures gérant plusieurs activités complexes.',
      features: [
        'Tout le plan Pro',
        'Boutiques & Stocks illimités',
        'Multi-entreprises configurées',
        'Accès collaborateur pour votre comptable',
        'Intégration API de paiement locale',
        'Sauvegarde Cloud automatique'
      ],
      cta: 'Activer Entreprise',
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

          {/* Simulated App Dashboard Mockup with Pro Animations */}
          <div className="lg:col-span-6 relative">
            {/* Glowing Backdrop Aura */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-brand-600/25 via-indigo-500/20 to-purple-600/25 rounded-3xl blur-3xl -z-10 animate-pulse-glow" />
            
            {/* Main Browser Mockup Card */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl p-5 md:p-6 relative overflow-hidden transition-all duration-500 hover:border-brand-300">
              {/* Browser Toolbar */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400/90 shadow-sm" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/90 shadow-sm" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/90 shadow-sm" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100/80 border border-slate-200/60 rounded-xl px-3 py-1 shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="tracking-tight text-slate-600">app.soninkarafacture.sn/dashboard</span>
                </div>
              </div>

              {/* Dashboard Content Mockup */}
              <div className="space-y-4">
                {/* Key Metrics Cards with Mini SVG Sparklines */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Card 1: Paid */}
                  <div className="p-3.5 bg-gradient-to-b from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-100 space-y-1 relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payé ce mois</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">+18.4%</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-sm md:text-base font-black text-slate-900">{formatFCFA(3186000)}</span>
                    </div>
                    {/* SVG Sparkline */}
                    <div className="h-5 w-full pt-1">
                      <svg className="w-full h-full text-emerald-500 stroke-current fill-none overflow-visible" viewBox="0 0 100 25">
                        <path d="M0,20 Q20,5 40,15 T80,5 T100,10" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Overdue */}
                  <div className="p-3.5 bg-gradient-to-b from-slate-50 to-rose-50/30 rounded-2xl border border-slate-100 space-y-1 relative overflow-hidden group hover:border-rose-200 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En retard</span>
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded-full">-12%</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-sm md:text-base font-black text-rose-600">{formatFCFA(5015000)}</span>
                    </div>
                    {/* SVG Sparkline */}
                    <div className="h-5 w-full pt-1">
                      <svg className="w-full h-full text-rose-400 stroke-current fill-none overflow-visible" viewBox="0 0 100 25">
                        <path d="M0,8 Q25,22 50,10 T80,18 T100,5" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Dark Invoice Card with Shimmer Beam */}
                <div className="p-4 bg-gradient-to-br from-brand-950 via-slate-900 to-indigo-950 text-white rounded-2xl space-y-3.5 shadow-xl border border-brand-800/40 animate-shimmer relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-brand-800/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-400 animate-ping" />
                      <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider">Création Facture Vocale</span>
                    </div>
                    <span className="text-[10px] font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white px-2 py-0.5 rounded-md shadow-sm border border-brand-400/20">
                      TVA 18% Actif
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-200 font-medium">
                      <span>Prestation Développement Web</span>
                      <span className="font-extrabold text-white">{formatFCFA(1500000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>TVA UEMOA (18%)</span>
                      <span>{formatFCFA(270000)}</span>
                    </div>
                    <div className="border-t border-brand-800/80 pt-2.5 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Total TTC à émettre</span>
                      <span className="text-sm font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                        {formatFCFA(1770000)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Payments Feed */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dernières Activités</span>
                    <span className="text-[10px] font-bold text-brand-600 hover:underline cursor-pointer">Tout voir</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 text-xs hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        OM
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">FAC-2026-005</span>
                        <span className="text-[10px] text-slate-400 block">Orange Money Sénégal</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600">{formatFCFA(1062000)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphism Badge 1 (Top Right) */}
            <div className="absolute -right-3 sm:-right-6 top-12 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-float-slow z-20 hover:scale-105 transition-transform">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Facture Payée</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-black text-slate-900 block">{formatFCFA(2124000)}</span>
              </div>
            </div>

            {/* Floating Glassmorphism Badge 2 (Bottom Left) */}
            <div className="absolute -left-3 sm:-left-6 -bottom-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-float-delayed z-20 hover:scale-105 transition-transform text-white">
              <div className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 shrink-0">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <div>
                <span className="text-[10px] text-brand-300 font-bold uppercase block">Paiement Wave Reçu</span>
                <span className="text-xs font-black text-white block">+ {formatFCFA(450000)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trust logos Section - Horizontal Slideshow Marquee */}
      <section className="bg-white border-y border-slate-200/60 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Rejoint par plus de 10,000 entrepreneurs en Afrique francophone
          </p>
          
          {/* Marquee Container with edge gradients */}
          <div className="relative w-full overflow-hidden py-2">
            {/* Left & Right Gradient Fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />

            {/* Scrolling Track */}
            <div className="animate-marquee items-center gap-12 sm:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 select-none">
              {[
                'TERANGA GROUP',
                'BAOBAB CARS',
                'KOUROUMA & SONS',
                'SAHEL TECH',
                'DAKAR LOGISTICS',
                'ABIDJAN DISTRIB',
                'SENEGAL TRADING',
                'BAMAKO IMPEX',
                'TERANGA GROUP',
                'BAOBAB CARS',
                'KOUROUMA & SONS',
                'SAHEL TECH',
                'DAKAR LOGISTICS',
                'ABIDJAN DISTRIB',
                'SENEGAL TRADING',
                'BAMAKO IMPEX',
              ].map((logo, idx) => (
                <div key={idx} className="flex items-center gap-3 shrink-0 px-4 group cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-brand-500/40 group-hover:bg-brand-600 group-hover:scale-125 transition-all" />
                  <span className="text-sm font-black tracking-tight text-slate-700 group-hover:text-brand-700 transition-colors">
                    {logo}
                  </span>
                </div>
              ))}
            </div>
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
