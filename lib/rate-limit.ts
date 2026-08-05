/**
 * Module de limitation du débit (Rate Limiting) basé sur une fenêtre glissante.
 * Permet de prémunir l'application contre les attaques par force brute (brute force protection).
 * Par défaut : 5 tentatives max par minute par clé/IP.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Nettoyage automatique des entrées expirées toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Extrait l'adresse IP du client depuis les en-têtes de requête HTTP.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

/**
 * Vérifie et met à jour le quota de tentatives pour une clé donnée (IP).
 * @param key Identifiant unique (ex: IP du client)
 * @param limit Nombre maximal de tentatives autorisées dans la fenêtre (par défaut 5)
 * @param windowMs Durée de la fenêtre temporelle en millisecondes (par défaut 60 000 ms = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60000
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
      timestamps: [now],
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Conservation uniquement des horodatages se situant dans la fenêtre glissante
  const validTimestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
  validTimestamps.push(now);

  const currentCount = validTimestamps.length;
  entry.timestamps = validTimestamps;
  entry.count = currentCount;

  const resetSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));

  if (currentCount > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - currentCount),
    resetSeconds,
  };
}

/**
 * Réinitialise manuellement le compteur de tentatives pour une clé (ex: après connexion réussie).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
