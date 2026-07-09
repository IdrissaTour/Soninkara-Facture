'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Receipt, X } from 'lucide-react';
import { clsx } from 'clsx';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  userEmail?: string;
}

export default function MobileNav({
  isOpen,
  onClose,
  companyName = 'Soninkara Facture',
  userEmail = 'entrepreneur@teranga.sn',
}: MobileNavProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-slate-950 text-slate-200 shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Soninkara Facture</span>
              <span className="block text-[8px] text-slate-500 font-medium tracking-wider uppercase">
                {"Afrique de l'Ouest"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-900 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3 mb-3 border border-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-brand-400">
              {companyName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-200">{companyName}</p>
              <p className="truncate text-[10px] text-slate-400">{userEmail}</p>
            </div>
          </div>
          
          <Link
            href="/login"
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Link>
        </div>
      </div>
    </div>
  );
}
