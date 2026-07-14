import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

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

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');

  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  function isUserAdmin(email?: string): boolean {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const adminEmails = [
      'soninkaradigital@gmail.com',
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

  if (isAuthRoute && user) {
    const redirectPath = isUserAdmin(user.email) ? '/dashboard/admin' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
