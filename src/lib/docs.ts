/**
 * ============================================================================
 *  DOCUMENTATION MODEL
 * ============================================================================
 *
 * Everything the theme needs to know about a page is derived here, from the
 * content collection alone. There is no hand-maintained navigation list.
 *
 * Entry ids produced by the glob loader look like `en/guide/getting-started`,
 * which decomposes into locale / project / slug.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { execSync } from 'node:child_process';
import { DEFAULT_LOCALE, type Locale } from '../../site.config';
import { isLocale, docPath } from '../i18n';
import { getProject, type ProjectConfig } from '../config/projects';

export type DocEntry = CollectionEntry<'docs'>;

/** A page, with its position in the site resolved. */
export interface DocPage {
  entry: DocEntry;
  locale: Locale;
  projectId: string;
  /** Page slug, possibly nested: `reference/errors`. */
  slug: string;
  /** Public URL, locale- and base-aware, with a trailing slash. */
  href: string;
  title: string;
  sidebarLabel: string;
  description: string;
  category: string;
  order: number;
}

export interface SidebarItem {
  label: string;
  href: string;
  badge?: string;
  badgeVariant: 'neutral' | 'success' | 'info' | 'warning' | 'danger';
  isCurrent: boolean;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

/* ---------------------------------------------------------------------------
 * Parsing
 * ------------------------------------------------------------------------- */

interface ParsedId {
  locale: Locale;
  projectId: string;
  slug: string;
}

/**
 * Splits `en/guide/nested/page` into its parts.
 *
 * Returns `null` for ids that do not carry at least a locale, a project and a
 * page slug — those are misplaced files, and are skipped rather than crashing
 * the build. The dev server logs them (see `loadDocs`).
 */
export function parseDocId(id: string): ParsedId | null {
  const segments = id.split('/').filter(Boolean);
  if (segments.length < 3) return null;

  const [maybeLocale, projectId, ...rest] = segments;
  if (!isLocale(maybeLocale)) return null;
  if (!projectId || rest.length === 0) return null;

  return { locale: maybeLocale, projectId, slug: rest.join('/') };
}

function toDocPage(entry: DocEntry, parsed: ParsedId): DocPage {
  const { locale, projectId, slug } = parsed;
  return {
    entry,
    locale,
    projectId,
    slug,
    href: docPath(locale, projectId, slug),
    title: entry.data.title,
    sidebarLabel: entry.data.sidebarLabel ?? entry.data.title,
    description: entry.data.description ?? '',
    category: entry.data.category,
    order: entry.data.order,
  };
}

/* ---------------------------------------------------------------------------
 * Loading
 * ------------------------------------------------------------------------- */

let cache: DocPage[] | null = null;

/**
 * Loads every valid page once per build.
 *
 * Drafts are kept during `astro dev` and dropped from production builds, so a
 * work-in-progress page is previewable without being published.
 */
export async function loadDocs(): Promise<DocPage[]> {
  if (cache) return cache;

  const isProduction = import.meta.env.PROD;
  const entries = await getCollection('docs', ({ data }) =>
    isProduction ? data.draft !== true : true,
  );

  const pages: DocPage[] = [];

  for (const entry of entries) {
    const parsed = parseDocId(entry.id);

    if (!parsed) {
      console.warn(
        `[docs] Skipping "${entry.id}". Expected src/content/docs/<locale>/<project>/<page>.mdx — ` +
          `check that the locale folder is listed in LOCALES in site.config.ts.`,
      );
      continue;
    }

    if (!getProject(parsed.projectId)) {
      console.warn(
        `[docs] Skipping "${entry.id}". Project "${parsed.projectId}" is not declared in src/config/projects.ts.`,
      );
      continue;
    }

    pages.push(toDocPage(entry, parsed));
  }

  cache = pages;
  return pages;
}

/* ---------------------------------------------------------------------------
 * Ordering
 *
 * Pages sort by `order`, then alphabetically by title so that pages left at the
 * default order still land in a stable, predictable sequence.
 * ------------------------------------------------------------------------- */

function byOrderThenTitle(a: DocPage, b: DocPage): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/** Pages of one project in one locale, in reading order, excluding hidden ones. */
export async function docsForProject(
  locale: Locale,
  projectId: string,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<DocPage[]> {
  const all = await loadDocs();
  return all
    .filter(
      (p) =>
        p.locale === locale &&
        p.projectId === projectId &&
        (includeHidden || !p.entry.data.hidden),
    )
    .sort(byOrderThenTitle);
}

/**
 * Builds the sidebar for a project.
 *
 * Groups appear in the order of their lowest-ordered member, so controlling
 * `order` on pages is enough to control group sequence too.
 */
export async function sidebarFor(
  locale: Locale,
  projectId: string,
  currentHref: string,
): Promise<SidebarGroup[]> {
  const pages = await docsForProject(locale, projectId);

  const groups = new Map<string, { minOrder: number; items: SidebarItem[] }>();

  for (const page of pages) {
    const existing = groups.get(page.category);
    const item: SidebarItem = {
      label: page.sidebarLabel,
      href: page.href,
      badge: page.entry.data.sidebarBadge,
      badgeVariant: page.entry.data.sidebarBadgeVariant,
      isCurrent: page.href === currentHref,
    };

    if (existing) {
      existing.items.push(item);
      existing.minOrder = Math.min(existing.minOrder, page.order);
    } else {
      groups.set(page.category, { minOrder: page.order, items: [item] });
    }
  }

  return [...groups.entries()]
    .sort(([aTitle, a], [bTitle, b]) =>
      a.minOrder !== b.minOrder ? a.minOrder - b.minOrder : aTitle.localeCompare(bTitle),
    )
    .map(([title, group]) => ({ title, items: group.items }));
}

/** Neighbouring pages within the same project, for the prev/next footer. */
export async function neighboursOf(
  page: DocPage,
): Promise<{ prev: DocPage | null; next: DocPage | null }> {
  const siblings = await docsForProject(page.locale, page.projectId);
  const index = siblings.findIndex((p) => p.entry.id === page.entry.id);

  if (index === -1) return { prev: null, next: null };
  return {
    prev: siblings[index - 1] ?? null,
    next: siblings[index + 1] ?? null,
  };
}

/* ---------------------------------------------------------------------------
 * Hub
 * ------------------------------------------------------------------------- */

export interface ProjectSummary {
  project: ProjectConfig;
  pageCount: number;
  /** `null` when the project has no pages in this locale yet. */
  href: string | null;
}

/**
 * Projects in declaration order, each with its landing page for this locale.
 *
 * Falls back to the default locale's page count so a project that exists only
 * in English still appears on the Indonesian hub.
 */
export async function projectSummaries(locale: Locale): Promise<ProjectSummary[]> {
  const { projects } = await import('../config/projects');
  const all = await loadDocs();

  return Promise.all(
    projects.map(async (project) => {
      let pages = all
        .filter((p) => p.locale === locale && p.projectId === project.id && !p.entry.data.hidden)
        .sort(byOrderThenTitle);

      if (pages.length === 0 && locale !== DEFAULT_LOCALE) {
        pages = all
          .filter(
            (p) =>
              p.locale === DEFAULT_LOCALE &&
              p.projectId === project.id &&
              !p.entry.data.hidden,
          )
          .sort(byOrderThenTitle);
      }

      return {
        project,
        pageCount: pages.length,
        href: pages[0]?.href ?? null,
      };
    }),
  );
}

/* ---------------------------------------------------------------------------
 * Search index
 * ------------------------------------------------------------------------- */

export interface SearchDoc {
  title: string;
  project: string;
  href: string;
  description: string;
  keywords: string;
}

/**
 * The client-side search index for one locale.
 *
 * Serialised into the page, so it holds only what is needed to match and render
 * a result — not page bodies.
 */
export async function searchIndex(locale: Locale, projectName: (id: string) => string): Promise<SearchDoc[]> {
  const all = await loadDocs();

  return all
    .filter((p) => p.locale === locale && !p.entry.data.hidden)
    .sort(byOrderThenTitle)
    .map((p) => ({
      title: p.title,
      project: projectName(p.projectId),
      href: p.href,
      description: p.description,
      keywords: p.entry.data.keywords.join(' '),
    }));
}

/* ---------------------------------------------------------------------------
 * Last updated
 *
 * Returns the ISO date of the most recent git commit that touched a content
 * file. Runs `git log` once per unique file path and caches the result.
 *
 * Returns `null` when git is unavailable (e.g. a fresh clone on a platform
 * without git, or a tarball export), so callers should treat the timestamp
 * as optional.
 * ------------------------------------------------------------------------- */

const lastUpdatedCache = new Map<string, string | null>();

export function lastUpdated(entryId: string): string | null {
  if (lastUpdatedCache.has(entryId)) return lastUpdatedCache.get(entryId) ?? null;

  const filePath = `src/content/docs/${entryId}.mdx`;

  try {
    const date = execSync(
      `git log -1 --format=%cI --follow -- "${filePath}"`,
      { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();

    const result = date || null;
    lastUpdatedCache.set(entryId, result);
    return result;
  } catch {
    lastUpdatedCache.set(entryId, null);
    return null;
  }
}
