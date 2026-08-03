import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LOCALES } from '../site.config';

/**
 * ============================================================================
 *  CONTENT SCHEMA
 * ============================================================================
 *
 * Files live at:
 *
 *     src/content/docs/<locale>/<project-id>/<page-slug>.mdx
 *
 * The path is the routing contract — there is no central list of pages to keep
 * in sync. Adding a file adds a page and a sidebar entry. Deleting it removes
 * both.
 *
 *   src/content/docs/en/my-api/getting-started.mdx  →  /docs/my-api/getting-started/
 *   src/content/docs/id/my-api/getting-started.mdx  →  /id/docs/my-api/getting-started/
 *
 * `<project-id>` must match an `id` in `src/config/projects.ts`.
 */

const docs = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: 'src/content/docs',
  }),
  schema: z.object({
    /** Page title. Rendered as the `<h1>` — do not repeat it as `#` in the body. */
    title: z.string(),

    /** One or two sentences. Shown under the title and used as the meta description. */
    description: z.string().optional(),

    /**
     * Sidebar group heading. Pages sharing a category are grouped together.
     * Groups are ordered by the lowest `order` value they contain.
     */
    category: z.string().default('Guides'),

    /** Sort position within the sidebar. Lower numbers come first. */
    order: z.number().default(999),

    /** Overrides the sidebar link text when the title is too long. */
    sidebarLabel: z.string().optional(),

    /** Small tag next to the sidebar link, e.g. `GET`, `POST`, `New`. */
    sidebarBadge: z.string().optional(),

    /** Colour of `sidebarBadge`. */
    sidebarBadgeVariant: z
      .enum(['neutral', 'success', 'info', 'warning', 'danger'])
      .default('neutral'),

    /** Eyebrow label above the page title. Falls back to `category`. */
    eyebrow: z.string().optional(),

    /** Hides the page from the sidebar and search while keeping it reachable by URL. */
    hidden: z.boolean().default(false),

    /** Excluded from production builds; still visible with `npm run dev`. */
    draft: z.boolean().default(false),

    /** Set to `false` to hide the table of contents on this page. */
    tableOfContents: z.boolean().default(true),

    /** Extra search keywords that do not appear in the title or description. */
    keywords: z.array(z.string()).default([]),
  }),
});

export const collections = { docs };

/** Runtime guard so a typo in a folder name fails loudly instead of silently. */
export const KNOWN_LOCALES: readonly string[] = LOCALES;
