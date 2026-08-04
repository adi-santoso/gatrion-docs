# Gatrion Docs

A multi-project documentation template built with **Astro 7**, **MDX**, and **Tailwind CSS 4**. Markdown-first, internationalization-ready, fully static, and intentionally straightforward for both people and AI coding agents to author.

Made by [Gatrion](https://gatrion.my.id) and open-sourced under the MIT licence.

- Production: **[docs.gatrion.my.id](https://docs.gatrion.my.id)**
- Vercel fallback: **[gatrion-docs.vercel.app](https://gatrion-docs.vercel.app)**

## Why this template

- **Markdown-first authoring** — headings, code blocks, tables, and links use ordinary Markdown. Content contains no Tailwind classes or layout boilerplate.
- **Agent-friendly contract** — one deterministic file convention, typed frontmatter, globally available MDX components, and build-time validation.
- **Multi-project hub** — project cards, project switcher, sidebars, previous/next links, and search are generated from content.
- **Internationalization** — English is the default locale and Indonesian is included as a complete example. Locale switching preserves the current path.
- **Static by default** — every route is prerendered. No server adapter or runtime is required after build.
- **Accessible interface** — skip link, keyboard search and tabs, reduced-motion support, focus styles, semantic landmarks, and responsive navigation.
- **Dark and light themes** — persistent theme selection with no flash on first paint.
- **Shiki highlighting** — standard fenced code blocks, dual themes, language labels, and copy buttons.
- **SEO basics** — canonical URLs, Open Graph metadata, sitemap, generated robots file, and a real static 404 page.

## Quick start

Click **Use this template** on GitHub, or clone directly:

```bash
git clone https://github.com/adi-santoso/gatrion-docs.git
cd gatrion-docs
npm install
npm run dev
```

Open `http://localhost:4321`.

For production:

```bash
npm run build
npm run preview
```

`npm run build` runs `astro check` before generating the static site in `dist/`.

## Configure the template

Start with these files:

| File | Purpose |
| --- | --- |
| `site.config.ts` | Site URL, base path, branding, locales, repository links, help box |
| `src/config/projects.ts` | Projects shown on the hub, versions, status, icons, accents |
| `src/i18n/ui.ts` | Theme interface strings and locale names |
| `src/styles/globals.css` | Design tokens and Markdown typography |
| `src/content.config.ts` | Typed frontmatter contract |

Set `site.url` before deployment. For a subpath deployment, such as GitHub Pages at `https://user.github.io/docs`, use:

```ts
url: 'https://user.github.io',
base: '/docs',
```

## Add documentation

Content follows this path:

```text
src/content/docs/<locale>/<project-id>/<page-slug>.mdx
```

Examples:

```text
src/content/docs/en/guide/getting-started.mdx
src/content/docs/id/guide/getting-started.mdx
```

The English file is served at `/docs/guide/getting-started/`; the Indonesian file is served at `/id/docs/guide/getting-started/`.

The project ID must exist in `src/config/projects.ts`. Adding a file automatically adds its route, sidebar entry, search result, table of contents, and previous/next position.

### Minimal page

```md
---
title: Authentication
description: Authenticate API requests with bearer tokens.
category: Guides
order: 30
---

## Create a token

Use the CLI to create a token:

```bash
example auth token create
```
```

Only `title` is required. The full schema is documented in `src/content.config.ts` and in the included **Writing Content** page.

## Built-in MDX components

Components are injected globally. Do not import them in content files.

```mdx
<Callout type="tip" title="Optional title">
  Markdown **works** inside components.
</Callout>

<CardGrid>
  <Card title="Getting started" href="/docs/guide/getting-started/">
    Set up the project in a few minutes.
  </Card>
</CardGrid>

<Steps>
  <Step title="Install">Run `npm install`.</Step>
  <Step title="Develop">Run `npm run dev`.</Step>
</Steps>

<ApiEndpoint
  method="POST"
  url="/v1/users"
  apiBase="https://api.example.com"
  headers={{ Authorization: "Bearer $TOKEN", "Content-Type": "application/json" }}
  body={{ name: "Ada Lovelace", email: "ada@example.com" }}
/>
```

Included components:

- `Callout`: `note`, `tip`, `important`, `warning`, `caution`
- `Card` and `CardGrid`
- `Steps` and `Step`
- `Tabs` and `Tab`
- `PackageManagerTabs`
- `ApiEndpoint`: multi-language request snippets (`curl`, `PowerShell`, `JavaScript`, `Node.js`, `Python`, `Go`, `PHP`) generated at build time via [`httpsnippet`](https://github.com/Kong/httpsnippet)
- `Badge`
- `FileTree` and `File`

See `/docs/guide/components/` in the running site for a live catalogue.

## AI agent workflow

This repository includes [`AGENTS.md`](AGENTS.md), a concise contract intended for coding agents. The essential rules are:

1. Read `src/content.config.ts` before writing frontmatter.
2. Read `src/config/projects.ts` and use a declared project ID.
3. Write under `src/content/docs/<locale>/<project-id>/`.
4. Prefer plain Markdown. Use built-in MDX components only when they add meaning.
5. Never add presentation classes, manual heading IDs, component imports, or navigation entries to content.
6. Run `npm run check` after editing and `npm run build` before finishing.

This keeps agent output short, portable, and mechanically verifiable.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run check` | Validate Astro, TypeScript, and content schemas |
| `npm run build` | Validate and build the production site |
| `npm run build:only` | Build without running a separate check first |
| `npm run preview` | Serve the generated `dist/` directory locally |
| `npm run gen` | Interactively scaffold a new page in every locale |

## Page generator

```bash
npm run gen
```

An interactive, zero-dependency script that scaffolds a new MDX page in every locale listed in `site.config.ts`. It reads project IDs from `src/config/projects.ts` so it never goes out of sync.

Pick a page type and the script writes two files at once (`en` + `id` by default), each with boilerplate matched to the type:

| Type | Boilerplate |
| --- | --- |
| `guide` | Prerequisites, `<Steps>`, next steps |
| `api-endpoint` | `<ApiEndpoint>` blocks, query/body/response tables, error table |
| `tutorial` | "What you'll build", `<Steps>` with code fences, `<CardGrid>` |
| `changelog` | `[Unreleased]` + initial release sections, Added/Changed/Fixed |
| `troubleshooting` | `<Tabs>` per symptom, cause/fix, common error codes table |

Titles are prompted per locale so the page ships with locale parity from the first commit. See `scripts/generate-page.mjs` for the implementation.

## Project structure

```text
├── site.config.ts              # Brand, URL, locales, external links
├── astro.config.mjs
├── src/
│   ├── components/
│   │   ├── content/            # Globally injected MDX components
│   │   ├── layout/             # Navigation, search, ToC, header
│   │   └── pages/              # Shared page implementations
│   ├── config/projects.ts      # Project registry
│   ├── content/docs/           # Markdown and MDX pages
│   ├── i18n/                   # Interface translations and URL helpers
│   ├── layouts/                # Base, hub, and documentation layouts
│   ├── lib/docs.ts             # Generated navigation/search model
│   ├── pages/                  # Static route definitions
│   ├── plugins/                # Heading anchor and code-frame plugins
│   └── styles/globals.css
└── public/
```

## Adding a locale

1. Add the code to `LOCALES` in `site.config.ts`.
2. Add its name and HTML language tag in `src/i18n/ui.ts`.
3. Add a translation object in `src/i18n/ui.ts`. Missing strings fall back to English.
4. Add content under `src/content/docs/<locale>/`.

## Deployment

The output is plain static HTML, CSS, and JavaScript, so no server adapter or runtime is needed.

Set `site.url` in `site.config.ts` first — canonical links, Open Graph tags, the sitemap, and `robots.txt` are all derived from it.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 or newer |

### Current production deployment

This repository is connected to the Vercel project `adi-santosos-projects/gatrion-docs`. Every push to `main` triggers a production deployment automatically.

The stable Vercel URL is:

```text
https://gatrion-docs.vercel.app
```

The intended custom domain is:

```text
https://docs.gatrion.my.id
```

The domain is registered with the Vercel project, while DNS remains managed by Cloudflare. Configure this record in Cloudflare:

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| `A` | `docs` | `76.76.21.21` | DNS only |

Keep the record set to **DNS only** until Vercel verifies the domain and issues the TLS certificate. There is no need to move the `gatrion.my.id` nameservers to Vercel.

After DNS propagation, verify:

```bash
curl -I https://docs.gatrion.my.id
```

### Deploy your own copy

`netlify.toml` and `vercel.json` are included, so Netlify and Vercel need no additional build configuration. Cloudflare Pages requires entering the build command and publish directory from the table above once.

To deploy a new copy with the Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel --prod
```

The first deployment links the local directory to a Vercel project and creates `.vercel/`. That directory contains local project metadata and is intentionally ignored by Git.

To attach a custom domain to the linked project:

```bash
vercel domains add docs.example.com
```

If the domain uses Cloudflare nameservers, add the DNS record requested by Vercel in Cloudflare rather than changing nameservers.

### Subpath deployments

For a subpath deployment such as `https://example.com/docs`, also set `base`:

```ts
url: 'https://example.com',
base: '/docs',
```

Root and subdomain deployments keep `base: '/'`.

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, the content contract, locale parity rules, and the pull request checklist.

The essentials:

```bash
npm run check
npm run build
```

Both must pass before a pull request. When adding documentation, follow [`AGENTS.md`](AGENTS.md) — it applies to human contributors as much as to AI agents.

## License

[MIT](LICENSE) © Gatrion
