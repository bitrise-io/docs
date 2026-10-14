import React from 'react';
import OriginalDocItemPaginator from '@theme-original/DocItem/Paginator';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import SeeAlso from '@site/src/components/SeeAlso';

/**
 * Swizzled to render the auto-generated <SeeAlso> section (src/data/see_also.json)
 * between the article content/footer and the Previous/Next buttons, rather than
 * after them — See also is content the reader should still be in reading mode for,
 * Previous/Next is page-turning chrome that should stay last.
 *
 * Shared by both regular docs (DocItem/Layout) and API reference pages
 * (ApiItem/Layout), but API reference pages are excluded from the embedding
 * corpus (see scripts/generate_see_also.py), so SeeAlso renders nothing there.
 *
 * A page with `see_also: false` in its frontmatter (the changelogs) opts out.
 * The generator already leaves such pages out of see_also.json; this check
 * keeps the section off the page even if the data file is stale.
 */
export default function DocItemPaginator(props) {
  const { metadata, frontMatter } = useDoc();
  return (
    <>
      {frontMatter.see_also !== false && <SeeAlso id={metadata.id} />}
      <OriginalDocItemPaginator {...props} />
    </>
  );
}
