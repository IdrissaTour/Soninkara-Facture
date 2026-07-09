'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Receipt } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  companyName?: string;
  userEmail?: string;
}

export default function Sidebar({ companyName = 'Soninkara Facture', userEmail = 'entrepreneur@teranga.sn' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 lg:flex z-20">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-900">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-500/20">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Soninkara Facture
          </span>
          <span className="block text-[10px] text-slate-500 font-medium tracking-wider uppercase">
            {"Afrique de l'Ouest"}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              )}
            >
              <Icon className={clsx('h-5 w-5 transition-transform duration-200 group-hover:scale-105', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Profile info */}
      <div className="border-t border-slate-900 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3 mb-3 border border-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-brand-400">
            {companyName.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-xs font-semibold text-slate-200">{companyName}</p>
            <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
          </div>
        </div>
        
        <Link
          href="/login"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
