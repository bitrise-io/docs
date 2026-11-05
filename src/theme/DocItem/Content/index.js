import React from 'react';
import Content from '@theme-original/DocItem/Content';
import MarkdownActions from '@site/src/components/MarkdownActions';

/**
 * Wrap swizzle of DocItem/Content: renders the Markdown page actions (copy,
 * view) above the page title, then the original content unchanged.
 */
export default function ContentWrapper(props) {
  return (
    <>
      <MarkdownActions />
      <Content {...props} />
    </>
  );
}
