import React, {useEffect, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import IconArrowNortheast from '@site/src/images/icon-arrow-northeast-16px.svg';
import IconCheck from '@site/src/images/icon-check-16px.svg';
import IconCopy from '@site/src/images/icon-copy-16px.svg';
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
 * Page actions under the title of a doc page: copy the page as Markdown, open
 * its raw Markdown source, or open the `llms.txt` index of the documentation.
 *
 * `docusaurus-plugin-llms` writes one `<slug>.md` per page next to the built
 * HTML (see the plugin config in docusaurus.config.ts), so the mirror URL is
 * the page's permalink plus `.md`. `permalink` already carries the locale
 * baseUrl (`/en/...`, `/ja/...`), which is where each locale's mirrors live.
 * A hub page's permalink ends in a slash, which the mirror name drops
 * (`/en/bitrise-ci/` -> `/en/bitrise-ci.md`).
 *
 * The mirrors only exist in a production build, not under `npm start`.
 * Generated API reference pages have no mirror (`ignoreFiles` in the plugin
 * config), so no actions are rendered for them. Nor are they rendered outside
 * the default locale: the plugin reads `docs/` only, never `i18n/<locale>`, so
 * every non-default mirror is a byte-identical copy of the English one.
 *
 * Plain elements, not Bitkit components. Bitkit components need a
 * BitkitProvider, which injects a global stylesheet: a CSS reset (`ul, ol`
 * lose their bullets) and a light-theme `body` color that is unreadable in
 * dark mode. That is fine on the portal landing page, which is built from
 * Bitkit, but on a doc page it restyles the whole article. The look is Bitkit's
 * small tertiary button, drawn with the Bitkit design tokens that
 * src/css/variables.css already defines, in light and dark mode.
 */
export default function MarkdownActions(): React.JSX.Element | null {
  const {metadata, frontMatter} = useDoc();
  const {i18n, siteConfig} = useDocusaurusContext();
  // `llms.txt` is a static file, copied into every locale's build; resolving it
  // against baseUrl keeps the link working under `npm start` as well.
  const llmsTxtHref = useBaseUrl('/llms.txt');
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
    // `api` is added to the front matter of generated API pages by
    // docusaurus-plugin-openapi-docs, so it is not in Docusaurus's own type.
    (frontMatter as {api?: unknown}).api !== undefined ||
    metadata.source.includes('/api-reference/')
  ) {
    return null;
  }

  // An `index.mdx` page has a permalink with a trailing slash (for example
  // `/en/bitrise-ci/testing/test-reports/test-attachments/`), and its mirror
  // drops the slash (`.../test-attachments.md`). Only a page at the very root
  // of the locale would map to `index.md`.
  const base = siteConfig.baseUrl.replace(/\/+$/, '');
  const path = metadata.permalink.replace(/\/+$/, '');
  const href = path === base ? `${base}/index.md` : `${path}.md`;

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

  const CopyIcon = copyState === 'copied' ? IconCheck : IconCopy;

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.action} onClick={handleCopy} aria-live="polite">
        {copyLabels[copyState]}
        <CopyIcon width={16} height={16} aria-hidden="true" />
      </button>
      <span className={styles.separator} aria-hidden="true" />
      <a className={styles.action} href={href} target="_blank" rel="noopener noreferrer">
        {translate({
          id: 'markdownActions.view.label',
          message: 'View as Markdown',
          description: 'Label of the link above a doc page that opens its raw Markdown source',
        })}
        <IconArrowNortheast width={16} height={16} aria-hidden="true" />
      </a>
      <span className={styles.separator} aria-hidden="true" />
      <a className={styles.action} href={llmsTxtHref} target="_blank" rel="noopener noreferrer">
        {translate({
          id: 'markdownActions.llmsTxt.label',
          message: 'View llms.txt',
          description: 'Label of the link above a doc page that opens the llms.txt index of the documentation',
        })}
        <IconArrowNortheast width={16} height={16} aria-hidden="true" />
      </a>
    </div>
  );
}
