#!/usr/bin/env node
/**
 * ============================================================================
 *  generate-project.mjs — interactive project scaffold
 * ============================================================================
 *
 *  Adds a new project entry to src/config/projects.ts and creates a starter
 *  index page in every locale listed in site.config.ts.
 *
 *  Run:  npm run gen:project
 *
 *  Zero dependencies — uses Node's built-in `readline` module.
 * ==========================================================================*/

import readline from 'node:readline';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(__dirname, '..'));

function readTsFile(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function parseLocales() {
  const src = readTsFile('site.config.ts');
  const m = src.match(/export\s+const\s+LOCALES\s*=\s*\[([^\]]*)\]/);
  if (!m) throw new Error('Could not find LOCALES in site.config.ts');
  return m[1]
    .split(',')
    .map((s) => s.replace(/[^a-z-]/gi, '').trim())
    .filter(Boolean);
}

const LOCALES = parseLocales();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, { default: dft = '', validate } = {}) {
  return new Promise((resolve) => {
    const suffix = dft ? ` [${dft}]` : '';
    rl.question(`${question}${suffix}: `, (raw) => {
      const answer = (raw || dft).trim();
      if (validate) {
        const err = validate(answer);
        if (err) {
          process.stderr.write(`  ⚠ ${err}\n`);
          return resolve(ask(question, { default: dft, validate }));
        }
      }
      resolve(answer);
    });
  });
}

function askSelect(question, options, { default: dft } = {}) {
  const list = options.map((o, i) => `  ${i + 1}. ${o}`).join('\n');
  return new Promise((resolve) => {
    const suffix = dft ? ` [${dft}]` : '';
    rl.question(`${question}\n${list}\nChoice${suffix}: `, (raw) => {
      const idx = parseInt((raw || dft).trim(), 10) - 1;
      if (idx >= 0 && idx < options.length) return resolve(options[idx]);
      process.stderr.write('  ⚠ Invalid choice\n');
      resolve(askSelect(question, options, { default: dft }));
    });
  });
}

