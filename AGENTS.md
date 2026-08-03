# Agent Authoring Contract

Use this contract when an AI coding agent creates or edits documentation in this repository.

## Before writing

1. Read `src/content.config.ts` for the current frontmatter schema.
2. Read `src/config/projects.ts` for valid project IDs.
3. Read one neighbouring page in the same locale and project for terminology.
4. Confirm the target locale is listed in `LOCALES` in `site.config.ts`.

## File contract

Create content at:

```text
src/content/docs/<locale>/<project-id>/<page-slug>.mdx
```

- Use lowercase kebab-case for project IDs and page slugs.
- The project ID must exist in `src/config/projects.ts`.
- Do not edit route files, sidebar components, or search data when adding a page. They are generated.

## Content contract

- Use plain Markdown for headings, paragraphs, lists, tables, links, blockquotes, and code fences.
- Do not repeat the page title as an `# h1`; the layout renders it from frontmatter.
- Start body sections at `##`.
- Do not write manual heading IDs or anchor links.
- Do not add Tailwind classes, `<section>` wrappers, animation delays, or presentational HTML.
- Do not import MDX components. They are injected globally.
- Use a component only when it communicates structure or meaning that Markdown cannot express as clearly.
- Give every code fence an accurate language.
- Never embed secrets, real tokens, private URLs, or production credentials in examples.

## Available components

- `Callout`: `type="note|tip|important|warning|caution"`, optional `title`
- `CardGrid`: `cols={2|3}`
- `Card`: required `title`, optional `href`, `icon`, `badge`
- `Steps` with `Step`: `Step` requires `title`
- `Tabs` with `Tab`: `Tab` requires `label`
- `PackageManagerTabs`: required `package`, optional `dev`
- `Badge`: `variant="neutral|success|info|warning|danger|accent"`
- `FileTree` with `File`: `File` requires `name`; optional `type`, `depth`, `description`, `highlight`

See `src/content/docs/en/guide/components.mdx` for verified examples.

## Frontmatter baseline

```yaml
---
title: Page title
description: One or two sentences describing the page.
category: Guides
order: 30
keywords: [search, aliases]
---
```

Only `title` is required. Prefer explicit `description`, `category`, and `order` for published pages.

## Verification

After editing:

```bash
npm run check
npm run build
```

Do not declare the work complete if either command fails.
