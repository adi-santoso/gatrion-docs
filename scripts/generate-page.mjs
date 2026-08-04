#!/usr/bin/env node
/**
 * ============================================================================
 *  generate-page.mjs — interactive documentation page generator
 * ============================================================================
 *
 *  Creates a new MDX page in every locale listed in site.config.ts, using a
 *  boilerplate template matched to the chosen page type. Reads project IDs
 *  from src/config/projects.ts and locales from site.config.ts so it never
 *  goes out of sync.
 *
 *  Run:  npm run gen
 *
 *  Zero dependencies — uses Node's built-in `readline` module.
 * ========================================================================== */

import readline from 'node:readline';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(__dirname, '..'));

/* ---------------------------------------------------------------------------
 *  Load source-of-truth config values.
 *  We require() the .ts files indirectly by reading + evaluating, but since
 *  Node can't import .ts directly without a loader, we extract the values
 *  with a tiny regex parser. This is deliberately fragile-by-design: if the
 *  config shape changes, this script should be updated, not silently work.
 * ------------------------------------------------------------------------- */

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

function parseProjects() {
  const src = readTsFile('src/config/projects.ts');
  const ids = [];
  const re = /\bid:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) ids.push(m[1]);
  // Project IDs are lowercase kebab-case; filter out locale display names
  // (the `id` locale key inside `name`/`description` objects has spaces/capitals)
  return [...new Set(ids)].filter((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id));
}

const LOCALES = parseLocales();
const PROJECT_IDS = parseProjects();

if (LOCALES.length === 0) throw new Error('No locales found.');
if (PROJECT_IDS.length === 0) throw new Error('No project IDs found.');

/* ---------------------------------------------------------------------------
 *  Interactive prompt helper.
 * ------------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------------
 *  Page type templates.
 *
 *  Each template is a function(locale, ctx) -> { filename, frontmatter, body }.
 *  ctx contains: title, description, slug, order, project, apiBaseUrl.
 * ------------------------------------------------------------------------- */

const EYEBROW_BY_TYPE = {
  'api-endpoint': 'REST API',
};

