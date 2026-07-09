'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, Bell, Calendar } from 'lucide-react';
import { formatDateFrench } from '@/lib/utils/invoice';

interface TopBarProps {
  onMenuOpen: () => void;
  companyName?: string;
}

export default function TopBar({ onMenuOpen, companyName = 'Soninkara Tech Solutions' }: TopBarProps) {
  const pathname = usePathname();

  const getPageDetails = () => {
    if (pathname === '/dashboard') {
      return { title: 'Tableau de bord', subtitle: 'Aperçu général de vos performances financières' };
    }
    if (pathname?.startsWith('/dashboard/invoices')) {
      if (pathname.includes('/new')) {
        return { title: 'Nouvelle facture', subtitle: 'Créer un nouveau document de facturation' };
      }
      if (pathname.match(/\/invoices\/inv-\d+/)) {
        return { title: 'Détail de la facture', subtitle: 'Visualisation et actions sur la facture' };
      }
      return { title: 'Factures', subtitle: 'Gérez et suivez l\'état de vos factures clients' };
    }
    if (pathname?.startsWith('/dashboard/clients')) {
      return { title: 'Clients', subtitle: 'Répertoire de vos contacts et partenaires commerciaux' };
    }
    if (pathname?.startsWith('/dashboard/settings')) {
      return { title: 'Paramètres', subtitle: 'Configurez les informations et l\'identité de votre entreprise' };
    }
    return { title: 'Soninkara Facture', subtitle: 'Gérez votre trésorerie' };
  };

  const { title, subtitle } = getPageDetails();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 shadow-sm backdrop-blur-md lg:px-8">
      {/* Mobile Menu button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* Date & Actions */}
      <div className="flex items-center gap-4">
        {/* Company Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-250/30 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <span>{companyName}</span>
        </div>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>{formatDateFrench(todayStr)}</span>
        </div>

        {/* Notifications mock icon */}
        <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors duration-200">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600"></span>
        </button>

        {/* Quick New Invoice Action Button */}
        {pathname !== '/dashboard/invoices/new' && (
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Créer une facture</span>
          </Link>
        )}
      </div>
    </header>
  );
}
