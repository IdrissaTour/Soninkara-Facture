import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Contrôle strict du Rate Limiting pour les tentatives d'authentification et API auth
  const isAuthPath = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');
  const isApiAuthPath = request.nextUrl.pathname.startsWith('/api/auth') && request.nextUrl.pathname !== '/api/auth/rate-limit';

  if ((isAuthPath && request.method === 'POST') || isApiAuthPath) {
    const ip = getClientIpFromHeaders(request.headers);
    const rateLimitKey = `mw_auth_${ip}`;
    const limitResult = checkRateLimit(rateLimitKey, 5, 60000);

    if (!limitResult.success) {
      return NextResponse.json(
        {
          error: `Trop de tentatives (max 5 par minute). Votre IP est temporairement bloquée pendant ${limitResult.resetSeconds} secondes afin d'empêcher les attaques par force brute.`,
          retryAfter: limitResult.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limitResult.resetSeconds),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are not set yet (local mock mode), skip auth routing
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  function isUserAdmin(email?: string): boolean {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const adminEmails = [
      'soninkaradigital@gmail.com',
      'soninkaradigital+1@gmail.com',
      'idrissa@example.com',
      'amadou@example.com',
      'toureidi321@gmail.com',
      'entrepreneur@teranga.sn',
      'contact@soninkaratech.sn'
    ];
    return adminEmails.includes(cleanEmail) || 
           cleanEmail.endsWith('@soninkara.sn') || 
           cleanEmail.endsWith('@soninkara-facture.sn');
  }

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');

  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vérification stricte du statut de l'abonnement pour le Dashboard
  if (isDashboardRoute && user) {
    const isAbonnementRoute = request.nextUrl.pathname === '/dashboard/abonnement';
    const isAdmin = isUserAdmin(user.email);

    if (!isAbonnementRoute && !isAdmin) {
      const { data: abonnement } = await supabase
        .from('abonnements')
        .select('statut, plan, date_fin_essai, date_prochaine_facturation')
        .eq('utilisateur_id', user.id)
        .maybeSingle();

      let isExpired = false;
      const now = new Date();

      if (!abonnement) {
        isExpired = true; // Pas d'abonnement = expiré par défaut
      } else if (abonnement.plan === 'essai') {
        // Période d'essai de 30 jours
        const dateFinEssai = abonnement.date_fin_essai ? new Date(abonnement.date_fin_essai) : null;
        if (abonnement.statut === 'expire' || (dateFinEssai && now > dateFinEssai)) {
          isExpired = true;
        }
      } else {
        // Abonnement payant
        const dateProchaineFacturation = abonnement.date_prochaine_facturation 
          ? new Date(abonnement.date_prochaine_facturation) 
          : null;
        if (abonnement.statut !== 'actif' || (dateProchaineFacturation && now > dateProchaineFacturation)) {
          isExpired = true;
        }
      }

      if (isExpired) {
        return NextResponse.redirect(new URL('/dashboard/abonnement?expire=true', request.url));
      }
    }
  }

  if (isAuthRoute && user) {
    const redirectPath = isUserAdmin(user.email) ? '/dashboard/admin' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup', '/api/auth/:path*'],
};

