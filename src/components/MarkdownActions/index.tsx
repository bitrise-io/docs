import React, {useEffect, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {
  BitkitLink,
  BitkitLinkButton,
  BitkitProvider,
  IconArrowNortheast,
  IconCheck,
  IconCopy,
} from '@bitrise/bitkit-v2';
import styles from './styles.module.css';

type CopyState = 'idle' | 'copied' | 'failed';

// How long the "Copied" / "Copy failed" label stays before it resets.
const FEEDBACK_MS = 2000;

/** Fetches the Markdown mirror and puts it on the clipboard. */
async function copyMarkdown(href: string): Promise<void> {
  const fetchMarkdown = async (): Promise<string> => {
    const response = await fetch(href);
    // `npm start` falls back to the HTML shell for unknown paths (200 +
    // text/html), because the mirrors only exist in a production build.
    // Copying that would put the page's HTML on the clipboard.
    if (!response.ok || (response.headers.get('content-type') ?? '').includes('text/html')) {
      throw new Error(`No Markdown mirror at ${href}`);
    }
    return response.text();
  };

  // Safari only allows a clipboard write inside the click's user gesture, and
  // the fetch is async. Handing it a promise inside a ClipboardItem keeps the
  // write in the gesture; the plain writeText path is the fallback.
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': fetchMarkdown().then((text) => new Blob([text], {type: 'text/plain'})),
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(await fetchMarkdown());
  }
}

/**
 * Page actions above the title of a doc page: copy the page as Markdown, or
 * open its raw Markdown source.
 *
 * `docusaurus-plugin-llms` writes one `<slug>.md` per page next to the built
 * HTML (see the plugin config in docusaurus.config.ts), so the mirror URL is
 * the page's permalink plus `.md`. `permalink` already carries the locale
 * baseUrl (`/en/...`, `/ja/...`), which is where each locale's mirrors live.
 * The root page (`/en/`) maps to `index.md`.
 *
 * The mirrors only exist in a production build, not under `npm start`.
 * Generated API reference pages have no mirror (`ignoreFiles` in the plugin
 * config), so no actions are rendered for them. Nor are they rendered outside
 * the default locale: the plugin reads `docs/` only, never `i18n/<locale>`, so
 * every non-default mirror is a byte-identical copy of the English one.
 *
 * BitkitProvider wraps the actions locally, as on the portal landing page, so
 * Bitkit's theme doesn't have to be mounted around every doc page.
 */
export default function MarkdownActions(): React.JSX.Element | null {
  const {metadata, frontMatter} = useDoc();
  const {i18n} = useDocusaurusContext();
  const [copyState, setCopyState] = useState<CopyState>('idle');

  useEffect(() => {
    if (copyState === 'idle') {
      return undefined;
    }
    const timer = setTimeout(() => setCopyState('idle'), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copyState]);

  if (
    i18n.currentLocale !== i18n.defaultLocale ||
    frontMatter.api !== undefined ||
    metadata.source.includes('/api-reference/')
  ) {
    return null;
  }

  const permalink = metadata.permalink;
  const href = permalink.endsWith('/') ? `${permalink}index.md` : `${permalink}.md`;

  const copyLabels: Record<CopyState, string> = {
    idle: translate({
      id: 'markdownActions.copy.label',
      message: 'Copy as Markdown',
      description: 'Label of the button above a doc page that copies its Markdown source',
    }),
    copied: translate({
      id: 'markdownActions.copy.copied',
      message: 'Copied',
      description: 'Label of the copy button right after the Markdown was copied',
    }),
    failed: translate({
      id: 'markdownActions.copy.failed',
      message: 'Copy failed',
      description: 'Label of the copy button when the Markdown could not be copied',
    }),
  };

  const handleCopy = () => {
    copyMarkdown(href).then(
      () => setCopyState('copied'),
      () => setCopyState('failed'),
    );
  };

  return (
    <div className={styles.bar}>
      <BitkitProvider>
        <BitkitLinkButton
          onClick={handleCopy}
          suffixIcon={copyState === 'copied' ? IconCheck : IconCopy}
          aria-live="polite"
        >
          {copyLabels[copyState]}
        </BitkitLinkButton>
        <BitkitLink href={href} target="_blank" suffixIcon={IconArrowNortheast}>
          {translate({
            id: 'markdownActions.view.label',
            message: 'View as Markdown',
            description: 'Label of the link above a doc page that opens its raw Markdown source',
          })}
        </BitkitLink>
      </BitkitProvider>
    </div>
  );
}