function titleCase(s) {
  return s
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const ACCENTS = ['violet', 'cyan', 'fuchsia', 'emerald', 'orange', 'rose'];
const ICONS = ['server', 'monitor', 'smartphone', 'credit-card', 'terminal', 'palette', 'book', 'package'];
const STATUSES = ['stable', 'beta', 'draft', 'deprecated'];

async function main() {
  process.stdout.write('\n  Project generator\n  =================\n\n');

  const id = await ask('Project ID (kebab-case)', {
    default: 'my-project',
    validate: (v) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ? null : 'Use lowercase kebab-case, e.g. "my-project"',
  });

  const projectsSrc = readTsFile('src/config/projects.ts');
  if (projectsSrc.includes(`id: '${id}'`) || projectsSrc.includes(`id: "${id}"`)) {
    rl.close();
    process.stderr.write(`\n  ✗ Project "${id}" already exists in src/config/projects.ts.\n\n`);
    process.exit(1);
  }

  const nameEn = await ask('Display name (EN)', { default: titleCase(id) });
  const nameId = await ask('Display name (ID)', { default: nameEn });

  const descEn = await ask('Short description (EN)', {
    default: `Documentation for ${nameEn}.`,
  });
  const descId = await ask('Short description (ID)', {
    default: `Dokumentasi untuk ${nameId}.`,
  });

  const version = await ask('Version label (or leave empty)', { default: 'v0.1.0' });
  const status = await askSelect('Status', STATUSES, { default: '2' });
  const icon = await askSelect('Icon', ICONS, { default: '1' });
  const accent = await askSelect('Accent colour', ACCENTS, { default: '1' });
  const group = await ask('Group (optional, e.g. "docs", "reference")', { default: 'docs' });

  const apiBaseUrl = await ask('API base URL (optional, for ApiEndpoint)', { default: '' });

  const slug = await ask('Index page slug', {
    default: 'index',
    validate: (v) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ? null : 'Use lowercase kebab-case',
  });

  const indexTitleEn = await ask('Index page title (EN)', { default: 'Overview' });
  const indexTitleId = await ask('Index page title (ID)', { default: 'Ringkasan' });

  /* ----------------------------------------------------------------------- *
   *  1. Insert project entry into projects.ts
   * ----------------------------------------------------------------------- */

  const entry = [
    '  {',
    `    id: '${id}',`,
    '    name: {',
    `      en: '${nameEn}',`,
    `      id: '${nameId}',`,
    '    },',
    '    description: {',
    `      en: '${descEn}',`,
    `      id: '${descId}',`,
    '    },',
    `    version: '${version || 'v0.1.0'}',`,
    `    status: '${status}',`,
    `    icon: '${icon}',`,
    `    accent: '${accent}',`,
    group ? `    group: '${group}',\n` : '',
    apiBaseUrl ? `    apiBaseUrl: '${apiBaseUrl}',\n` : '',
    '  },',
  ]
    .filter(Boolean)
    .join('\n');

  const projectsPath = join(ROOT, 'src', 'config', 'projects.ts');
  const projectsContent = readFileSync(projectsPath, 'utf8');

  const insertAnchor = 'export const projects: ProjectConfig[] = [';
  const insertIndex = projectsContent.indexOf(insertAnchor);
  if (insertIndex === -1) {
    rl.close();
    throw new Error('Could not find projects array in src/config/projects.ts');
  }

  const insertPosition = insertIndex + insertAnchor.length;
  const updated = projectsContent.slice(0, insertPosition) + '\n' + entry + projectsContent.slice(insertPosition);

  writeFileSync(projectsPath, updated, 'utf8');

  /* ----------------------------------------------------------------------- *
   *  2. Create index page in every locale
   * ----------------------------------------------------------------------- */

  const baseDir = join(ROOT, 'src', 'content', 'docs');
  const created = [];

  for (const locale of LOCALES) {
    const dir = join(baseDir, locale, id);
    const filePath = join(dir, `${slug}.mdx`);

    if (existsSync(filePath)) {
      process.stderr.write(`  ⚠ ${locale}: ${filePath} already exists, skipped\n`);
      continue;
    }

    const en = locale === 'en';
    const title = en ? indexTitleEn : indexTitleId;
    const description = en ? descEn : descId;
    const body = en
      ? [
          `Welcome to the ${nameEn} documentation.`,
          '',
          '## Overview',
          '',
          `Describe what ${nameEn} is and what readers will find here.`,
          '',
          '## Getting started',
          '',
          '```bash',
          '# example command',
          '```',
          '',
          '<Callout type="tip">',
          '  Replace this placeholder content with real documentation.',
          '</Callout>',
        ]
      : [
          `Selamat datang di dokumentasi ${nameId}.`,
          '',
          '## Ringkasan',
          '',
          `Jelaskan apa itu ${nameId} dan apa yang akan pembaca temukan di sini.`,
          '',
          '## Memulai',
          '',
          '```bash',
          '# contoh perintah',
          '```',
          '',
          '<Callout type="tip">',
          '  Ganti konten placeholder ini dengan dokumentasi asli.',
          '</Callout>',
        ];

    const content = [
      '---',
      `title: ${title}`,
      `description: ${description}`,
      `category: ${en ? 'Overview' : 'Ringkasan'}`,
      'order: 1',
      `keywords: [${id}, ${en ? 'overview' : 'ringkasan'}]`,
      '---',
      '',
      body.join('\n'),
      '',
    ].join('\n');

    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, 'utf8');
    created.push(`${locale}: ${filePath}`);
  }

  rl.close();

  process.stdout.write('\n  Result\n  ------\n');
  process.stdout.write(`  ✓ Updated: src/config/projects.ts (added "${id}")\n`);
  if (created.length) {
    process.stdout.write('  Created:\n');
    for (const c of created) process.stdout.write(`    ✓ ${c}\n`);
  }
  process.stdout.write(
    `\n  Next: \`npm run dev\` then visit the new project. Edit content as needed.\n` +
      `  To add more pages: \`npm run gen\`\n\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
