/**
 * Turns every `h2`/`h3`/`h4` into a self-linking heading.
 *
 * Authors write plain Markdown (`## Installation`) and get:
 *
 *   <h2 id="installation">
 *     Installation<a class="heading-anchor" href="#installation" …></a>
 *   </h2>
 *
 * Two constraints shape this implementation:
 *
 * 1. Astro assigns heading ids with `rehypeHeadingIds`, which runs *after* user
 *    rehype plugins — so ids do not exist yet at this point. We run it
 *    ourselves first. It is idempotent (it only assigns a missing id), so
 *    Astro's later pass is a no-op and its exported `headings` array stays
 *    authoritative for the table of contents.
 *
 * 2. The anchor carries **no text child**. When collecting heading text,
 *    `rehypeHeadingIds` returns early on element nodes but does not return
 *    `SKIP`, so traversal still descends into their children. In `.mdx` files
 *    every descendant text node is collected, so an `<a>#</a>` child would make
 *    the ToC label read "Installation#". The glyph is supplied by CSS
 *    (`.heading-anchor::before`) instead, which also makes it correctly
 *    decorative. A `raw` node is not an option either: MDX compiles to JSX and
 *    rejects `raw` outright.
 */

import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { VFile } from 'vfile';

const TARGETS = new Set(['h2', 'h3', 'h4']);

export default function rehypeHeadingAnchors() {
  // This built-in plugin is synchronous. Unified's general `Transformer`
  // type also allows callback-style transforms, which makes a direct call look
  // optional to TypeScript; narrow it to the concrete implementation we use.
  const assignIds = rehypeHeadingIds() as (tree: Root, file: VFile) => void;

  return function transform(tree: Root, file: VFile) {
    assignIds(tree, file);

    visit(tree, 'element', (node: Element) => {
      if (!TARGETS.has(node.tagName)) return;

      const id = node.properties?.id;
      if (typeof id !== 'string' || id.length === 0) return;

      // Leave headings that already carry an anchor untouched.
      const hasAnchor = node.children.some(
        (child) =>
          child.type === 'element' &&
          child.tagName === 'a' &&
          Array.isArray(child.properties?.className) &&
          child.properties.className.includes('heading-anchor'),
      );
      if (hasAnchor) return;

      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['heading-anchor'],
          href: `#${id}`,
          'aria-hidden': 'true',
          tabindex: '-1',
        },
        // Intentionally empty — see note 2 above.
        children: [],
      });
    });
  };
}
