import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false }), mdx()],
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
