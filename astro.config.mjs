import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    shikiConfig: { theme: 'vitesse-dark' },
    remarkRehypeOptions: { headingIds: true },
    highlight: {
      defaultLang: 'typescript',
      langs: ['bash', 'javascript', 'json', 'typescript', 'css']
    }
  },
  site: 'https://gatrion-docs.local',
  build: { inlineStylesheets: 'auto' }
});
