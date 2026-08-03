/**
 * ============================================================================
 *  PROJECTS
 * ============================================================================
 *
 * One entry per documented project. Each maps to a folder under
 * `src/content/docs/<locale>/<id>/`.
 *
 * A project with no content folder still renders on the hub, marked as
 * "coming soon" and not clickable — useful for announcing planned docs.
 *
 * To run a single-project site, keep exactly one entry here: the hub then
 * redirects straight into it.
 */

import type { Locale } from '../../site.config';

export type ProjectStatus = 'stable' | 'beta' | 'draft' | 'deprecated';

/** Accent colours. Add a new one by extending `projectAccents` below. */
export type ProjectAccent =
  | 'violet'
  | 'cyan'
  | 'fuchsia'
  | 'emerald'
  | 'orange'
  | 'rose';

/** Built-in icons, drawn in `src/components/ui/Icon.astro`. */
export type ProjectIcon =
  | 'server'
  | 'monitor'
  | 'smartphone'
  | 'credit-card'
  | 'terminal'
  | 'palette'
  | 'book'
  | 'package';

export interface ProjectConfig {
  /** Folder name and URL segment. Lowercase, hyphenated, no spaces. */
  id: string;

  /** Display name. Localise it by passing an object keyed by locale. */
  name: string | Partial<Record<Locale, string>>;

  /** Short description shown on the hub card. Localisable. */
  description: string | Partial<Record<Locale, string>>;

  /** Free-form version label, e.g. `v2.4.0`. Set to `null` to hide. */
  version: string | null;

  status: ProjectStatus;
  icon: ProjectIcon;
  accent: ProjectAccent;

  /** Used by the hub filter chips. Any string; chips are derived from these. */
  group?: string;
}

export const projects: ProjectConfig[] = [
  {
    id: 'guide',
    name: {
      en: 'Template Guide',
      id: 'Panduan Template',
    },
    description: {
      en: 'How to configure this template, write content, and use every component.',
      id: 'Cara mengatur template ini, menulis konten, dan memakai setiap komponen.',
    },
    version: 'v1.0.0',
    status: 'stable',
    icon: 'book',
    accent: 'violet',
    group: 'docs',
  },
  {
    id: 'example-api',
    name: {
      en: 'Example API',
      id: 'Contoh API',
    },
    description: {
      en: 'A sample REST API reference showing badges, tables, and code samples.',
      id: 'Contoh referensi REST API dengan badge, tabel, dan cuplikan kode.',
    },
    version: 'v0.1.0',
    status: 'beta',
    icon: 'server',
    accent: 'cyan',
    group: 'reference',
  },
];

/* ---------------------------------------------------------------------------
 * Accent colour tokens.
 *
 * Tailwind cannot see class names built at runtime, so every class is written
 * out in full here. If you add an accent, add all six keys or the card will
 * render unstyled.
 * ------------------------------------------------------------------------- */

export interface AccentTokens {
  dot: string;
  text: string;
  ring: string;
  gradient: string;
  hoverBorder: string;
  hoverText: string;
}

export const projectAccents: Record<ProjectAccent, AccentTokens> = {
  violet: {
    dot: 'bg-violet-500',
    text: 'text-violet-500',
    ring: 'ring-violet-500/20',
    gradient: 'from-violet-500/15 to-fuchsia-500/15',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-500/30',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
  },
  cyan: {
    dot: 'bg-cyan-500',
    text: 'text-cyan-500',
    ring: 'ring-cyan-500/20',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-500/30',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
  fuchsia: {
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-500',
    ring: 'ring-fuchsia-500/20',
    gradient: 'from-fuchsia-500/15 to-pink-500/15',
    hoverBorder: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500/30',
    hoverText: 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400',
  },
  emerald: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-500',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/15 to-teal-500/15',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/30',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  orange: {
    dot: 'bg-orange-500',
    text: 'text-orange-500',
    ring: 'ring-orange-500/20',
    gradient: 'from-orange-500/15 to-amber-500/15',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-500/30',
    hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
  },
  rose: {
    dot: 'bg-rose-500',
    text: 'text-rose-500',
    ring: 'ring-rose-500/20',
    gradient: 'from-rose-500/15 to-pink-500/15',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-500/30',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
  },
};

/* ---------------------------------------------------------------------------
 * Lookups
 * ------------------------------------------------------------------------- */

export function getProject(id: string): ProjectConfig | undefined {
  return projects.find((p) => p.id === id);
}

export function accentFor(project: ProjectConfig | undefined): AccentTokens {
  return projectAccents[project?.accent ?? 'violet'] ?? projectAccents.violet;
}

/** Resolves a possibly-localised field to a string for the given locale. */
export function localised(
  value: string | Partial<Record<Locale, string>>,
  locale: Locale,
  fallbackLocale: Locale,
): string {
  if (typeof value === 'string') return value;
  return value[locale] ?? value[fallbackLocale] ?? Object.values(value)[0] ?? '';
}
