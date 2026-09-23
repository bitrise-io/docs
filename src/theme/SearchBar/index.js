/**
 * Swizzled from @docusaurus/theme-search-algolia's SearchBar (v3.10.2).
 *
 * Two changes from the original:
 * - Hit() also renders the result's top-level category (hierarchy.lvl0) as
 *   a breadcrumb line, since DocSearch's own default hit template never
 *   shows it per-result — only once, as a group header above a batch of
 *   results in the same category.
 * - DocSearch() appends a persistent "AI Summary" button to .DocSearch-Form
 *   (the search input row itself — DocSearch has no render prop for it, so
 *   it's appended by hand via MutationObserver). Clicking it never leaves
 *   this modal: AskAiPanel() portals in over the results area and pulls
 *   just the generated summary out of a hidden Vertex AI Search widget
 *   instance, so the answer reads as a native part of this modal — see
 *   AskAiPanel's own comment for why the widget itself is never shown.
 * Everything else is untouched stock behavior.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {DocSearchButton} from '@docsearch/react/button';
import {useDocSearchKeyboardEvents} from '@docsearch/react/useDocSearchKeyboardEvents';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import {
  isRegexpStringMatch,
  useSearchLinkCreator,
} from '@docusaurus/theme-common';
import {
  useAlgoliaContextualFacetFilters,
  useSearchResultUrlProcessor,
  useAlgoliaAskAi,
  mergeFacetFilters,
} from '@docusaurus/theme-search-algolia/client';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import translations from '@theme/SearchTranslations';

let DocSearchModal = null;
function importDocSearchModalIfNeeded() {
  if (DocSearchModal) {
    return Promise.resolve();
  }
  return Promise.all([
    import('@docsearch/react/modal'),
    import('@docsearch/react/style'),
    import('./styles.css'),
  ]).then(([{DocSearchModal: Modal}]) => {
    DocSearchModal = Modal;
  });
}

function useNavigator({externalUrlRegex}) {
  const history = useHistory();
  const [navigator] = useState(() => {
    return {
      navigate(params) {
        if (isRegexpStringMatch(externalUrlRegex, params.itemUrl)) {
          window.location.href = params.itemUrl;
        } else {
          history.push(params.itemUrl);
        }
      },
    };
  });
  return navigator;
}

function useTransformSearchClient() {
  const {
    siteMetadata: {docusaurusVersion},
  } = useDocusaurusContext();
  return useCallback(
    (searchClient) => {
      searchClient.addAlgoliaAgent('docusaurus', docusaurusVersion);
      return searchClient;
    },
    [docusaurusVersion],
  );
}

function useTransformItems(props) {
  const processSearchResultUrl = useSearchResultUrlProcessor();
  const [transformItems] = useState(() => {
    return (items) =>
      props.transformItems
        ? props.transformItems(items)
        : items.map((item) => ({
            ...item,
            url: processSearchResultUrl(item.url),
          }));
  });
  return transformItems;
}

function useResultsFooterComponent({closeModal}) {
  return useMemo(
    () =>
      ({state}) =>
        <ResultsFooter state={state} onClose={closeModal} />,
    [closeModal],
  );
}

// .DocSearch-Form (the input row itself, inside .DocSearch-SearchBar) is
// present on every screen (results, no-results, start) for the modal's
// entire lifetime — unlike resultsFooterComponent, which only renders with
// hits. There's no render prop for this row, so this appends the "AI
// Summary" button to it once, by hand, right before the clear/close icons
// (.DocSearch-Actions) — same placement Namespace uses for its own "Ask
// Assistant" button. It reads the query straight from .DocSearch-Input at
// click time (via onAskAi), so the button itself never needs updating as
// the user types.
function useAskAiSearchBarButton({isOpen, searchContainer, onAskAi}) {
  useEffect(() => {
    if (!isOpen || !searchContainer.current) return undefined;

    const container = searchContainer.current;
    const injectButton = () => {
      const form = container.querySelector('.DocSearch-Form');
      const actions = form?.querySelector('.DocSearch-Actions');
      if (!form || !actions || form.querySelector('#ask-ai-trigger')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'ask-ai-trigger';
      button.className = 'ask-ai-searchbar-button';
      // Sparkle icon, same visual role as the "+" in a stock "+ Add
      // trigger"-style secondary button — a small glyph ahead of the label.
      button.innerHTML =
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.54 11.54 4.884 13l3.654 1.46L10 18.115l1.46-3.653L15.115 13l-3.653-1.46L10 7.884zM18 13c0 .604-.368 1.147-.929 1.371L13 16l-1.629 4.071a1.477 1.477 0 0 1-2.696.104l-.046-.104L7 16l-4.071-1.629a1.477 1.477 0 0 1 0-2.742L7 10l1.629-4.071a1.477 1.477 0 0 1 2.742 0L13 10l4.071 1.629c.561.224.929.767.929 1.371M19.813 6.813l-.713 1.78a.646.646 0 0 1-1.157.089l-.043-.088-.712-1.781-1.782-.713a.646.646 0 0 1 0-1.2l1.781-.713.713-1.78a.646.646 0 0 1 1.2 0l.712 1.78 1.782.713a.646.646 0 0 1 0 1.2z"/></svg><span>AI Summary</span>';
      button.addEventListener('click', () => {
        const query = container.querySelector('.DocSearch-Input')?.value ?? '';
        if (query) onAskAi(query);
      });
      form.insertBefore(button, actions);
    };

    injectButton();
    const observer = new MutationObserver(injectButton);
    observer.observe(container, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [isOpen, searchContainer, onAskAi]);
}

// Overlays a host div on top of .DocSearch-Dropdown (same modal, same
// frame) whenever ask-ai mode is active, for AskAiPanel to portal into —
// this is what makes the AI answer feel like part of the same search
// experience instead of a separate page/window.
function useAskAiPanelHost({isOpen, askAiQuery, searchContainer}) {
  const [panelHost, setPanelHost] = useState(null);
  useEffect(() => {
    if (!isOpen || !askAiQuery || !searchContainer.current) {
      setPanelHost(null);
      return undefined;
    }
    const modal = searchContainer.current.querySelector('.DocSearch-Modal');
    if (!modal) return undefined;

    // Belt and suspenders: z-index/position alone should be enough to
    // paint the host above .DocSearch-Dropdown, but in practice a sliver of
    // the dropdown's own content (e.g. its first .DocSearch-Hit-source
    // header) still shows through at the shared boundary — explicitly
    // hiding the dropdown sidesteps that rather than chasing the stacking
    // discrepancy further.
    const dropdown = modal.querySelector('.DocSearch-Dropdown');
    if (dropdown) dropdown.style.visibility = 'hidden';

    const host = document.createElement('div');
    host.className = 'ask-ai-panel-host';
    modal.appendChild(host);
    setPanelHost(host);
    return () => {
      if (dropdown) dropdown.style.visibility = '';
      host.remove();
      setPanelHost(null);
    };
  }, [isOpen, askAiQuery, searchContainer]);
  return panelHost;
}

// Extracts just the generated summary (.summary-container, inside
// ucs-results > ucs-summary's shadow roots — the same nesting the old
// genSearchWidget.ts already relied on) from a hidden Vertex widget
// instance and renders it with the site's own styling, so it reads as a
// native part of this modal — never the widget's own UI. The widget is
// created fresh each time with the `alwaysOpened` attribute so it doesn't
// need a trigger click to start working, but it's kept invisible for its
// entire life here and torn down on unmount either way.
//
// The widget itself is deliberately never shown: its top-level shadow
// element is `position: fixed; inset: 0` internally regardless of
// alwaysOpened (confirmed live, contrary to what Google's docs implied),
// so there's no way to contain it inside this panel — revealing it means
// a jarring, hard-to-dismiss full-page takeover instead of a search
// result. If no summary shows up in time (no generated answer for this
// query, or — the only case reachable in local dev — the widget's domain
// allowlist doesn't cover localhost), this shows a plain "no AI answer"
// message and stays fully inside the modal.

// Same glyph as the "AI Summary" button itself (see its own inline SVG
// string above) — as a real JSX component instead, for the two spots below
// that render through React rather than raw DOM.
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.54 11.54 4.884 13l3.654 1.46L10 18.115l1.46-3.653L15.115 13l-3.653-1.46L10 7.884zM18 13c0 .604-.368 1.147-.929 1.371L13 16l-1.629 4.071a1.477 1.477 0 0 1-2.696.104l-.046-.104L7 16l-4.071-1.629a1.477 1.477 0 0 1 0-2.742L7 10l1.629-4.071a1.477 1.477 0 0 1 2.742 0L13 10l4.071 1.629c.561.224.929.767.929 1.371M19.813 6.813l-.713 1.78a.646.646 0 0 1-1.157.089l-.043-.088-.712-1.781-1.782-.713a.646.646 0 0 1 0-1.2l1.781-.713.713-1.78a.646.646 0 0 1 1.2 0l.712 1.78 1.782.713a.646.646 0 0 1 0 1.2z" />
    </svg>
  );
}

// Cycled while status is 'loading', same idea as the widget's own
// ucs-summary loader (it swaps a single line of text under a fade
// in/out, rather than showing one static label the whole time).
const LOADING_LABELS = ['Generating...', 'Thinking...', 'Preparing...', 'Almost there...'];

function AskAiPanel({query, onBack}) {
  const {siteConfig} = useDocusaurusContext();
  const configId = siteConfig.customFields?.genSearchWidgetConfigId;
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'summary' | 'unavailable'
  const [summaryHtml, setSummaryHtml] = useState('');
  const [loadingLabelIndex, setLoadingLabelIndex] = useState(0);

  useEffect(() => {
    if (status !== 'loading') return undefined;
    const interval = setInterval(() => {
      setLoadingLabelIndex((i) => (i + 1) % LOADING_LABELS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!configId || !containerRef.current) return undefined;

    let cancelled = false;
    // 8s wasn't enough headroom once the double-submit fix below adds its
    // own 500ms delay on top of real generation latency — confirmed live,
    // repeatedly, taking up to ~8s on its own for some queries.
    const deadline = Date.now() + 18000;

    // Hide via the wrapper, not the widget's own inline style: the widget
    // resets its own visibility almost immediately after connecting (part
    // of alwaysOpened's own "opened" state taking effect), so a style we
    // set directly on it gets silently overwritten. Its parent is not
    // something it touches.
    containerRef.current.style.visibility = 'hidden';

    const widget = document.createElement('gen-search-widget');
    widget.setAttribute('configId', configId);
    widget.setAttribute('location', 'us');
    widget.setAttribute('alwaysOpened', '');
    containerRef.current.appendChild(widget);

    const giveUp = () => {
      if (cancelled) return;
      setStatus('unavailable');
    };

    // The actual generated prose lives another three shadow-DOM levels
    // below .summary-container, each just forwarding <slot>s to the next
    // (confirmed live via a working query — .summary-container's own
    // innerHTML is almost entirely chrome: a disclaimer, "Sources"/"Show
    // more" buttons, an icon-font glyph that doesn't render outside the
    // widget's own stylesheet — with an *empty* <ucs-text-streamer> where
    // the text should be, since plain innerHTML can't reach into further
    // shadow roots):
    //   .summary-container
    //     > ucs-text-streamer (light DOM child) .shadowRoot
    //       > ucs-response-markdown (light DOM child) .shadowRoot
    //         > ucs-fast-markdown (light DOM child) .shadowRoot
    //           > .markdown-document  ← the real <p>/<code> markup
    // Citation markers are left out (they're empty <slot>s this deep,
    // fed from even further up the chain) — the prose and its inline
    // code formatting is what actually matters here.
    let lastSnapshot = null;

    // The widget silently ignores a submission attempted too soon after it
    // mounts — confirmed live, repeatedly — but exactly how soon is too
    // soon isn't a clean fixed boundary: it varies run to run (measured
    // anywhere from under 300ms to over 500ms on the same fast connection
    // and machine), so no fixed delay before a single submit attempt can
    // be relied on. Instead, submit early and keep resubmitting on every
    // poll tick for as long as the widget is still visibly stuck in its
    // pre-search "zero-state" — self-correcting regardless of how long
    // the real window turns out to be, rather than gambling on a guess.
    const resubmit = () => {
      const form = widget.shadowRoot
        ?.querySelector('ucs-search-bar')
        ?.shadowRoot?.querySelector('form');
      form?.requestSubmit();
    };

    const pollForSummary = () => {
      if (cancelled) return;
      const resultsRoot = widget.shadowRoot?.querySelector('ucs-results')?.shadowRoot;
      const stillZeroState = resultsRoot?.querySelector('.zero-state');
      const summary = resultsRoot?.querySelector('ucs-summary');
      const summaryContainer = summary?.shadowRoot?.querySelector('.summary-container');
      const stillLoading = summary?.shadowRoot?.querySelector('.loader-container');
      const markdownDocument = summaryContainer
        ?.querySelector('ucs-text-streamer')
        ?.shadowRoot?.querySelector('ucs-response-markdown')
        ?.shadowRoot?.querySelector('ucs-fast-markdown')
        ?.shadowRoot?.querySelector('.markdown-document');
      const snapshot = markdownDocument?.innerHTML.trim();

      // Require two identical snapshots in a row: the content streams in
      // token by token, so a single non-empty read is likely still mid-
      // stream — this is a simple settle check rather than a real
      // "streaming finished" signal, since the widget doesn't expose one.
      if (snapshot && !stillLoading && snapshot === lastSnapshot) {
        // When Vertex can't produce a real summary, it still streams this
        // exact fallback sentence into the same markdown slot as a genuine
        // answer — but its second sentence promises search results that,
        // unlike on the widget's own full page, this panel never shows.
        setSummaryHtml(snapshot.replace(/\s*Here are some search results\.?/i, ''));
        setStatus('summary');
        return;
      }
      lastSnapshot = snapshot || null;
      if (stillZeroState) resubmit();
      if (Date.now() < deadline) setTimeout(pollForSummary, 400);
      else giveUp();
    };

    const submitQuery = () => {
      if (cancelled) return;
      // ucs-search-bar is a direct child of the widget's own shadow root —
      // a sibling of ucs-results, not nested inside it (confirmed live;
      // easy to get wrong since ucs-summary below *is* nested under
      // ucs-results).
      const searchBar = widget.shadowRoot?.querySelector('ucs-search-bar');
      const searchInput = searchBar?.shadowRoot?.querySelector('input');
      const form = searchBar?.shadowRoot?.querySelector('form');
      if (searchInput && form) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', {bubbles: true}));
        // A synthetic Enter keydown on the input is not reliable here —
        // confirmed live: the widget's own state never advanced past its
        // "zero-state" on repeated attempts. Submitting the underlying
        // <form> directly (form.requestSubmit()) is what actually works —
        // this first call may or may not actually register; pollForSummary
        // resubmits on its own until the state confirms it did.
        form.requestSubmit();
        pollForSummary();
        return;
      }
      if (Date.now() < deadline) setTimeout(submitQuery, 100);
      else giveUp();
    };
    setTimeout(submitQuery, 100);

    return () => {
      cancelled = true;
      widget.remove();
    };
  }, [configId, query]);

  return (
    <div className="ask-ai-panel">
      <button type="button" className="ask-ai-panel__back" onClick={onBack}>
        ← Back to results
      </button>
      {status === 'loading' && (
        <div className="ask-ai-panel__loading">
          <div className="ask-ai-panel__loading-label">
            <SparkleIcon />
            <span key={loadingLabelIndex} className="ask-ai-panel__loading-text">
              {LOADING_LABELS[loadingLabelIndex]}
            </span>
          </div>
          <div className="ask-ai-panel__skeleton" aria-hidden="true">
            <div className="ask-ai-panel__skeleton-line" />
            <div className="ask-ai-panel__skeleton-line" />
            <div className="ask-ai-panel__skeleton-line ask-ai-panel__skeleton-line--short" />
          </div>
        </div>
      )}
      {status === 'summary' && (
        <>
          {/* The widget shows this same notice itself, in the chrome we
              deliberately don't extract (see the comment above) — repeated
              here as our own static text instead. */}
          <p className="ask-ai-panel__disclaimer">
            <SparkleIcon />
            <span>
              Generative AI may display inaccurate information, including
              about people, so double-check its responses.
            </span>
          </p>
          <div
            className="ask-ai-panel__summary"
            // The widget's own generated markup — see the comment above for
            // why this can't come from anywhere other than raw shadow-DOM
            // content pulled out of Google's widget.
            dangerouslySetInnerHTML={{__html: summaryHtml}}
          />
        </>
      )}
      {status === 'unavailable' && (
        <div className="ask-ai-panel__unavailable">
          No AI summary is available for this search. Try rephrasing your
          question, or go back and browse the regular results.
        </div>
      )}
      <div ref={containerRef} className="ask-ai-panel__widget-container" />
    </div>
  );
}

