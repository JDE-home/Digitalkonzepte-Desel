import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as login } from '../api/login.js';
import middleware, { config } from '../middleware.js';
import { COOKIE, makeToken, safeEqual } from '../auth.js';

const loginReq = (body) => new Request('https://example.test/api/login', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const page = (path, cookie) => new Request('https://example.test' + path, { headers: cookie ? { cookie } : {} });

test('Login ohne SITE_PASSWORD: 503 (Zugang bleibt gesperrt)', async () => {
  delete process.env.SITE_PASSWORD;
  assert.equal((await login(loginReq({ password: 'x' }))).status, 503);
});

test('Login: falsches Passwort 401 ohne Cookie, richtiges 200 mit sicherem Cookie', async () => {
  process.env.SITE_PASSWORD = 'geheim-und-lang-genug';
  const bad = await login(loginReq({ password: 'falsch' }));
  assert.equal(bad.status, 401);
  assert.equal(bad.headers.get('set-cookie'), null);
  const ok = await login(loginReq({ password: 'geheim-und-lang-genug' }));
  assert.equal(ok.status, 200);
  const c = ok.headers.get('set-cookie');
  assert.match(c, new RegExp(`^${COOKIE}=[0-9a-f]{64};`));
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=604800']) assert.ok(c.includes(flag), flag);
  assert.ok(!c.includes('geheim'), 'das Passwort steht nicht im Cookie');
  assert.equal((await login(loginReq('{kaputt'))).status, 400);
});

test('Middleware: ohne gültiges Cookie Weiterleitung zum Login, mit Cookie Durchlass', async () => {
  process.env.SITE_PASSWORD = 'geheim-und-lang-genug';
  const token = await makeToken('geheim-und-lang-genug');
  let r = await middleware(page('/'));
  assert.equal(r.status, 302);
  assert.equal(new URL(r.headers.get('location')).pathname + new URL(r.headers.get('location')).search, '/login');
  r = await middleware(page('/pakete-preise?x=1'));
  assert.equal(new URL(r.headers.get('location')).searchParams.get('next'), '/pakete-preise?x=1');
  r = await middleware(page('/', `${COOKIE}=falsch`));
  assert.equal(r.status, 302);
  r = await middleware(page('/', `a=b; ${COOKIE}=${token}`));
  assert.ok(r.headers.get('x-middleware-next'), 'Durchlass');
  process.env.SITE_PASSWORD = 'anderes-passwort';
  assert.equal((await middleware(page('/', `${COOKIE}=${token}`))).status, 302, 'Passwortwechsel macht alte Anmeldungen ungültig');
});

test('Middleware sperrt ohne SITE_PASSWORD alles, auch mit Cookie', async () => {
  delete process.env.SITE_PASSWORD;
  const token = await makeToken('irgendwas');
  assert.equal((await middleware(page('/', `${COOKIE}=${token}`))).status, 302);
});

test('Matcher: Login, Impressum, Datenschutz und Assets bleiben offen, der Rest ist geschützt', () => {
  const re = new RegExp('^' + config.matcher[0].replace(/\\\\/g, '\\') + '$');
  for (const open of ['/login', '/api/login', '/impressum', '/datenschutz', '/assets/css/site.css', '/favicon.ico']) assert.ok(!re.test(open), `${open} muss offen sein`);
  for (const closed of ['/', '/websites', '/ki', '/pakete-preise', '/kontakt', '/api/contact', '/sitemap.xml']) assert.ok(re.test(closed), `${closed} muss geschützt sein`);
});

test('safeEqual vergleicht korrekt', () => {
  assert.ok(safeEqual('abc', 'abc'));
  assert.ok(!safeEqual('abc', 'abd'));
  assert.ok(!safeEqual('abc', 'abcd'));
});
