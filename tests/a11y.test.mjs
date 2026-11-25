// Automatische Barrierefreiheits-Prüfung (axe-core) je Seite, hell und dunkel, Desktop und Handy. Der Build läuft vorab über "npm test" (pretest)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve } from './helpers/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axePath = require.resolve('axe-core');
const pages = JSON.parse(fs.readFileSync('src/pages.json', 'utf8'));
const { port, close } = await serve(path.resolve('public'));
const browser = await chromium.launch();

for (const p of pages) {
  for (const [theme, vp] of [['light', { width: 1280, height: 900 }], ['dark', { width: 1280, height: 900 }], ['light', { width: 390, height: 844 }]]) {
    test(`${p.slug} (${theme}, ${vp.width}px): keine axe-Verstöße`, async () => {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce', bypassCSP: true });
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${port}${p.path}`, { waitUntil: 'networkidle' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(150);
      await page.addScriptTag({ path: axePath });
      const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      await ctx.close();
      const msg = res.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`).join('\n');
      assert.equal(res.violations.length, 0, '\n' + msg);
    });
  }
}
test.after(async () => { await browser.close(); close(); });
