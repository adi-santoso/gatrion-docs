# Contributing

Contributions are welcome. This document covers the most common tasks: adding or editing documentation pages, running the build, and opening a pull request.

## Prerequisites

- **Node.js 22 or newer**
- **Git**
- Any editor or AI coding agent

## Local setup

```bash
git clone https://github.com/adi-santoso/gatrion-docs.git
cd gatrion-docs
npm install
npm run dev
```

Open `http://localhost:4321`. Content edits appear immediately.

## Adding a page

### With the page generator

```bash
npm run gen
```

Answer the prompts. The script writes a file in every locale listed in `site.config.ts`, with boilerplate matched to the chosen page type (`guide`, `api-endpoint`, `tutorial`, `changelog`, `troubleshooting`). See the **Page generator** section in the README for details.

### Manually

Create a file at:

```text
src/content/docs/<locale>/<project-id>/<page-slug>.mdx
```

Only `title` is required in the frontmatter. The full schema is documented in `src/content.config.ts` and in the **Writing Content** page at `/docs/guide/writing-content/`.

## Writing content

Follow these rules, which apply to human contributors and AI agents alike. The full contract is in [`AGENTS.md`](AGENTS.md).

- Use plain Markdown for headings, paragraphs, lists, tables, links, blockquotes, and code fences.
- Do not repeat the page title as an `# h1`; the layout renders it from frontmatter.
- Start body sections at `##`.
- Do not write manual heading IDs or anchor links.
- Do not add Tailwind classes, `<section>` wrappers, animation delays, or presentational HTML.
- Do not import MDX components. They are injected globally.
- Use a component only when it communicates structure or meaning that Markdown cannot express as clearly.
- Give every code fence an accurate language.
- Never embed secrets, real tokens, private URLs, or production credentials in examples.

## Locale parity

Every page must exist in every locale listed in `LOCALES` in `site.config.ts`. The default locale (`en`) has no URL prefix; other locales do. When adding a page, create all locale files in the same pull request so the hub does not show a missing-translation placeholder.

## Configuring the template

Edit these files first when adapting the template to your own use:

| File | Purpose |
| --- | --- |
| `site.config.ts` | Site URL, base path, branding, locales, repository links, help box |
| `src/config/projects.ts` | Projects shown on the hub, versions, status, icons, accents |
| `src/i18n/ui.ts` | Theme interface strings and locale names |
| `src/styles/globals.css` | Design tokens and Markdown typography |
| `src/content.config.ts` | Typed frontmatter contract |

## Verification

Before opening a pull request, run both commands:

```bash
npm run check
npm run build
```

Both must pass. `npm run check` validates Astro, TypeScript, and content schemas. `npm run build` runs the check first and then generates the static site in `dist/`.

If either command fails, fix the reported issue before pushing. Do not mark work complete while errors remain.

## Pull request checklist

- [ ] Pages created in every locale
- [ ] Project ID exists in `src/config/projects.ts`
- [ ] Frontmatter matches the schema in `src/content.config.ts`
- [ ] No secrets, tokens, or production credentials in examples
- [ ] `npm run check` passes
- [ ] `npm run build` passes

## Opening an issue

Bug reports and feature requests are welcome on the [issues page](https://github.com/adi-santoso/gatrion-docs/issues). Include the steps to reproduce, the expected result, and the actual result.
