/**
 * i18n helpers.
 *
 * The translation function returned by `useTranslations` never throws and never
 * returns `undefined`: it falls back to the default locale, then to the key
 * itself. A missing translation degrades into English rather than a blank page.
 */

import { DEFAULT_LOCALE, LOCALES, site, type Locale } from '../../site.config';
import { ui, localeLangTags, type UIKey } from './ui';

export { LOCALES, DEFAULT_LOCALE, type Locale };
export { localeNames, localeLangTags } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

/**
 * Extracts the locale from a pathname such as `/id/docs/intro/`.
 * Returns the default locale when the path carries no known prefix.
 */
export function localeFromPath(pathname: string): Locale {
  const [, first] = pathname.replace(/^\/+/, '/').split('/');
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

export function langTag(locale: Locale): string {
  return localeLangTags[locale] ?? locale;
}

/**
 * Returns a translation function for the given locale.
 *
 * Supports `{placeholder}` interpolation:
 *   t('project.pageCount', { count: 12 })  →  "12 pages"
 */
export function useTranslations(locale: Locale) {
  const table = ui[locale] ?? {};
  const fallback = ui[DEFAULT_LOCALE];

  return function t(key: UIKey, vars?: Record<string, string | number>): string {
    const template = table[key] ?? fallback[key] ?? key;
    if (!vars) return template;

    return Object.entries(vars).reduce(
      (out, [name, value]) => out.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

export type TranslateFn = ReturnType<typeof useTranslations>;

/* ---------------------------------------------------------------------------
 * URL building
 *
 * All internal links must go through `localizedPath` so that `site.base` and
 * the locale prefix are applied consistently. Hand-written hrefs break as soon
 * as the template is deployed to a subpath.
 * ------------------------------------------------------------------------- */

const BASE = site.base.replace(/\/+$/, ''); // '' for root, '/my-repo' for subpath

/**
 * Builds an absolute, locale-aware, base-aware path with a trailing slash.
 *
 *   localizedPath('en', 'docs/intro')  →  '/docs/intro/'
 *   localizedPath('id', 'docs/intro')  →  '/id/docs/intro/'
 */
export function localizedPath(locale: Locale, path: string = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const tail = clean ? `/${clean}/` : '/';
  const joined = `${BASE}${prefix}${tail}`;
  return joined.startsWith('/') ? joined : `/${joined}`;
}

/** Path to a documentation page, given its project id and page slug. */
export function docPath(locale: Locale, projectId: string, slug: string): string {
  return localizedPath(locale, `docs/${projectId}/${slug}`);
}

/** Prefixes a static asset (favicon, image) with `site.base`. */
export function asset(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return `${BASE}/${clean}`;
}

/**
 * Given the current pathname, returns the equivalent path in another locale.
 * Used by the language switcher to keep the reader on the same page.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  let rest = pathname;

  if (BASE && rest.startsWith(BASE)) rest = rest.slice(BASE.length);

  const segments = rest.split('/').filter(Boolean);
  if (isLocale(segments[0])) segments.shift();

  return localizedPath(target, segments.join('/'));
}
