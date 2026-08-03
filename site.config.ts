/**
 * ============================================================================
 *  SITE CONFIGURATION — edit this file first
 * ============================================================================
 *
 * This is the single source of truth for your site's identity. It is imported
 * by `astro.config.mjs` and by the app itself, so you only change it once.
 *
 * Everything below is safe to edit. Nothing here is referenced by name
 * anywhere else, so you cannot break routing by changing these values.
 */

/** Locale codes you want to publish. The first entry is the default. */
export const LOCALES = ['en', 'id'] as const;

export type Locale = (typeof LOCALES)[number];

/** The default locale is served without a URL prefix (e.g. `/docs/...`). */
export const DEFAULT_LOCALE: Locale = 'en';

export const site = {
  /**
   * Absolute URL of the deployed site, with no trailing slash.
   * Used for canonical links, Open Graph tags, and sitemap generation.
   */
  url: 'https://example.com',

  /**
   * Set this when deploying to a subpath, e.g. GitHub Pages at
   * `https://user.github.io/my-repo` → base: '/my-repo'.
   * Leave as '/' for root deployments.
   */
  base: '/',

  /** Shown in the header, next to the logo mark. */
  title: 'astro',

  /** Rendered in the accent gradient after the title. */
  titleAccent: 'docs',

  /** The single character rendered inside the gradient logo square. */
  logoLetter: 'A',

  /** Falls back to this description when a page does not define its own. */
  description: 'Multi-project documentation, all in one place.',

  /** Footer copyright line. The year is appended automatically. */
  copyright: 'Astro Docs Template',

  /**
   * Optional links rendered in the header. Set to `null` to hide.
   * `editBase` powers the "Edit this page" link at the bottom of each page —
   * the file path within `src/content/docs/` is appended to it.
   */
  links: {
    github: 'https://github.com/your-org/your-repo',
    editBase: 'https://github.com/your-org/your-repo/edit/main/src/content/docs/',
  },

  /**
   * Optional help box shown under the table of contents.
   * Set to `null` to hide it entirely.
   */
  helpBox: {
    channel: '#support',
    href: null as string | null,
  },
} as const;
