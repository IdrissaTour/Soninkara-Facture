'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  Package,
  ArrowLeft,
  ShoppingBag,
  Award,
  Tag,
  Calendar,
  Plus,
  Download,
  Printer,
  Loader2,
  Building2,
  Store,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { getBoutiqueStats, getProduits, getBoutiqueById } from '@/lib/actions/boutiques';
import { getExpenses, getCompany } from '@/lib/actions/db';
import { BoutiqueStats, Expense, Produit, Company, Boutique } from '@/lib/types';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { mockCompany } from '@/lib/mock-data';

export default function StatsBoutiquePage() {
  const params = useParams();
  const boutiqueId = params.id as string;

  const [stats, setStats] = useState<BoutiqueStats | null>(null);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [boutiqueExpenses, setBoutiqueExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, bData, prodsData, compData, allExpenses] = await Promise.all([
          getBoutiqueStats(boutiqueId),
          getBoutiqueById(boutiqueId),
          getProduits(boutiqueId),
          getCompany(),
          getExpenses()
        ]);
        setStats(statsData);
        setBoutique(bData);
        setProduits(prodsData);
        setCompany(compData);
        setBoutiqueExpenses(allExpenses.filter(e => e.boutique_id === boutiqueId));
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [boutiqueId]);

  const getPdfOptions = () => {
    return {
      margin: 10,
      filename: `Rapport_Statistiques_${stats?.nomBoutique.replace(/\s+/g, '_') || 'boutique'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
  };

  const handleDownloadPDF = async () => {
    if (!stats) return;
    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector('.print-boutique-stats-sheet');
      if (element) {
        await html2pdf().from(element as HTMLElement).set(getPdfOptions()).save();
      } else {
        alert("Erreur: Élément du rapport introuvable.");
      }
    } catch (error) {
      console.error("Erreur de génération PDF:", error);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200" />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Statistiques indisponibles pour cette boutique.</p>
        <Link href="/dashboard/boutiques" className="mt-4 inline-block text-xs font-bold text-brand-600">
          ← Retour à la liste des boutiques
        </Link>
      </div>
    );
  }

  const currentCompany = company || mockCompany;

  // Native SVG Chart calculations
  const maxCA = Math.max(...stats.monthlySales.map(m => m.ca), 100000);
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 30;

  const pointsCA = stats.monthlySales.map((m, idx) => {
    const x = padding + (idx * ((svgWidth - padding * 2) / (stats.monthlySales.length - 1)));
    const y = svgHeight - padding - ((m.ca / maxCA) * (svgHeight - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  const pointsBen = stats.monthlySales.map((m, idx) => {
    const x = padding + (idx * ((svgWidth - padding * 2) / (stats.monthlySales.length - 1)));
    const y = svgHeight - padding - ((m.benefice / maxCA) * (svgHeight - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  const areaPointsCA = `${padding},${svgHeight - padding} ${pointsCA} ${svgWidth - padding},${svgHeight - padding}`;
  const areaPointsBen = `${padding},${svgHeight - padding} ${pointsBen} ${svgWidth - padding},${svgHeight - padding}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/boutiques"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{stats.nomBoutique}</span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Statistiques Financières & Bénéfices
            </h1>
          </div>
        </div>

        {/* Action Buttons for PDF Export */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Télécharger le Rapport PDF
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Imprimer ou enregistrer en PDF"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 no-print">
        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stock`}
          className="flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Package className="h-4 w-4" />
          Inventaire Stock
        </Link>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/ventes`}
          className="flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Ventes & Caisse
        </Link>

        <Link
          href={`/dashboard/boutiques/${boutiqueId}/stats`}
          className="flex items-center gap-2 border-b-2 border-brand-600 pb-3 text-sm font-bold text-brand-600"
        >
          <BarChart3 className="h-4 w-4" />
          Statistiques & Bénéfices
        </Link>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chiffre d&apos;Affaires</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatFCFA(stats.chiffreAffaires)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Brut de ventes boutique</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Coût des Achats</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">{formatFCFA(stats.coutAchats)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Acquisition des produits vendus</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dépenses Boutique</span>
          <div className="mt-2 text-2xl font-extrabold text-rose-600">{formatFCFA(stats.totalExpenses)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Frais & charges du point de vente</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-premium">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bénéfice Net Réel</span>
          <div className={`mt-2 text-2xl font-extrabold ${stats.beneficeNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatFCFA(stats.beneficeNet)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Après coûts d&apos;achats & dépenses</p>
        </div>
      </div>

      {/* Main Revenue vs Profit SVG Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Évolution du Chiffre d&apos;Affaires vs Bénéfices</h3>
            <p className="text-xs text-slate-500">Représentation visuelle des flux financiers par mois</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-brand-600">
              <span className="h-3 w-3 rounded-full bg-brand-600" /> Chiffre d&apos;Affaires
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Bénéfice Net
            </span>
          </div>
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-64 overflow-visible">
            <defs>
              <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="benGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padding + ratio * (svgHeight - padding * 2);
              return (
                <line
                  key={idx}
                  x1={padding}
                  y1={y}
                  x2={svgWidth - padding}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area Fills */}
            <polygon points={areaPointsCA} fill="url(#caGrad)" />
            <polygon points={areaPointsBen} fill="url(#benGrad)" />

            {/* Polylines */}
            <polyline
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsCA}
            />
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsBen}
            />

            {/* Markers & X-Axis Labels */}
            {stats.monthlySales.map((m, idx) => {
              const x = padding + (idx * ((svgWidth - padding * 2) / (stats.monthlySales.length - 1)));
              const yCA = svgHeight - padding - ((m.ca / maxCA) * (svgHeight - padding * 2));
              const yBen = svgHeight - padding - ((m.benefice / maxCA) * (svgHeight - padding * 2));

              return (
                <g key={m.month}>
                  <circle cx={x} cy={yCA} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
                  <circle cx={x} cy={yBen} r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                  <text x={x} y={svgHeight - 8} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                    {m.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Top 5 Products Table / Profit Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-extrabold text-slate-900">Top 5 Produits les Plus Rentables</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Par marge brute</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.topProduits.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">Aucune vente enregistrée pour alimenter le top produits.</p>
            ) : (
              stats.topProduits.map((item, idx) => (
                <div key={item.nom} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{item.nom}</h4>
                      <span className="text-[11px] text-slate-500">{item.quantite} unités vendues</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-emerald-600">+{formatFCFA(item.benefice)}</div>
                    <div className="text-[10px] text-slate-400">CA: {formatFCFA(item.ca)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Boutique Expenses breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-premium space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-rose-500" />
              <h3 className="text-base font-extrabold text-slate-900">Dépenses de cette Boutique</h3>
            </div>
            <Link
              href="/dashboard/expenses"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {boutiqueExpenses.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">Aucune dépense affectée spécifiquement à cette boutique.</p>
            ) : (
              boutiqueExpenses.map((exp) => (
                <div key={exp.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{exp.description}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {exp.category || 'Autre'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDateFrench(exp.date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-rose-600">-{formatFCFA(exp.amount)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PRINTABLE PDF REPORT SHEET CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-premium print-shadow-none print-only:p-0 print-boutique-stats-sheet">
        {/* Document Header */}
        <div className="flex justify-between items-start gap-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                <Store className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">Point de Vente</span>
                <h2 className="text-xl font-extrabold text-slate-900">{stats.nomBoutique}</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {boutique?.adresse || 'Adresse non renseignée'}
            </p>
          </div>

          <div className="text-right space-y-1">
            <h3 className="text-sm font-bold text-slate-900">{currentCompany.name}</h3>
            <p className="text-[11px] text-slate-500">{currentCompany.address}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
              Date d&apos;édition : {formatDateFrench(new Date().toISOString().split('T')[0])}
            </p>
          </div>
        </div>

        {/* Report Title */}
        <div className="py-6 border-b border-slate-100">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">RAPPORT FINANCIER & DE STOCK</h1>
          <p className="text-xs text-slate-500 mt-0.5">Bilan détaillé des produits, prix d&apos;achat, prix de vente, bénéfices et dépenses.</p>
        </div>

        {/* Financial KPI Summary Table */}
        <div className="py-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Synthèse Financière</h4>
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Ventes Totales</span>
              <span className="text-sm font-extrabold text-slate-900 mt-1 block">{formatFCFA(stats.chiffreAffaires)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Coût Achats</span>
              <span className="text-sm font-extrabold text-amber-600 mt-1 block">{formatFCFA(stats.coutAchats)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Dépenses Boutique</span>
              <span className="text-sm font-extrabold text-rose-600 mt-1 block">{formatFCFA(stats.totalExpenses)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Bénéfice Net Réel</span>
              <span className={`text-sm font-extrabold mt-1 block ${stats.beneficeNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatFCFA(stats.beneficeNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Products Table with Purchase Price, Selling Price and Margin */}
        <div className="py-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            2. Inventaire des Produits & Marges Bénéficiaires ({produits.length} références)
          </h4>
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                <th className="py-2.5 px-3">Produit</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3 text-right">Prix Achat</th>
                <th className="py-2.5 px-3 text-right">Prix Vente</th>
                <th className="py-2.5 px-3 text-right">Marge / Unité</th>
                <th className="py-2.5 px-3 text-right">Valeur Stock (Achat)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
              {produits.map((prod) => {
                const margeUnitaire = prod.prix_vente - prod.prix_achat;
                const valeurStockAchat = prod.quantite_stock * prod.prix_achat;
                return (
                  <tr key={prod.id}>
                    <td className="py-2.5 px-3 font-semibold">
                      {prod.nom}
                      {prod.reference && <span className="text-[10px] text-slate-400 block font-normal">{prod.reference}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{prod.quantite_stock}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatFCFA(prod.prix_achat)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatFCFA(prod.prix_vente)}</td>
                    <td className={`py-2.5 px-3 text-right font-extrabold ${margeUnitaire >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      +{formatFCFA(margeUnitaire)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700">{formatFCFA(valeurStockAchat)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expenses List */}
        <div className="py-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            3. Registre des Dépenses de la Boutique ({boutiqueExpenses.length})
          </h4>
          {boutiqueExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucune dépense affectée à cette boutique.</p>
          ) : (
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Catégorie</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                {boutiqueExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-2.5 px-3 font-semibold">{exp.description}</td>
                    <td className="py-2.5 px-3 text-slate-600">{exp.category || 'Autre'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDateFrench(exp.date)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">-{formatFCFA(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>Document généré automatiquement par l&apos;application Soninkara Facture. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