function Hit({hit, children}) {
  // lvl0-lvl2 are the page's breadcrumb trail (section/category/subcategory,
  // however many actually exist), lvl3 is the page title itself — see the
  // crawler config's recordExtractor. Always show the full trail through
  // the title, regardless of which deeper level (an h2/h3/etc.) the search
  // actually matched, since this is orienting context, not the match itself.
  const breadcrumb = [
    hit.hierarchy?.lvl0,
    hit.hierarchy?.lvl1,
    hit.hierarchy?.lvl2,
    hit.hierarchy?.lvl3,
  ]
    .filter(Boolean)
    .join(' › ');
  return (
    <Link to={hit.url}>
      {children}
      {breadcrumb && <div className="DocSearch-Hit-breadcrumb">{breadcrumb}</div>}
    </Link>
  );
}

function ResultsFooter({state, onClose}) {
  const createSearchLink = useSearchLinkCreator();
  return (
    <Link to={createSearchLink(state.query)} onClick={onClose}>
      <Translate
        id="theme.SearchBar.seeAll"
        values={{count: state.context.nbHits}}>
        {'See all {count} results'}
      </Translate>
    </Link>
  );
}

function useSearchParameters({contextualSearch, ...props}) {
  const contextualSearchFacetFilters = useAlgoliaContextualFacetFilters();
  const configFacetFilters = props.searchParameters?.facetFilters ?? [];
  const facetFilters = contextualSearch
    ? mergeFacetFilters(contextualSearchFacetFilters, configFacetFilters)
    : configFacetFilters;
  return {
    ...props.searchParameters,
    facetFilters,
  };
}

