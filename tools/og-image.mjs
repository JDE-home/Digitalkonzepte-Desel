// Erzeugt die Vorschaubilder für Link-Vorschauen (1200x630) mit Playwright nach assets/img/.
// Aufruf: node tools/og-image.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = process.cwd();
const A = (p) => pathToFileURL(path.join(root, 'assets', p)).href;
const variants = [
  { file: 'og-image.png', h: 'Ihre Website und Ihre KI. <em>Aus einer Hand.</em>', sub: 'Websites im Monatsabo und KI-Beratung für kleine Unternehmen.' },
  { file: 'og-oelde.png', h: 'Webdesign und KI-Beratung in <em>Oelde.</em>', sub: 'Persönlich, pragmatisch, mit festen Preisen. Für den Kreis Warendorf und online.' },
];
const page = (v) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;font-weight:600;src:url(${A('fonts/fraunces-latin-600.woff2')}) format('woff2')}
@font-face{font-family:Inter;font-weight:400;src:url(${A('fonts/inter-latin-400.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#F2F0EB;font-family:Inter,sans-serif;color:#1E3D34;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background:linear-gradient(rgba(30,61,52,.07) 1px,transparent 1px) 0 0/64px 64px,linear-gradient(90deg,rgba(30,61,52,.07) 1px,transparent 1px) 0 0/64px 64px;-webkit-mask-image:radial-gradient(70% 90% at 80% 40%,#000,transparent 80%)}
.logo{position:absolute;left:72px;top:60px;height:64px}
h1{position:absolute;left:72px;top:190px;width:640px;font:600 76px/1.08 Fraunces,serif;letter-spacing:-1.5px}
h1 em{font-style:normal;color:#8A5C38}
p{position:absolute;left:72px;bottom:64px;width:620px;font-size:28px;line-height:1.4;color:#4A6458}
.tiles{position:absolute;right:72px;top:96px;width:400px;height:430px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tiles i{display:block}.a{background:#8AA399}.b{background:#B5835A;border-top-right-radius:100%}.c{background:#1E3D34}.d{background:#D3DCD5;border-bottom-right-radius:100%}
</style><div class="grid"></div><img class="logo" src="${A('img/logo.png')}" alt=""><h1>${v.h}</h1><p>${v.sub}</p><div class="tiles"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i></div>`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const v of variants) {
  const tmp = path.join(os.tmpdir(), `og-${v.file}.html`);
  fs.writeFileSync(tmp, page(v));
  const pg = await ctx.newPage();
  await pg.goto(pathToFileURL(tmp).href); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200);
  await pg.screenshot({ path: path.join(root, 'assets/img', v.file) });
  await pg.close(); fs.rmSync(tmp);
  console.log('erzeugt', v.file);
}
await browser.close();
