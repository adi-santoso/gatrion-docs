#!/usr/bin/env node
/**
 * ============================================================================
 *  check-locale-parity.mjs — locale parity verifier
 * ============================================================================
 *
 *  Fails the build when a page exists in some locales but not others. Every
 *  page slug under `src/content/docs/<locale>/<project>/` must be present in
 *  every locale listed in `LOCALES` in `site.config.ts`.
 *
 *  Exit codes:
 *    0  parity holds (or the project has a single locale)
 *    1  parity is broken — missing files are listed on stderr
 *
 *  Run:  npm run check:parity
 * ========================================================================== */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(__dirname, '..'));
const DOCS_ROOT = join(ROOT, 'src', 'content', 'docs');

function parseLocales() {
  const src = readFileSync(join(ROOT, 'site.config.ts'), 'utf8');
  const m = src.match(/export\s+const\s+LOCALES\s*=\s*\[([^\]]*)\]/);
  if (!m) throw new Error('Could not find LOCALES in site.config.ts');
  return m[1]
    .split(',')
    .map((s) => s.replace(/[^a-z-]/gi, '').trim())
    .filter(Boolean);
}

const LOCALES = parseLocales();

if (LOCALES.length < 2) {
  process.exit(0);
}

/**
 * Returns the set of page slugs (project + '/' + slug, no extension) that
 * exist under `DOCS_ROOT/<locale>/`.
 *
 * `\_`-prefixed files are skipped, matching the glob loader's pattern in
 * `src/content.config.ts` which excludes underscore-prefixed entries.
 */
function slugsFor(locale) {
  const root = join(DOCS_ROOT, locale);
  if (!existsSync(root)) return new Set();

  const out = new Set();
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        const slug = entry.name.replace(/\.(md|mdx)$/, '');
        out.add(prefix ? `${prefix}/${slug}` : slug);
      }
    }
  };
  walk(root);
  return out;
}

const byLocale = Object.fromEntries(LOCALES.map((l) => [l, slugsFor(l)]));
const allSlugs = new Set(LOCALES.flatMap((l) => [...byLocale[l]]));

const missing = [];
for (const slug of [...allSlugs].sort()) {
  for (const locale of LOCALES) {
    if (!byLocale[locale].has(slug)) {
      missing.push({ slug, locale });
    }
  }
}

if (missing.length === 0) {
  console.log(`[parity] OK — ${allSlugs.size} slug(s) present in all ${LOCALES.length} locale(s).`);
  process.exit(0);
}

console.error(`[parity] ${missing.length} missing translation(s):\n`);
for (const { slug, locale } of missing) {
  console.error(`  ${slug}  →  missing in ${locale}/`);
}
console.error(`\nLocale parity is required. Add the missing file(s) under src/content/docs/.`);
process.exit(1);
