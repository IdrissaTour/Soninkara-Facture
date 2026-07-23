'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { getCompany, getAbonnement } from '@/lib/actions/db';
import { checkAdminStatus } from '@/lib/actions/admin';
import { BanniereEssai } from '@/components/subscription/BanniereEssai';
import { Abonnement } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Soninkara Tech Solutions');
  const [userEmail, setUserEmail] = useState('entrepreneur@teranga.sn');
  const [isAdmin, setIsAdmin] = useState(false);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);

  useEffect(() => {
    async function loadData() {
      const company = await getCompany();
      const adminActive = await checkAdminStatus();
      const sub = await getAbonnement();
      setAbonnement(sub);
      setIsAdmin(adminActive);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isSupabase = !!(supabaseUrl && supabaseAnonKey);

      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAdminRoute = pathname.startsWith('/dashboard/admin');

      if (isSupabase && !company && !adminActive && !isAdminRoute) {
        router.push('/onboarding');
        return;
      }

      if (company && company.name) {
        setCompanyName(company.name);
      }
      
      if (isSupabase) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email) {
            setUserEmail(user.email);
          }
        } catch (err) {
          console.error('Error fetching user email in layout:', err);
        }
      }
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar for Desktop */}
      <Sidebar companyName={companyName} userEmail={userEmail} isAdmin={isAdmin} />

      {/* Slide-out Sidebar for Mobile */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        companyName={companyName}
        userEmail={userEmail}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className="flex flex-col lg:pl-64 min-h-screen">
        {/* Top Header */}
        <TopBar onMenuOpen={() => setMobileMenuOpen(true)} companyName={companyName} />

        {/* Dashboard Pages Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <BanniereEssai abonnement={abonnement} />
          {children}
        </main>
      </div>
    </div>
  );
}
