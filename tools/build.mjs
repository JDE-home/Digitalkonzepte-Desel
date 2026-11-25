// Baut die Website nach public/. Keine Abhängigkeiten, nur Node.
//   src/*.html            Seiteninhalt (nur der <main>-Inhalt)
//   src/partials/*.html   layout, header, footer und Bausteine ({{include:name}})
//   src/pages.json        Titel, Beschreibung, Pfad, Navigation je Seite
//   src/site.json         Domain, Name, "live" (false = noindex + robots Disallow)
// Erzeugt zusätzlich sitemap.xml und robots.txt und prüft interne Links sowie Platzhalter.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const site = JSON.parse(read('src/site.json'));
const pages = JSON.parse(read('src/pages.json'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- Assets ----------
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
const cssParts = ['fonts', 'tokens', 'base', 'components'];
const css = cssParts.map((n) => read(`assets/css/${n}.css`)).join('\n');
fs.rmSync(path.join(OUT, 'assets/css'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets/css/site.css'), css);
const cssVer = crypto.createHash('sha1').update(css).digest('hex').slice(0, 8);
const jsVer = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, 'assets/js', f))).digest('hex').slice(0, 8);

// ---------- Strukturierte Daten ----------
const url = (p) => site.url.replace(/\/$/, '') + p;
const business = {
  '@type': 'ProfessionalService',
  '@id': url('/#business'),
  name: site.name,
  url: url('/'),
  logo: url('/assets/img/logo.png'),
  image: url('/assets/img/og-image.png'),
  description: 'Websites im Monatsabo und KI-Beratung für kleine Unternehmen, persönlich und pragmatisch.',
  areaServed: [
    { '@type': 'City', name: 'Oelde' },
    { '@type': 'AdministrativeArea', name: 'Kreis Warendorf' },
    { '@type': 'Country', name: 'Deutschland' },
  ],
  // Bewusst nur Ort und PLZ, keine Straße (Wohnadresse). Telefon und E-Mail ergänzen, sobald feststehend: [TODO]
  address: { '@type': 'PostalAddress', postalCode: '59302', addressLocality: 'Oelde', addressRegion: 'Nordrhein-Westfalen', addressCountry: 'DE' },
  founder: { '@type': 'Person', name: 'Jannik Desel' },
  makesOffer: ['Website-Erstellung, Hosting und Pflege', 'KI-Beratung für kleine Unternehmen', 'KI-Funktionen für Websites'].map((n) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })),
};
function schemaFor(page) {
  const graph = [];
  if (page.slug === 'index') {
    graph.push({ '@type': 'WebSite', '@id': url('/#website'), url: url('/'), name: site.name, inLanguage: 'de-DE', publisher: { '@id': url('/#business') } }, business);
  } else if (page.slug === 'webdesign-ki-beratung-oelde') {
    graph.push(business);
  }
  if (page.slug !== 'index' && !page.noindex) {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: url('/') },
      { '@type': 'ListItem', position: 2, name: page.crumb || page.title, item: url(page.path) },
    ] });
  }
  return graph.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>` : '';
}

// ---------- Bausteine ----------
const include = (html, depth = 0) =>
  html.replace(/\{\{include:([\w-]+)\}\}/g, (_, n) => (depth > 3 ? '' : include(read(`src/partials/${n}.html`), depth + 1)));

const navItems = pages.filter((p) => p.nav);
const navHtml = (current) =>
  navItems.map((p) => `<a href="${p.path}"${p.slug === current ? ' aria-current="page"' : ''}>${esc(p.nav)}</a>`).join('');

function headFor(page) {
  const title = page.slug === 'index' ? page.title : `${page.title} | ${site.name}`;
  const canonical = url(page.path);
  const og = url('/assets/img/' + (page.og || 'og-image.png'));
  const robots = !site.live || page.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : '';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
${robots}<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#1E3D34">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="icon" type="image/png" sizes="96x96" href="/assets/img/favicon-96.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name)}: Websites und KI für kleine Unternehmen">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${og}">
<link rel="preload" href="/assets/fonts/inter-latin-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/fraunces-latin-600.woff2" as="font" type="font/woff2" crossorigin>
<script src="/assets/js/theme-init.js"></script>
<link rel="stylesheet" href="/assets/css/site.css?v=${cssVer}">
${schemaFor(page)}`;
}

// ---------- Seiten ----------
const layout = include(read('src/partials/layout.html'));
const lastmod = (file) => {
  try { return execSync(`git log -1 --format=%cs -- "src/${file}"`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null; } catch { return null; }
};
const today = new Date().toISOString().slice(0, 10);
const built = [];
for (const page of pages) {
  const main = include(read(`src/${page.file}`));
  const scripts = ['site.js', ...(page.scripts || [])].map((f) => `<script src="/assets/js/${f}?v=${jsVer(f)}" defer></script>`).join('\n');
  const html = layout
    .replace('{{head}}', () => headFor(page))
    .replace('{{header}}', () => include(read('src/partials/header.html')).replace('{{nav}}', navHtml(page.slug)))
    .replace('{{main}}', () => main)
    .replace('{{footer}}', () => include(read('src/partials/footer.html')).replace('{{year}}', new Date().getFullYear()).replace('{{nav}}', navHtml(page.slug)))
    .replace('{{scripts}}', () => scripts)
    .replace('{{bodyclass}}', page.bodyClass || '');
  const out = page.slug === 'index' ? 'index.html' : page.slug === '404' ? '404.html' : `${page.slug}.html`;
  fs.writeFileSync(path.join(OUT, out), html);
  built.push({ page, out, html, mod: lastmod(page.file) || today });
}

// ---------- Prüfungen ----------
const errors = [];
const known = new Set(pages.map((p) => p.path));
for (const { page, html, out } of built) {
  if (/\{\{[^}]*\}\}/.test(html)) errors.push(`${out}: nicht ersetzter Platzhalter ${html.match(/\{\{[^}]*\}\}/)[0]}`);
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const p = m[1];
    if (p.startsWith('//')) continue;
    if (known.has(p) || fs.existsSync(path.join(OUT, p)) || fs.existsSync(path.join(OUT, p + '.html'))) continue;
    errors.push(`${out}: interner Link ohne Ziel: ${p}`);
  }
}
if (errors.length) { console.error('Build-Fehler:\n- ' + errors.join('\n- ')); process.exit(1); }

// ---------- Sitemap und robots.txt ----------
const entries = built.filter(({ page }) => !page.noindex)
  .map(({ page, mod }) => `  <url><loc>${url(page.path)}</loc><lastmod>${mod}</lastmod></url>`).join('\n');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), site.live
  ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${url('/sitemap.xml')}\n`
  : `# Vor dem Livegang gesperrt (src/site.json: "live": true setzen und X-Robots-Tag in vercel.json entfernen).\nUser-agent: *\nDisallow: /\n`);
console.log(`gebaut: ${built.length} Seiten, CSS ${(css.length / 1024).toFixed(1)} KB, live=${site.live}`);