const TEMPLATES = {
  /* ------------------------------------------------------------------ GUIDE */
  guide: (locale, ctx) => {
    const en = locale === 'en';
    const fm = {
      title: ctx.title,
      description:
        ctx.description ||
        (en
          ? `A guide covering ${ctx.title.toLowerCase()}.`
          : `Panduan tentang ${ctx.title.toLowerCase()}.`),
      category: en ? 'Guides' : 'Panduan',
      order: ctx.order,
      keywords: ctx.keywords.length ? ctx.keywords : [ctx.slug],
    };
    const body = [
      en
        ? `Briefly describe what this guide covers and who it is for.`
        : `Jelaskan singkat cakupan panduan ini dan untuk siapa.`,
      '',
      '## ' + (en ? 'Prerequisites' : 'Prasyarat'),
      '',
      en ? 'Before you begin, make sure you have:' : 'Sebelum mulai, pastikan Anda memiliki:',
      '',
      '- ' + (en ? 'Item one' : 'Item satu'),
      '- ' + (en ? 'Item two' : 'Item dua'),
      '',
      '## ' + (en ? 'Steps' : 'Langkah'),
      '',
      '<Steps>',
      '  <Step title="' + (en ? 'First step' : 'Langkah pertama') + '">',
      '    ' + (en ? 'Description of what to do.' : 'Deskripsi langkah.'),
      '',
      '    ```bash',
      '    ' + (en ? '# command here' : '# perintah di sini'),
      '    ```',
      '  </Step>',
      '  <Step title="' + (en ? 'Second step' : 'Langkah kedua') + '">',
      '    ' + (en ? 'Description of what to do.' : 'Deskripsi langkah.'),
      '  </Step>',
      '</Steps>',
      '',
      '## ' + (en ? 'Next steps' : 'Langkah selanjutnya'),
      '',
      en
        ? 'Link to related pages or suggest the next thing to try.'
        : 'Tautkan ke halaman terkait atau sarankan langkah berikutnya.',
    ];
    return { frontmatter: fm, body: body.join('\n') };
  },

  /* --------------------------------------------------------- API ENDPOINT */
  'api-endpoint': (locale, ctx) => {
    const en = locale === 'en';
    const fm = {
      title: ctx.title,
      sidebarLabel: ctx.title,
      description:
        ctx.description ||
        (en
          ? `Endpoint reference for ${ctx.title}.`
          : `Referensi endpoint untuk ${ctx.title}.`),
      category: en ? 'API Reference' : 'Referensi API',
      eyebrow: EYEBROW_BY_TYPE['api-endpoint'],
      order: ctx.order,
      keywords: ctx.keywords.length ? ctx.keywords : [ctx.slug, 'api', 'endpoint'],
    };
    const apiBase = ctx.apiBaseUrl ? `\n  apiBase="${ctx.apiBaseUrl}"` : '';
    const body = [
      en
        ? `The ${ctx.title} resource represents ${ctx.title.toLowerCase()} in the API.`
        : `Resource ${ctx.title} merepresentasikan ${ctx.title.toLowerCase()} dalam API.`,
      '',
      '## ' + (en ? 'List ' : 'Daftar ') + ctx.title.toLowerCase(),
      '',
      '<ApiEndpoint',
      '  method="GET"',
      `  url="/v1/${ctx.slug}"` +
        apiBase,
      ctx.apiBaseUrl
        ? '  headers={{ Authorization: "Bearer $API_TOKEN" }}'
        : '  headers={{ Authorization: "Bearer $API_TOKEN" }}',
      '/>',
      '',
      '### ' + (en ? 'Query parameters' : 'Query parameter'),
      '',
      '| ' +
        (en ? 'Name | Type | Required | Description' : 'Nama | Tipe | Wajib | Deskripsi') +
        ' |',
      '| --- | --- | --- | --- |',
      '| `limit` | integer | No | ' +
        (en ? 'Results per page, from `1` to `100`' : 'Jumlah hasil, dari `1` sampai `100`') +
        ' |',
      '| `cursor` | string | No | ' +
        (en ? 'Cursor from previous response' : 'Cursor dari response sebelumnya') +
        ' |',
      '',
      '### Response',
      '',
      '```json',
      '{',
      '  "data": [',
      '    {',
      '      "id": "example_id",',
      `      "name": "${ctx.title} example"`,
      '    }',
      '  ],',
      '  "next_cursor": null',
      '}',
      '```',
      '',
      '## ' + (en ? 'Create' : 'Buat') + ' ' + ctx.title.toLowerCase(),
      '',
      '<ApiEndpoint',
      '  method="POST"',
      `  url="/v1/${ctx.slug}"` +
        apiBase,
      '  headers={{ Authorization: "Bearer $API_TOKEN", "Content-Type": "application/json" }}',
      `  body={{ name: "${ctx.title} example" }}`,
      '/>',
      '',
      '### ' + (en ? 'Request body' : 'Request body'),
      '',
      '| ' +
        (en ? 'Name | Type | Required | Description' : 'Nama | Tipe | Wajib | Deskripsi') +
        ' |',
      '| --- | --- | --- | --- |',
      '| `name` | string | Yes | ' +
        (en ? `Name of the ${ctx.title.toLowerCase()}` : `Nama ${ctx.title.toLowerCase()}`) +
        ' |',
      '',
      '<Callout type="warning" title="' + (en ? 'Idempotency' : 'Idempotensi') + '">',
      '  ' +
        (en
          ? 'Send an `Idempotency-Key` header when retrying a create request.'
          : 'Kirim header `Idempotency-Key` saat mengulang create request.') +
        '\n',
      '</Callout>',
      '',
      '## Errors',
      '',
      '| ' + (en ? 'Status | Code | Meaning' : 'Status | Kode | Arti') + ' |',
      '| --- | --- | --- |',
      '| `400` | `invalid_request` | ' +
        (en ? 'The request body is malformed' : 'Request body tidak valid') +
        ' |',
      '| `401` | `unauthorized` | ' +
        (en ? 'Bearer token missing or invalid' : 'Bearer token tidak ada atau invalid') +
        ' |',
      '| `429` | `rate_limited` | ' +
        (en ? 'Retry after `Retry-After`' : 'Ulangi setelah `Retry-After`') +
        ' |',
    ];
    return { frontmatter: fm, body: body.join('\n') };
  },

  /* -------------------------------------------------------------- TUTORIAL */
  tutorial: (locale, ctx) => {
    const en = locale === 'en';
    const fm = {
      title: ctx.title,
      description:
        ctx.description ||
        (en
          ? `A step-by-step tutorial for ${ctx.title.toLowerCase()}.`
          : `Tutorial langkah demi langkah untuk ${ctx.title.toLowerCase()}.`),
      category: en ? 'Tutorials' : 'Tutorial',
      order: ctx.order,
      keywords: ctx.keywords.length ? ctx.keywords : [ctx.slug, 'tutorial'],
    };
    const body = [
      en
        ? `In this tutorial you will build ${ctx.title.toLowerCase()} from scratch. By the end you will have a working example you can extend.`
        : `Dalam tutorial ini Anda akan membuat ${ctx.title.toLowerCase()} dari nol. Di akhir, Anda punya contoh yang bisa dikembangkan.`,
      '',
      '## ' + (en ? "What you'll build" : 'Apa yang akan dibangun'),
      '',
      en
        ? 'Describe the end result. A screenshot or diagram helps.'
        : 'Jelaskan hasil akhir. Screenshot atau diagram membantu.',
      '',
      '## ' + (en ? 'Prerequisites' : 'Prasyarat'),
      '',
      '<CardGrid cols={2}>',
      '  <Card title="' +
        (en ? 'Node.js 22+' : 'Node.js 22+') +
        '" icon="terminal">' +
        (en ? 'JavaScript runtime.' : 'Runtime JavaScript.') +
        '</Card>',
      '  <Card title="' +
        (en ? 'Basic knowledge' : 'Pengetahuan dasar') +
        '">' +
        (en ? 'Familiarity with the topic.' : 'Paham dasar topik.') +
        '</Card>',
      '</CardGrid>',
      '',
      '## ' + (en ? 'Steps' : 'Langkah'),
      '',
      '<Steps>',
      '  <Step title="' + (en ? 'Set up the project' : 'Siapkan proyek') + '">',
      '    ' + (en ? 'Initialise a new working directory.' : 'Buat direktori kerja baru.'),
      '',
      '    ```bash',
      '    mkdir my-project && cd my-project',
      '    ```',
      '  </Step>',
      '  <Step title="' + (en ? 'Implement the core' : 'Implementasi inti') + '">',
      '    ' + (en ? 'Add the main logic here.' : 'Tambahkan logika utama di sini.'),
      '',
      '    ```ts',
      '    // implementation',
      '    ```',
      '  </Step>',
      '  <Step title="' + (en ? 'Verify the result' : 'Verifikasi hasil') + '">',
      '    ' +
          (en
            ? 'Run it and check the expected output.'
            : 'Jalankan dan cek output yang diharapkan.') +
          '',
      '  </Step>',
      '</Steps>',
      '',
      '## ' + (en ? 'Next steps' : 'Langkah selanjutnya'),
      '',
      en
        ? 'Now that you have a working example, try extending it with:'
        : 'Sekarang contoh sudah jalan, coba kembangkan dengan:',
      '',
      '- ' + (en ? 'A related feature' : 'Fitur terkait'),
      '- ' + (en ? 'Tests' : 'Pengujian'),
      '',
      '<Callout type="tip" title="' + (en ? 'Source code' : 'Kode sumber') + '">',
      '  ' +
        (en
          ? 'The complete example is available in the repository.'
          : 'Contoh lengkap tersedia di repository.') +
        '\n',
      '</Callout>',
    ];
    return { frontmatter: fm, body: body.join('\n') };
  },

  /* ------------------------------------------------------------ CHANGELOG */
  changelog: (locale, ctx) => {
    const en = locale === 'en';
    const today = new Date().toISOString().slice(0, 10);
    const fm = {
      title: ctx.title,
      description:
        ctx.description ||
        (en ? `Release notes for ${ctx.title}.` : `Catatan rilis untuk ${ctx.title}.`),
      category: en ? 'Release Notes' : 'Catatan Rilis',
      order: ctx.order,
      keywords: ctx.keywords.length ? ctx.keywords : [ctx.slug, 'changelog', 'release'],
    };
    const body = [
      en
        ? `All notable changes to ${ctx.title} are documented here. Versions follow [Semantic Versioning](https://semver.org/).`
        : `Semua perubahan penting ${ctx.title} dicatat di sini. Versi mengikuti [Semantic Versioning](https://semver.org/).`,
      '',
      `## [Unreleased]`,
      '',
      en ? '### Added' : '### Ditambahkan',
      '',
      '- ' + (en ? 'Nothing yet.' : 'Belum ada.'),
      '',
      en ? '### Changed' : '### Diubah',
      '',
      '- ' + (en ? 'Nothing yet.' : 'Belum ada.'),
      '',
      `## [1.0.0] - ${today}`,
      '',
      '<Callout type="note" title="' + (en ? 'Initial release' : 'Rilis awal') + '">',
      '  ' + (en ? 'First public version.' : 'Versi publik pertama.') + '\n',
      '</Callout>',
      '',
      en ? '### Added' : '### Ditambahkan',
      '',
      '- ' + (en ? 'Core feature one' : 'Fitur inti satu'),
      '- ' + (en ? 'Core feature two' : 'Fitur inti dua'),
      '',
      en ? '### Fixed' : '### Diperbaiki',
      '',
      '- ' + (en ? 'Nothing in this release.' : 'Tidak ada di rilis ini.'),
    ];
    return { frontmatter: fm, body: body.join('\n') };
  },

  /* ------------------------------------------------------ TROUBLESHOOTING */
  troubleshooting: (locale, ctx) => {
    const en = locale === 'en';
    const fm = {
      title: ctx.title,
      description:
        ctx.description ||
        (en
          ? `Common issues and fixes for ${ctx.title}.`
          : `Masalah umum dan solusi untuk ${ctx.title}.`),
      category: en ? 'Support' : 'Dukungan',
      order: ctx.order,
      keywords: ctx.keywords.length
        ? ctx.keywords
        : [ctx.slug, 'troubleshooting', 'error', 'fix'],
    };
    const body = [
      en
        ? `This page lists common problems you may encounter with ${ctx.title} and how to resolve them.`
        : `Halaman ini mencantumkan masalah umum pada ${ctx.title} dan cara mengatasinya.`,
      '',
      '## ' + (en ? 'Symptoms and causes' : 'Gejala dan penyebab'),
      '',
      '<Tabs>',
      '  <Tab label="' + (en ? 'Symptom 1' : 'Gejala 1') + '">',
      '    ' +
        (en ? 'Describe what the user observes.' : 'Jelaskan apa yang pengguna lihat.') +
        '\n',
      '    ' + (en ? '**Cause:** underlying reason.' : '**Penyebab:** alasan mendasar.'),
      '',
      '    ' + (en ? '**Fix:**' : '**Solusi:**'),
      '',
      '    ```bash',
      '    ' + (en ? '# command to fix' : '# perintah perbaikan'),
      '    ```',
      '  </Tab>',
      '  <Tab label="' + (en ? 'Symptom 2' : 'Gejala 2') + '">',
      '    ' +
        (en ? 'Describe what the user observes.' : 'Jelaskan apa yang pengguna lihat.') +
        '\n',
      '    ' + (en ? '**Cause:** underlying reason.' : '**Penyebab:** alasan mendasar.'),
      '',
      '    ' + (en ? '**Fix:**' : '**Solusi:**'),
      '',
      '    ```bash',
      '    ' + (en ? '# command to fix' : '# perintah perbaikan'),
      '    ```',
      '  </Tab>',
      '</Tabs>',
      '',
      '## ' + (en ? 'Common error codes' : 'Kode error umum'),
      '',
      '| ' + (en ? 'Code | Meaning | Fix' : 'Kode | Arti | Solusi') + ' |',
      '| --- | --- | --- |',
      '| `ERR_NOT_FOUND` | ' +
        (en ? 'Resource does not exist' : 'Resource tidak ditemukan') +
        ' | ' +
        (en ? 'Check the ID and try again' : 'Periksa ID dan coba lagi') +
        ' |',
      '| `ERR_TIMEOUT` | ' +
        (en ? 'Request took too long' : 'Request terlalu lama') +
        ' | ' +
        (en ? 'Retry or increase the timeout' : 'Ulangi atau tambah timeout') +
        ' |',
      '',
      '<Callout type="warning" title="' + (en ? 'Still stuck?' : 'Masih bingung?') + '">',
      '  ' +
        (en
          ? 'If none of the fixes above work, open an issue.'
          : 'Jika solusi di atas tidak berhasil, buka issue.') +
        '\n',
      '</Callout>',
    ];
    return { frontmatter: fm, body: body.join('\n') };
  },
};

