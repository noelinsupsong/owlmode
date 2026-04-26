/**
 * Captures a thumbnail for every enabled game.
 *
 * Usage:
 *   1. In one terminal:  npm run dev      (default http://localhost:3000)
 *   2. In another:       node scripts/capture-thumbnails.mjs
 *
 * Saves PNGs to public/thumbnails/<slug>.png
 *
 * Requires:  npm install -D puppeteer
 */

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'thumbnails');
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const LOCALE = process.env.LOCALE ?? 'en';

// Read enabled slugs from lib/games.ts (simple grep)
async function readEnabledSlugs() {
  const src = await fs.readFile(path.join(ROOT, 'lib', 'games.ts'), 'utf-8');
  const re = /\{\s*slug:\s*'([^']+)'[^}]*enabled:\s*true/g;
  const slugs = [];
  let m;
  while ((m = re.exec(src))) slugs.push(m[1]);
  return slugs;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const slugs = await readEnabledSlugs();
  console.log(`Capturing ${slugs.length} games at ${BASE}/${LOCALE}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();

  for (const slug of slugs) {
    const url = `${BASE}/${LOCALE}/games/${slug}`;
    process.stdout.write(`  ${slug.padEnd(20)} `);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      // Wait for game stage to render
      await page
        .waitForSelector('.game-stage canvas, .game-stage .grid, .game-stage', {
          timeout: 8000,
        })
        .catch(() => {});
      // Try clicking a "Start" button if present so games like Snake show their initial board
      await page
        .evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const start = btns.find(
            (b) =>
              b.textContent?.trim() === 'Start' ||
              b.textContent?.trim() === '시작'
          );
          if (start) start.click();
        })
        .catch(() => {});
      // Small wait for first paint after start
      await new Promise((r) => setTimeout(r, 300));

      const stage = await page.$('.game-stage');
      if (!stage) {
        console.log('SKIP (no .game-stage)');
        continue;
      }
      const file = path.join(OUT_DIR, `${slug}.png`);
      await stage.screenshot({ path: file, omitBackground: false });
      console.log('OK');
    } catch (err) {
      console.log(`FAIL · ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nSaved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