function DocSearch({externalUrlRegex, ...props}) {
  const navigator = useNavigator({externalUrlRegex});
  const searchParameters = useSearchParameters({...props});
  const transformItems = useTransformItems(props);
  const transformSearchClient = useTransformSearchClient();
  const searchContainer = useRef(null);
  const searchButtonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState(undefined);
  const [askAiQuery, setAskAiQuery] = useState('');
  const {isAskAiActive, currentPlaceholder, onAskAiToggle, extraAskAiProps} =
    useAlgoliaAskAi(props);
  const prepareSearchContainer = useCallback(() => {
    if (!searchContainer.current) {
      const divElement = document.createElement('div');
      searchContainer.current = divElement;
      document.body.insertBefore(divElement, document.body.firstChild);
    }
  }, []);
  const openModal = useCallback(() => {
    prepareSearchContainer();
    importDocSearchModalIfNeeded().then(() => setIsOpen(true));
  }, [prepareSearchContainer]);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    searchButtonRef.current?.focus();
    setInitialQuery(undefined);
    setAskAiQuery('');
    onAskAiToggle(false);
  }, [onAskAiToggle]);
  const closeAskAiPanel = useCallback(() => {
    setAskAiQuery('');
    // "Back to results" unmounts along with the panel, which would drop
    // focus to <body>; put it back on the query so typing and the arrow-key
    // navigation keep working.
    searchContainer.current?.querySelector('.DocSearch-Input')?.focus();
  }, []);
  const handleInput = useCallback(
    (event) => {
      if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      setInitialQuery(event.key);
      openModal();
    },
    [openModal],
  );
  const resultsFooterComponent = useResultsFooterComponent({closeModal});
  useAskAiSearchBarButton({isOpen, searchContainer, onAskAi: setAskAiQuery});
  const askAiPanelHost = useAskAiPanelHost({isOpen, askAiQuery, searchContainer});
  useDocSearchKeyboardEvents({
    isOpen,
    onOpen: openModal,
    onClose: closeModal,
    onInput: handleInput,
    searchButtonRef,
    isAskAiActive: isAskAiActive ?? false,
    onAskAiToggle: onAskAiToggle ?? (() => {}),
  });
  return (
    <>
      <Head>
        <link
          rel="preconnect"
          href={`https://${props.appId}-dsn.algolia.net`}
          crossOrigin="anonymous"
        />
      </Head>

      <DocSearchButton
        onTouchStart={importDocSearchModalIfNeeded}
        onFocus={importDocSearchModalIfNeeded}
        onMouseOver={importDocSearchModalIfNeeded}
        onClick={openModal}
        ref={searchButtonRef}
        translations={props.translations?.button ?? translations.button}
      />

      {isOpen &&
        DocSearchModal &&
        searchContainer.current &&
        createPortal(
          <DocSearchModal
            onClose={closeModal}
            initialScrollY={window.scrollY}
            initialQuery={initialQuery}
            navigator={navigator}
            transformItems={transformItems}
            hitComponent={Hit}
            transformSearchClient={transformSearchClient}
            {...(props.searchPagePath && {
              resultsFooterComponent,
            })}
            placeholder={currentPlaceholder}
            {...props}
            translations={props.translations?.modal ?? translations.modal}
            searchParameters={searchParameters}
            {...extraAskAiProps}
          />,
          searchContainer.current,
        )}

      {askAiPanelHost &&
        createPortal(
          <AskAiPanel query={askAiQuery} onBack={closeAskAiPanel} />,
          askAiPanelHost,
        )}
    </>
  );
}

// Named export for direct, deliberate use (currently just
// /internal-ai-summary-test, which imports this instead of the default) —
// the real thing, unguarded.
export function AlgoliaSearchBar(props) {
  const {siteConfig} = useDocusaurusContext();
  const docSearchProps = {
    ...siteConfig.themeConfig.algolia,
    ...props,
  };
  return <DocSearch {...docSearchProps} />;
}

// The default export is what Docusaurus's own NavbarContent renders into
// every navbar's search slot — unconditionally, the moment a `type:
// 'search'` item exists in themeConfig.navbar.items, with no prop or config
// way to suppress it (confirmed live: removing that navbar item entirely,
// meaning to stop Algolia from rendering on real pages, instead triggered
// theme-classic's OWN fallback — `{!searchBarItem && <NavbarSearch><SearchBar
// /></NavbarSearch>}` in Navbar/Content — which renders this exact same
// component anyway, just via a different path; the old widget's navbar
// search (from src/theme/Navbar) ended up doubled up with it as a result).
// Keeping the navbar item registered avoids that fallback, so this default
// export is deliberately a no-op — the search-engine feature is still only
// reachable via AlgoliaSearchBar's own explicit use on the test page.
export default function SearchBar() {
  return null;
}
