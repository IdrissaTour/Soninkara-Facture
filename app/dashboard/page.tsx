'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, Clock, AlertTriangle, Plus, User } from 'lucide-react';
import { mockInvoices, mockClients, mockCompany } from '@/lib/mock-data';
import { formatFCFA, formatDateFrench } from '@/lib/utils/invoice';
import { clsx } from 'clsx';
import { getInvoices, getClients, getCompany } from '@/lib/actions/db';
import { Invoice, Client, Company } from '@/lib/types';

export default function DashboardPage() {
  const isSupabase = typeof window !== 'undefined' && !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [invoices, setInvoices] = useState<Invoice[]>(isSupabase ? [] : mockInvoices);
  const [clients, setClients] = useState<Client[]>(isSupabase ? [] : mockClients);
  const [company, setCompany] = useState<Company | null>(isSupabase ? null : mockCompany);
  const [loading, setLoading] = useState(isSupabase);

  useEffect(() => {
    async function loadData() {
      try {
        const [invs, clis, comp] = await Promise.all([
          getInvoices(),
          getClients(),
          getCompany()
        ]);
        setInvoices(invs);
        setClients(clis);
        setCompany(comp);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 1. Calculate dashboard statistics from state
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0);

  const stats = [
    {
      name: 'Total Facturé',
      value: formatFCFA(totalInvoiced),
      subtext: 'Montant cumulé émis',
      icon: Receipt,
      color: 'bg-brand-50 text-brand-600 border-brand-100',
      pillColor: 'bg-brand-100 text-brand-700',
      trend: '+12.5%',
      isUp: true
    },
    {
      name: 'Montant Encaissé',
      value: formatFCFA(totalPaid),
      subtext: 'Paiements validés',
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      pillColor: 'bg-emerald-100 text-emerald-700',
      trend: '+18.2%',
      isUp: true
    },
    {
      name: 'En Attente',
      value: formatFCFA(totalPending),
      subtext: 'Factures envoyées non payées',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      pillColor: 'bg-amber-100 text-amber-700',
      trend: '-4.3%',
      isUp: false
    },
    {
      name: 'En Retard',
      value: formatFCFA(totalOverdue),
      subtext: 'Date d\'échéance dépassée',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      pillColor: 'bg-rose-100 text-rose-700',
      trend: '+8.1%',
      isUp: false // warning trend
    }
  ];

  // Get recent 4 invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
    .slice(0, 4);

  // Status badges helper
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; classes: string }> = {
      paid: { label: 'Payée', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      sent: { label: 'Envoyée', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
      draft: { label: 'Brouillon', classes: 'bg-slate-100 text-slate-800 border-slate-200' },
      overdue: { label: 'En retard', classes: 'bg-rose-100 text-rose-800 border-rose-200' }
    };
    const config = configs[status] || configs.draft;
    return (
      <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.classes)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-3"></div>
        <p className="text-xs text-slate-500 font-bold">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">I bisimila, {company?.name || 'votre entreprise'} !</h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Pilotez l&apos;activité de votre entreprise, suivez vos créances et éditez des factures conformes aux normes fiscales régionales (TVA 18%).
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg hover:bg-slate-50 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 text-brand-600" />
          Nouvelle facture
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200/80 shadow-premium card-hover-effect"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">{stat.name}</span>
                <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl border', stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950">{stat.value}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{stat.subtext}</span>
                  <span className={clsx('flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10px] font-bold', stat.pillColor)}>
                    {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart & Recent invoices split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Sales Chart Card */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Activité de facturation</h3>
              <p className="text-xs text-slate-500">Visualisation des flux de trésorerie (Facturé vs Encaissé)</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span className="text-slate-600">Facturé</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Encaissé</span>
              </div>
            </div>
          </div>

          {/* Premium Custom SVG Chart Area */}
          <div className="relative w-full h-64 mt-2">
            <svg viewBox="0 0 600 240" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="50" y1="30" x2="570" y2="30" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="80" x2="570" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="130" x2="570" y2="130" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="180" x2="570" y2="180" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Chart Gradients definitions */}
              <defs>
                <linearGradient id="chart-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chart-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area filled paths */}
              {/* Blue (Facturé): (50, 180) -> (150, 140) -> (250, 160) -> (350, 80) -> (450, 60) -> (550, 40) */}
              <path
                d="M 50 180 L 150 140 L 250 160 L 350 80 L 450 60 L 550 40 L 550 200 L 50 200 Z"
                fill="url(#chart-blue)"
              />
              {/* Green (Encaissé): (50, 200) -> (150, 170) -> (250, 180) -> (350, 120) -> (450, 90) -> (550, 50) */}
              <path
                d="M 50 200 L 150 170 L 250 180 L 350 120 L 450 90 L 550 50 L 550 200 L 50 200 Z"
                fill="url(#chart-green)"
              />

              {/* Lines paths */}
              <polyline
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,180 150,140 250,160 350,80 450,60 550,40"
              />
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,200 150,170 250,180 350,120 450,90 550,50"
              />

              {/* Data points markers */}
              <circle cx="50" cy="180" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="150" cy="140" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="250" cy="160" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="350" cy="80" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="450" cy="60" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
              <circle cx="550" cy="40" r="4.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />

              <circle cx="50" cy="200" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="150" cy="170" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="250" cy="180" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="350" cy="120" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="450" cy="90" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
              <circle cx="550" cy="50" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />

              {/* X Axis Labels */}
              <text x="50" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Jan</text>
              <text x="150" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Fév</text>
              <text x="250" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Mar</text>
              <text x="350" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Avr</text>
              <text x="450" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Mai</text>
              <text x="550" y="222" fill="#94A3B8" fontSize="11" textAnchor="middle" fontWeight="500">Juin</text>

              {/* Y Axis Labels */}
              <text x="40" y="204" fill="#94A3B8" fontSize="10" textAnchor="end" fontWeight="500">0</text>
              <text x="40" y="134" fill="#94A3B8" fontSize="10" textAnchor="end" fontWeight="500">1M</text>
              <text x="40" y="84" fill="#94A3B8" fontSize="10" textAnchor="end" fontWeight="500">3M</text>
              <text x="40" y="34" fill="#94A3B8" fontSize="10" textAnchor="end" fontWeight="500">5M</text>
            </svg>
          </div>
        </div>

        {/* Clients list overview card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Top Clients</h3>
              <Link href="/dashboard/clients" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Voir tout
              </Link>
            </div>
            <div className="space-y-4">
              {clients.slice(0, 4).map((client) => (
                <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 font-bold text-brand-600 text-xs">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs font-bold text-slate-800">{client.name}</p>
                    <p className="truncate text-[10px] text-slate-400">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-slate-400">Tél</span>
                    <p className="text-[10px] font-semibold text-slate-700">{client.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <Link
              href="/dashboard/clients"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors duration-200"
            >
              <User className="h-4 w-4 text-slate-500" />
              Nouveau client
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table list */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-premium">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Factures récentes</h3>
            <p className="text-xs text-slate-500">Suivi des derniers documents générés et envoyés</p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Voir toutes les factures
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Date d&apos;émission</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4">Total (TVA incluse)</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-indigo-950">
                    {invoice.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {invoice.client?.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDateFrench(invoice.issue_date)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDateFrench(invoice.due_date)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatFCFA(invoice.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Consulter
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
