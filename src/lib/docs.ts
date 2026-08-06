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
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../site.config';
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
  /** Nested children, present when other pages live under this slug. */
  children?: SidebarItem[];
  /**
   * Whether the node should render expanded on first paint. True for every
   * ancestor of the current page, so the active path is always visible.
   */
  defaultExpanded?: boolean;
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
 * Pages are grouped by `category` (the sidebar group heading). Within a group,
 * pages whose slug is a prefix of another become a parent node and the longer
 * slug becomes its child, so nested files like `guide/getting-started.mdx` and
 * `guide/getting-started/installation.mdx` render as a collapsible subtree
 * instead of a flat list.
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

  const groups = new Map<string, { minOrder: number; items: SidebarItem[]; pages: DocPage[] }>();

  for (const page of pages) {
    const existing = groups.get(page.category);
    if (existing) {
      existing.pages.push(page);
      existing.minOrder = Math.min(existing.minOrder, page.order);
    } else {
      groups.set(page.category, { minOrder: page.order, items: [], pages: [page] });
    }
  }

  return [...groups.entries()]
    .sort(([aTitle, a], [bTitle, b]) =>
      a.minOrder !== b.minOrder ? a.minOrder - b.minOrder : aTitle.localeCompare(bTitle),
    )
    .map(([title, group]) => ({ title, items: buildTree(group.pages, currentHref) }));
}

/**
 * Builds a tree of sidebar items from the flat page list of one group.
 *
 * A page is a child of another when its slug starts with `<parent-slug>/`.
 * Only one level of nesting is surfaced this way, which keeps the sidebar
 * readable; deeper nesting flattens into the nearest parent.
 */
function buildTree(pages: DocPage[], currentHref: string): SidebarItem[] {
  const sorted = [...pages].sort(byOrderThenTitle);

  // First pass: create a node for every page, keyed by slug. Doing this before
  // linking means a child that sorts before its parent still finds it.
  const itemBySlug = new Map<string, SidebarItem>();
  for (const page of sorted) {
    itemBySlug.set(page.slug, {
      label: page.sidebarLabel,
      href: page.href,
      badge: page.entry.data.sidebarBadge,
      badgeVariant: page.entry.data.sidebarBadgeVariant,
      isCurrent: page.href === currentHref,
    });
  }

  // Second pass: link children to parents. A page whose slug nests under
  // another becomes that node's child; otherwise it is a root.
  const roots: SidebarItem[] = [];
  for (const page of sorted) {
    const item = itemBySlug.get(page.slug)!;
    const parentSlug = parentSlugOf(page.slug);
    const parent = parentSlug ? itemBySlug.get(parentSlug) : undefined;

    if (parent) {
      (parent.children ??= []).push(item);
    } else {
      roots.push(item);
    }
  }

  // Mark every ancestor of the current page as expanded so the active path
  // is visible without requiring a click.
  const markExpanded = (items: SidebarItem[]) => {
    for (const item of items) {
      if (item.isCurrent || (item.children && hasCurrentDescendant(item))) {
        item.defaultExpanded = true;
      }
      if (item.children) markExpanded(item.children);
    }
  };
  markExpanded(roots);

  return roots;
}

/** Returns the parent slug for nesting, or `null` for a top-level page. */
function parentSlugOf(slug: string): string | null {
  const idx = slug.lastIndexOf('/');
  return idx === -1 ? null : slug.slice(0, idx);
}

/** True when the item (or any descendant) is the current page. */
function hasCurrentDescendant(item: SidebarItem): boolean {
  if (item.isCurrent) return true;
  return item.children?.some(hasCurrentDescendant) ?? false;
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

/**
 * The locales in which a given page actually exists.
 *
 * Used to emit `hreflang` alternates, which must only point at URLs that
 * resolve. A page translated into some but not all locales gets alternates for
 * exactly the locales it has.
 */
export async function localesForPage(projectId: string, slug: string): Promise<Locale[]> {
  const all = await loadDocs();
  const found = all
    .filter((p) => p.projectId === projectId && p.slug === slug)
    .map((p) => p.locale);

  // Preserve LOCALES declaration order rather than collection order.
  return LOCALES.filter((locale) => found.includes(locale));
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
 * Source files
 *
 * The collection id carries no extension, but the loader accepts both `.md`
 * and `.mdx`. Anything that needs a real path — the git timestamp, the "Edit
 * this page" link — has to resolve the extension rather than assume one.
 * ------------------------------------------------------------------------- */

/** Content extensions accepted by the loader in `src/content.config.ts`. */
const CONTENT_EXTENSIONS = ['.mdx', '.md'] as const;

const CONTENT_ROOT = 'src/content/docs';

const sourcePathCache = new Map<string, string | null>();

/**
 * The path of a page's source file relative to `src/content/docs/`, including
 * its real extension (`guide/intro.md`). Returns `null` if no file matches.
 */
export function sourcePathFor(entryId: string): string | null {
  if (sourcePathCache.has(entryId)) return sourcePathCache.get(entryId) ?? null;

  const match =
    CONTENT_EXTENSIONS.map((ext) => `${entryId}${ext}`).find((candidate) =>
      existsSync(`${CONTENT_ROOT}/${candidate}`),
    ) ?? null;

  sourcePathCache.set(entryId, match);
  return match;
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

  const source = sourcePathFor(entryId);

  if (!source) {
    lastUpdatedCache.set(entryId, null);
    return null;
  }

  try {
    // execFileSync avoids a shell, so paths never need manual quoting.
    const date = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--follow', '--', `${CONTENT_ROOT}/${source}`],
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
