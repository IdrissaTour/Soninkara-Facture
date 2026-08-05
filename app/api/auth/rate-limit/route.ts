import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'auth_attempt';
    
    const rateLimitKey = `auth_${action}_${ip}`;
    
    // Limitation stricte à 5 tentatives par minute (60 000 ms) par IP
    const result = checkRateLimit(rateLimitKey, 5, 60000);

    if (!result.success) {
      return NextResponse.json(
        {
          allowed: false,
          error: `Trop de tentatives (max 5 par minute). Votre IP est temporairement bloquée pendant ${result.resetSeconds} secondes afin de bloquer toute attaque par force brute.`,
          remaining: 0,
          resetSeconds: result.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.resetSeconds),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    return NextResponse.json({
      allowed: true,
      remaining: result.remaining,
      resetSeconds: result.resetSeconds,
    });
  } catch {
    return NextResponse.json(
      { allowed: true, remaining: 5, resetSeconds: 0 },
      { status: 200 }
    );
  }
}
