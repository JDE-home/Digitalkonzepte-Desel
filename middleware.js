import { next } from '@vercel/functions';
import { COOKIE, makeToken, safeEqual } from './auth.js';

// Schützt alle Seiten. Ohne gültiges Cookie geht es zur Login-Seite.
// Impressum und Datenschutz bleiben immer öffentlich erreichbar (rechtlich vorgeschrieben).
// Ohne gesetztes SITE_PASSWORD bleibt die Seite gesperrt (sicherer Standard).
export const config = {
  matcher: ['/((?!login|api/login|impressum|datenschutz|assets/|favicon\\.ico).*)'],
};

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;
  const cookie = (request.headers.get('cookie') || '')
    .split(/;\s*/)
    .find((c) => c.startsWith(COOKIE + '='));
  const value = cookie ? cookie.slice(COOKIE.length + 1) : '';

  if (password && value && safeEqual(value, await makeToken(password))) {
    return next();
  }

  const url = new URL(request.url);
  const target = new URL('/login', url);
  if (url.pathname !== '/' || url.search) target.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(target, 302);
}
