// Screenshots per Playwright (Chromium ist vorinstalliert).
// Aufruf: node tools/shoot.mjs <ausgabeordner> <seite> [<seite> ...]   z. B. design/hero-a.html
// Startet einen kleinen statischen Server im Projektordner. Breiten: 1440 (Desktop), 390 (Handy).
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [outDir, ...pages] = process.argv.slice(2);
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const [name, w, h, scale] of [['desktop', 1440, 900, 1], ['mobil', 390, 844, 2]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  for (const pg of pages) {
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${port}/${pg}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3400);
    const base = path.basename(pg).replace(/\.html$/, '');
    await page.screenshot({ path: path.join(outDir, `${base}-${name}.png`), fullPage: false });
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
console.log('fertig:', outDir);
