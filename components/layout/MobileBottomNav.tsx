'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Store, TrendingDown, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const ONGLETS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/invoices', label: 'Factures', icon: FileText },
  { href: '/dashboard/boutiques', label: 'Boutiques', icon: Store },
  { href: '/dashboard/expenses', label: 'Dépenses', icon: TrendingDown },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-1 backdrop-blur-md shadow-lg lg:hidden select-none">
      {ONGLETS.map(({ href, label, icon: Icon }) => {
        const isExact = href === '/dashboard';
        const isActive = isExact
          ? pathname === '/dashboard'
          : pathname?.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200',
              isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            )}
          >
            {/* Témoin actif lumineux supérieur */}
            {isActive && (
              <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 shadow-sm shadow-brand-500/50 animate-fadeIn" />
            )}

            <div
              className={clsx(
                'flex items-center justify-center p-1 rounded-xl transition-all duration-200',
                isActive && 'bg-brand-50/80 text-brand-600 scale-110'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            </div>

            <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
