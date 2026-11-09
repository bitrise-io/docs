import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import MarkdownActions from '@site/src/components/MarkdownActions';

/**
 * Ejected from @docusaurus/theme-classic (DocItem/Content, 3.10.x). The only
 * change: the Markdown page actions (copy, view, llms.txt) render directly
 * under the page title.
 *
 * The title is not in the Markdown for most pages. Docusaurus adds it as a
 * "synthetic title" in a <header> above the content, so the actions go right
 * after it. Two kinds of page have no such header, and get no actions:
 *  - the product landing pages (`hide_title: true`, built from ProductOverview)
 *    supply their own layout;
 *  - a page whose Markdown starts with its own `#` heading draws that heading as
 *    part of the content, where there is nothing to hook into. The synced MCP
 *    guides used to be such pages: scripts/sync_mcp_docs.py now drops that
 *    heading, since the title is in the frontmatter. Write new pages the same
 *    way, with the title in the frontmatter only.
 *
 * Compare with the upstream file after a Docusaurus upgrade.
 */
function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <>
          <header>
            <Heading as="h1">{syntheticTitle}</Heading>
          </header>
          <MarkdownActions />
        </>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