/* ---------------------------------------------------------------------------
 *  Frontmatter serializer — keys go in a stable, human-friendly order.
 * ------------------------------------------------------------------------- */

const FM_KEY_ORDER = [
  'title',
  'sidebarLabel',
  'description',
  'category',
  'eyebrow',
  'order',
  'sidebarBadge',
  'sidebarBadgeVariant',
  'keywords',
];

function serializeFrontmatter(fm) {
  const lines = ['---'];
  for (const key of FM_KEY_ORDER) {
    if (fm[key] === undefined || fm[key] === null) continue;
    const val = fm[key];
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => v).join(', ')}]`);
    } else if (typeof val === 'string') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  // any extra keys not in the standard order
  for (const [key, val] of Object.entries(fm)) {
    if (FM_KEY_ORDER.includes(key)) continue;
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => v).join(', ')}]`);
    } else if (typeof val === 'string') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/* ---------------------------------------------------------------------------
 *  Project API base URL lookup.
 * ------------------------------------------------------------------------- */

function getApiBaseUrl(projectId) {
  const src = readTsFile('src/config/projects.ts');
  // Find the project block that contains this id, then extract apiBaseUrl.
  const idMatch = src.match(new RegExp(`id:\\s*['"]${projectId}['"]`));
  if (!idMatch) return null;
  const afterId = src.slice(idMatch.index);
  const block = afterId.slice(0, 600); // enough to reach the next project's fields
  const m = block.match(/apiBaseUrl:\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

/* ---------------------------------------------------------------------------
 *  Title case helper for prompts.
 * ------------------------------------------------------------------------- */

function titleCase(s) {
  return s
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ---------------------------------------------------------------------------
 *  Main.
 * ------------------------------------------------------------------------- */

async function main() {
  process.stdout.write('\n  Page generator\n  ==============\n\n');

  const pageType = await askSelect(
    'Page type:',
    ['guide', 'api-endpoint', 'tutorial', 'changelog', 'troubleshooting'],
    { default: '1' },
  );

  const project = await askSelect('Project:', PROJECT_IDS, {
    default: String(PROJECT_IDS.indexOf('guide') + 1 || 1),
  });

  const slug = await ask('Page slug (kebab-case)', {
    default: 'new-page',
    validate: (v) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)
        ? null
        : 'Use lowercase kebab-case, e.g. "my-page"',
  });

  const titleDefault = titleCase(slug);
  const titleEn = await ask('Title (EN)', {
    default: titleDefault,
  });

  const titleId = await ask('Title (ID)', {
    default: titleDefault,
  });

  const descEn = await ask('Description (EN) — optional', { default: '' });
  const descId = await ask('Description (ID) — optional', { default: descEn });

  const order = parseInt(await ask('Order', { default: '10' }), 10);
  const keywordsRaw = await ask('Keywords (comma-separated)', { default: slug });
  const keywords = keywordsRaw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const apiBaseUrl = pageType === 'api-endpoint' ? getApiBaseUrl(project) : null;

  const ctx = {
    slug,
    title: titleEn,
    description: descEn,
    order,
    keywords,
    project,
    apiBaseUrl,
  };

  const baseDir = join(ROOT, 'src', 'content', 'docs');

  const created = [];
  const skipped = [];

  for (const locale of LOCALES) {
    const dir = join(baseDir, locale, project);
    const filePath = join(dir, `${slug}.mdx`);

    if (existsSync(filePath)) {
      skipped.push(`${locale}: ${filePath} (already exists)`);
      continue;
    }

    const localCtx =
      locale === 'en'
        ? ctx
        : { ...ctx, title: titleId, description: descId || ctx.description };

    const tpl = TEMPLATES[pageType](locale, localCtx);
    const content = serializeFrontmatter(tpl.frontmatter) + '\n\n' + tpl.body + '\n';

    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, 'utf8');
    created.push(`${locale}: ${filePath}`);
  }

  rl.close();

  process.stdout.write('\n  Result\n  ------\n');
  if (created.length) {
    process.stdout.write('  Created:\n');
    for (const c of created) process.stdout.write(`    ✓ ${c}\n`);
  }
  if (skipped.length) {
    process.stdout.write('  Skipped:\n');
    for (const s of skipped) process.stdout.write(`    - ${s}\n`);
  }
  process.stdout.write(
    `\n  Next: \`npm run dev\` then visit the pages. Edit content as needed.\n\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
