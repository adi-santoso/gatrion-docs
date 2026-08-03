import type { APIRoute } from 'astro';
import { site } from '../../site.config';

export const prerender = true;

/** Generated from site.config.ts so the sitemap URL has one source of truth. */
export const GET: APIRoute = () => {
  const sitemap = new URL('sitemap-index.xml', `${site.url}/`).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
