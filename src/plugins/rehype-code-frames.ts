/**
 * Wraps every fenced code block in a language-labelled frame with a copy button.
 *
 * Runs at build time, so Markdown authors get the full UI from plain fences:
 *
 *     ```ts
 *     export const answer = 42;
 *     ```
 *
 * Output shape:
 *
 *     <figure class="code-frame" data-language="ts">
 *       <figcaption>…language…<button data-copy>…</button></figcaption>
 *       <pre class="astro-code">…</pre>
 *     </figure>
 *
 * Shiki runs before user rehype plugins and consumes the raw fence metadata,
 * but keeps `data-language` on `<pre>`. Using that stable attribute avoids a
 * second parser and keeps ordinary Markdown fences portable.
 */

import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

export default function rehypeCodeFrames() {
  return function transform(tree: Root) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;
      if (!parent || index === undefined) return;

      // Skip blocks already wrapped, e.g. on a re-run.
      if (
        parent.type === 'element' &&
        typeof parent.properties?.className === 'object' &&
        Array.isArray(parent.properties.className) &&
        parent.properties.className.includes('code-frame')
      ) {
        return;
      }

      const codeEl = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code',
      );

      const language =
        typeof node.properties?.dataLanguage === 'string'
          ? node.properties.dataLanguage
          : 'text';

      // Defensive cleanup for third-party highlighters that preserve this
      // internal property. Astro's Shiki integration normally removes it.
      if (codeEl?.properties) delete codeEl.properties.metastring;

      const caption: Element = {
        type: 'element',
        tagName: 'figcaption',
        properties: { className: ['code-frame-head'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-frame-dots'], 'aria-hidden': 'true' },
            children: [],
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-frame-title'] },
            children: [{ type: 'text', value: language }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: {
              type: 'button',
              className: ['code-frame-copy'],
              'data-copy': '',
              // Labels are filled in by the client script, which knows the
              // active locale; this is the no-JS fallback.
              'aria-label': 'Copy code',
            },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      };

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: {
          className: ['code-frame'],
          'data-language': language,
        },
        children: [caption, node],
      };

      parent.children[index] = figure;
    });
  };
}
