/**
 * ============================================================================
 *  UI STRINGS
 * ============================================================================
 *
 * Every piece of text rendered by the theme (not by your content) lives here.
 *
 * To add a language:
 *   1. Add its code to `LOCALES` in `site.config.ts`.
 *   2. Copy the `en` block below, rename the key, and translate the values.
 *   3. TypeScript will tell you if you missed a key.
 *
 * Keys missing from a translation fall back to the default locale, so a
 * partial translation is still safe to ship.
 */

import type { Locale } from '../../site.config';

/** Human-readable names shown in the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

/** Written as `lang` on the `<html>` element, for screen readers and SEO. */
export const localeLangTags: Record<Locale, string> = {
  en: 'en',
  id: 'id',
};

const en = {
  'nav.projects': 'Projects',
  'nav.home': 'Home',
  'nav.backToHub': 'Back to all projects',
  'nav.github': 'View on GitHub',

  'search.button': 'Search anything…',
  'search.label': 'Search',
  'search.placeholder': 'Search pages, guides, references…',
  'search.empty': 'No results found.',
  'search.hintNavigate': 'navigate',
  'search.hintOpen': 'open',
  'search.hintClose': 'close',

  'theme.toggle': 'Toggle theme',
  'locale.switch': 'Change language',

  'menu.open': 'Open menu',
  'menu.close': 'Close menu',
  'menu.title': 'Menu',

  'toc.title': 'On this page',
  'toc.help.title': 'Need help?',
  'toc.help.body': 'Ask in {channel} or open an issue on the repository.',

  'page.previous': 'Previous',
  'page.next': 'Next',
  'page.editThisPage': 'Edit this page',
  'page.lastUpdated': 'Last updated',

  'project.switch': 'Switch project',
  'project.version': 'Version',
  'project.openDocs': 'Open docs',
  'project.pageCount': '{count} pages',
  'project.comingSoon': 'Coming soon',

  'status.stable': 'Stable',
  'status.beta': 'Beta',
  'status.draft': 'Draft',
  'status.deprecated': 'Deprecated',

  'hub.eyebrow': '{count} projects documented',
  'hub.title.line1': 'All your documentation,',
  'hub.title.line2': 'in one place.',
  'hub.subtitle':
    'Pick a project below, or press {shortcut} to jump to any page instantly.',
  'hub.searchPlaceholder': 'Search docs, guides, API references…',
  'hub.sectionTitle': 'All projects',
  'hub.sectionSubtitle': 'Grouped by category',
  'hub.filterAll': 'All',

  'notFound.code': '404',
  'notFound.title': 'Page not found',
  'notFound.body':
    'The page you are looking for may have been moved or never existed. Try searching, or head back to the hub.',
  'notFound.searchCta': 'Search pages…',
  'notFound.toHub': 'Go to hub',
  'notFound.goBack': 'Go back',

  'code.copy': 'Copy',
  'code.copied': 'Copied',

  'callout.note': 'Note',
  'callout.tip': 'Tip',
  'callout.important': 'Important',
  'callout.warning': 'Warning',
  'callout.caution': 'Caution',

  'aside.badgeNew': 'New',
} as const;

/** The shape every translation must satisfy. */
export type UIKey = keyof typeof en;

const id: Partial<Record<UIKey, string>> = {
  'nav.projects': 'Proyek',
  'nav.home': 'Beranda',
  'nav.backToHub': 'Kembali ke semua proyek',
  'nav.github': 'Lihat di GitHub',

  'search.button': 'Cari apa saja…',
  'search.label': 'Cari',
  'search.placeholder': 'Cari halaman, panduan, referensi…',
  'search.empty': 'Tidak ada hasil.',
  'search.hintNavigate': 'navigasi',
  'search.hintOpen': 'buka',
  'search.hintClose': 'tutup',

  'theme.toggle': 'Ganti tema',
  'locale.switch': 'Ganti bahasa',

  'menu.open': 'Buka menu',
  'menu.close': 'Tutup menu',
  'menu.title': 'Menu',

  'toc.title': 'Di halaman ini',
  'toc.help.title': 'Butuh bantuan?',
  'toc.help.body': 'Tanyakan di {channel} atau buat issue di repositori.',

  'page.previous': 'Sebelumnya',
  'page.next': 'Selanjutnya',
  'page.editThisPage': 'Sunting halaman ini',
  'page.lastUpdated': 'Terakhir diperbarui',

  'project.switch': 'Ganti proyek',
  'project.version': 'Versi',
  'project.openDocs': 'Buka dokumentasi',
  'project.pageCount': '{count} halaman',
  'project.comingSoon': 'Segera hadir',

  'status.stable': 'Stabil',
  'status.beta': 'Beta',
  'status.draft': 'Draf',
  'status.deprecated': 'Usang',

  'hub.eyebrow': '{count} proyek terdokumentasi',
  'hub.title.line1': 'Semua dokumentasi,',
  'hub.title.line2': 'satu tempat.',
  'hub.subtitle':
    'Pilih proyek di bawah, atau tekan {shortcut} untuk melompat ke halaman mana pun.',
  'hub.searchPlaceholder': 'Cari dokumentasi, panduan, referensi API…',
  'hub.sectionTitle': 'Semua Proyek',
  'hub.sectionSubtitle': 'Dikelompokkan berdasarkan kategori',
  'hub.filterAll': 'Semua',

  'notFound.code': '404',
  'notFound.title': 'Halaman tidak ditemukan',
  'notFound.body':
    'Halaman yang kamu cari mungkin sudah dipindahkan atau tidak pernah ada. Coba cari, atau kembali ke hub.',
  'notFound.searchCta': 'Cari halaman…',
  'notFound.toHub': 'Ke Hub',
  'notFound.goBack': 'Kembali',

  'code.copy': 'Salin',
  'code.copied': 'Tersalin',

  'callout.note': 'Catatan',
  'callout.tip': 'Tips',
  'callout.important': 'Penting',
  'callout.warning': 'Peringatan',
  'callout.caution': 'Hati-hati',

  'aside.badgeNew': 'Baru',
};

export const ui = { en, id } satisfies Record<Locale, Partial<Record<UIKey, string>>>;
