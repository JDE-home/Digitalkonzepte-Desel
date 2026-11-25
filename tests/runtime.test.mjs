// Läuft die gebaute Seite unter den echten Sicherheitsheadern (CSP) und funktionieren die Interaktionen? Der Build läuft vorab über "npm test" (pretest)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve } from './helpers/serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const pages = JSON.parse(fs.readFileSync('src/pages.json', 'utf8'));
const { port, close } = await serve(path.resolve('public'));
const browser = await chromium.launch();
const url = (p) => `http://localhost:${port}${p}`;
async function open(p, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('requestfailed', (r) => problems.push('fehlgeschlagen: ' + r.url()));
  await page.goto(url(p), { waitUntil: 'networkidle' });
  return { ctx, page, problems };
}

for (const p of pages) {
  test(`${p.slug}: keine Konsolenfehler und keine CSP-Verstöße`, async () => {
    const { ctx, problems } = await open(p.path);
    await ctx.close();
    // die 404-Seite selbst liefert im Test den Status 404 für Fremdpfade nicht, daher kein Sonderfall nötig
    assert.deepEqual(problems, []);
  });
}

test('Konfigurator rechnet und gibt die Auswahl an die Kontaktseite weiter', async () => {
  const { ctx, page } = await open('/pakete-preise');
  const monat = page.locator('[data-sum-monat]');
  assert.match(await monat.textContent(), /79/);
  await page.locator('#b-funktion').check();
  await page.locator('#b-beratung').check();
  await page.waitForTimeout(250);
  assert.match(await monat.textContent(), /118/);
  assert.match(await page.locator('[data-sum-einmal]').textContent(), /290/);
  await page.locator('#w-erweitert').check();
  await page.waitForTimeout(250);
  assert.match(await monat.textContent(), /168/);
  // Tastatur: Radiogruppe per Pfeiltaste
  await page.locator('#w-ohne').focus(); await page.keyboard.press('Space'); await page.waitForTimeout(250);
  assert.match(await monat.textContent(), /39/);
  await page.locator('[data-config-cta]').click();
  await page.waitForURL(/\/kontakt\?paket=/);
  assert.ok(await page.locator('[data-selection]').isVisible());
  assert.equal(await page.locator('#topic').inputValue(), 'KI-Beratung');
  assert.match(await page.locator('[data-selection-list]').textContent(), /KI-Einstiegsberatung/);
  await ctx.close();
});

test('Design-Umschalter wechselt und merkt sich die Wahl', async () => {
  const { ctx, page } = await open('/', { colorScheme: 'light' });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await page.locator('[data-theme-toggle]').click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await ctx.close();
});

test('Mobiles Menü: öffnen, per Escape schließen, Fokus zurück', async () => {
  const { ctx, page } = await open('/', { viewport: { width: 390, height: 844 } });
  const burger = page.locator('[data-menu-toggle]');
  assert.equal(await burger.getAttribute('aria-expanded'), 'false');
  assert.ok(!(await page.locator('[data-nav] a', { hasText: 'Leistungen' }).isVisible()));
  await burger.click();
  assert.equal(await burger.getAttribute('aria-expanded'), 'true');
  await page.waitForTimeout(300);
  assert.ok(await page.locator('[data-nav] a', { hasText: 'Leistungen' }).isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await burger.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle')), true);
  await ctx.close();
});

test('Chat-Demo spielt ab und kann wiederholt werden; bei reduzierter Bewegung sofort sichtbar', async () => {
  const { ctx, page } = await open('/leistungen');
  await page.locator('[data-chat-demo]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(6500);
  assert.equal(await page.locator('.chat-log [data-step]:not([hidden])').count(), 5);
  await page.locator('[data-replay]').click();
  await page.waitForTimeout(200);
  assert.ok((await page.locator('.chat-log [data-step]:not([hidden])').count()) < 5);
  await ctx.close();
  const r = await open('/leistungen', { reducedMotion: 'reduce' });
  assert.equal(await r.page.locator('.chat-log [data-step]:not([hidden])').count(), 5);
  await r.ctx.close();
});

test('Kontaktformular: Prüfung zeigt Fehler am Feld und setzt den Fokus', async () => {
  const { ctx, page } = await open('/kontakt');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('#name-error').textContent(), /Namen/);
  assert.match(await page.locator('#consent-error').textContent(), /Datenschutz/);
  assert.equal(await page.locator('#name').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
  await ctx.close();
});

test('Kontaktformular sendet an /api/contact und zeigt die Erfolgsmeldung', async () => {
  const { ctx, page } = await open('/kontakt');
  let sent = null;
  await page.route('**/api/contact', async (route) => { sent = JSON.parse(route.request().postData()); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.fill('#name', 'Erika Muster'); await page.fill('#mail', 'erika@example.com'); await page.check('#consent');
  await page.locator('button[type="submit"]').click();
  await page.locator('[data-status][data-state="ok"]').waitFor({ timeout: 8000 });
  assert.equal(sent.name, 'Erika Muster');
  assert.ok(sent.elapsed >= 3000);
  assert.equal(sent.website, '');
  await ctx.close();
});

test.after(async () => { await browser.close(); close(); });
