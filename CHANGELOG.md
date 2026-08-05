# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **VS Code snippets never loaded.** Renamed `.vscode/snippets.json` to `.vscode/gatrion-docs.code-snippets` (the filename VS Code actually reads) and un-ignored it in `.gitignore`, so the snippets ship with the template instead of being silently dropped on commit.
- **README "Minimal page" example broke GitHub rendering.** The nested code fence closed early; the prose after it rendered as code. Switched to a 4-backtick outer fence so the inner fence renders as a code sample.
- **`lastUpdated()` only resolved `.mdx` files.** Pages written as `.md` (allowed by the loader) silently lost their timestamp. Added a shared `sourcePathFor()` resolver that tries both extensions, and wired the "Edit this page" link through the same resolver so it points at the real file.
- **Footer date was hard-coded to `en-US`.** Now formats via `Intl.DateTimeFormat` with the page's locale tag, so Indonesian pages show a localized date.

### Added

- **`hreflang` alternates and `x-default`.** `BaseLayout` now emits `<link rel="alternate">` for every locale in which a page actually exists, plus an `x-default` pointing at the default locale. Search engines and social crawlers see the full locale matrix.
- **Sitemap i18n.** `@astrojs/sitemap` is configured with `i18n`, so `sitemap-0.xml` now carries `xhtml:link` alternates between locales, matching the HTML `hreflang` tags.
- **Open Graph `site_name` and `locale`, Twitter `title` and `description`.** Previously only `og:title`, `og:description`, and `twitter:card` were emitted.
- **Locale parity check.** New `scripts/check-locale-parity.mjs` fails the build when a page slug exists in some locales but not others. Wired into `npm run check` as `npm run check:parity`, so CI enforces it on every pull request.
- **GitHub Actions CI.** `.github/workflows/ci.yml` runs `npm run check` and `npm run build:only` on every push and pull request to `main`, with full-history checkout (needed by `lastUpdated`), dependency caching, and a `dist` artifact upload.

## [1.0.0] — 2026-08-05

First stable release.

- Multi-project documentation hub with i18n (`en`, `id`) support.
- Globally injected MDX components: `Callout`, `CardGrid`, `Card`, `Steps`, `Step`, `Tabs`, `Tab`, `PackageManagerTabs`, `ApiEndpoint`, `Badge`, `FileTree`, `File`.
- `ApiEndpoint`: multi-language API code snippets generated at build time via `httpsnippet`.
- Page generator (`npm run gen`) with five boilerplate templates.
- Project generator (`npm run gen:project`).
- VS Code workspace with extension recommendations, editor settings, and MDX snippets.
- Dark and light themes with anti-flash inline script.
- Build-time search index with keyboard navigation (`Ctrl`/`Cmd`+`K`).
- Last updated timestamps via `git log`.
- Redirect support for Vercel (`vercel.json`), Netlify and Cloudflare Pages (`public/_redirects`).
- `AGENTS.md` contract for AI authoring of documentation.
- MIT licensed.

[Unreleased]: https://github.com/adi-santoso/gatrion-docs/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/adi-santoso/gatrion-docs/releases/tag/v1.0.0
