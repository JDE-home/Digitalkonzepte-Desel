// Prüft die gebaute Seite (public/) auf SEO, Sie-Ansprache und Datenschutz. Der Build läuft vorab über "npm test" (pretest)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public');
const pages = JSON.parse(fs.readFileSync('src/pages.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('src/site.json', 'utf8'));
const file = (p) => (p.slug === 'index' ? 'index.html' : `${p.slug}.html`);
const html = (p) => fs.readFileSync(path.join(OUT, file(p)), 'utf8');
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');

for (const p of pages) {
  test(`${p.slug}: Kopfdaten, Überschriften, Bilder`, () => {
    const h = html(p);
    assert.match(h, /<html lang="de">/);
    const title = h.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
    assert.ok(title.length > 10 && title.length <= 72, `Titel-Länge ${title.length}: ${title}`);
    const desc = h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    assert.ok(desc.length >= 70 && desc.length <= 170, `Beschreibung-Länge ${desc.length}`);
    assert.match(h, new RegExp(`<link rel="canonical" href="${site.url.replace(/\./g, '\\.')}`));
    assert.match(h, /property="og:image" content="https:\/\//);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, 'genau eine h1');
    // keine übersprungenen Überschriftenebenen
    let last = 0;
    for (const m of h.matchAll(/<h([1-6])[\s>]/g)) { const n = Number(m[1]); assert.ok(n <= last + 1, `Sprung h${last} -> h${n}`); last = n; }
    for (const m of h.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\balt="/, `Bild ohne alt: ${m[0]}`);
    const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'doppelte IDs');
    if (!site.live || p.noindex) assert.match(h, /name="robots" content="noindex/);
  });

  test(`${p.slug}: nur Sie-Form, keine Fremdhosts, keine Inline-Styles`, () => {
    const h = html(p);
    const t = text(h);
    assert.ok(!/\b(Du|Dein|Deine|Deinen|Deinem|Deiner|Dich)\b/.test(t), 'Du-Form gefunden');
    for (const m of h.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/g)) {
      const u = m[1];
      assert.ok(u.startsWith(site.url) || u.startsWith('https://www.ldi.nrw.de'), `Fremdhost: ${u}`);
    }
    assert.ok(!/\sstyle="/.test(h), 'Inline-Style (CSP)');
    assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(h), 'Google Fonts');
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
  });
}

test('Sitemap enthält alle indexierbaren Seiten, aber nicht die 404', () => {
  const xml = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
  for (const p of pages.filter((x) => !x.noindex)) assert.ok(xml.includes(`<loc>${site.url}${p.path}</loc>`), p.path);
  assert.ok(!xml.includes('/404'));
});

test('robots.txt sperrt vor dem Livegang, danach nur /api/', () => {
  const r = fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8');
  if (site.live) { assert.match(r, /Disallow: \/api\//); assert.match(r, /Sitemap:/); } else assert.match(r, /Disallow: \/\n/);
});

test('Startseite und Lokalseite tragen LocalBusiness-Daten mit Oelde', () => {
  for (const slug of ['index', 'webdesign-ki-beratung-oelde']) {
    const h = html(pages.find((p) => p.slug === slug));
    assert.match(h, /"@type":"ProfessionalService"/);
    assert.match(h, /"addressLocality":"Oelde"/);
    assert.ok(!/Nattkamp/.test(h.match(/application\/ld\+json[\s\S]*?<\/script>/)?.[0] ?? ''), 'Straße gehört nicht ins Schema');
  }
});

test('CSS und Skripte laden nichts von Fremdhosts', () => {
  const css = fs.readFileSync(path.join(OUT, 'assets/css/site.css'), 'utf8');
  assert.ok(!/url\(\s*['"]?https?:/.test(css) && !/@import/.test(css));
  for (const f of fs.readdirSync(path.join(OUT, 'assets/js'))) {
    const js = fs.readFileSync(path.join(OUT, 'assets/js', f), 'utf8');
    assert.ok(!/https?:\/\//.test(js), `${f}: Fremdhost`);
  }
});
