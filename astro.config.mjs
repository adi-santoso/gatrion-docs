// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { site, LOCALES, DEFAULT_LOCALE } from './site.config';
import rehypeCodeFrames from './src/plugins/rehype-code-frames';
import rehypeHeadingAnchors from './src/plugins/rehype-heading-anchors';

export default defineConfig({
  site: site.url,
  base: site.base,

  integrations: [
    mdx(),
    /**
     * `i18n` makes the sitemap emit `xhtml:link` alternates between locales,
     * matching the `hreflang` tags in BaseLayout. `defaultLocale` must be a key
     * of `locales`, and each value is the tag written to the sitemap.
     */
    sitemap({
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(LOCALES.map((locale) => [locale, locale])),
      },
    }),
  ],

  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      // The default locale is served from the root, e.g. `/docs/…` not `/en/docs/…`
      prefixDefaultLocale: false,
    },
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
      wrap: false,
    },
    /**
     * `unified()` is the supported way to extend the pipeline in Astro 7; MDX
     * inherits it automatically.
     *
     * Order matters: heading anchors are added before code blocks are wrapped
     * in their frame, so neither plugin walks the other's output.
     */
    processor: unified({
      rehypePlugins: [rehypeHeadingAnchors, rehypeCodeFrames],
    }),
  },

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
