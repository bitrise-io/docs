import React, {type ReactNode} from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Pages without their own `image` frontmatter get a social card rendered on
// request by the /og Cloudflare Pages Function (functions/og.js), using this
// page's title + description. This keeps every doc page's card in sync with
// its content without committing a PNG per page.
function useGeneratedOgImage(): string {
  const {
    metadata: {title, description},
  } = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const params = new URLSearchParams({
    title,
    description: description || siteConfig.tagline,
  });
  return `/og?${params.toString()}`;
}

export default function DocItemMetadata(): ReactNode {
  const {metadata, frontMatter, assets} = useDoc();
  const generatedImage = useGeneratedOgImage();
  return (
    <PageMetadata
      title={metadata.title}
      description={metadata.description}
      keywords={frontMatter.keywords}
      image={assets.image ?? frontMatter.image ?? generatedImage}
    />
  );
}
