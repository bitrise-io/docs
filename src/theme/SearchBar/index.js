/**
 * Swizzled from @docusaurus/theme-search-algolia's SearchBar (v3.10.2).
 *
 * Two changes from the original:
 * - Hit() also renders the result's top-level category (hierarchy.lvl0) as
 *   a breadcrumb line, since DocSearch's own default hit template never
 *   shows it per-result — only once, as a group header above a batch of
 *   results in the same category.
 * - DocSearch() appends a persistent "Ask AI" button to .DocSearch-Footer
 *   (the always-visible bar at the bottom of the modal, not the scrollable
 *   results area — DocSearch has no render prop for that bar, so it's
 *   appended by hand via MutationObserver). Clicking it doesn't leave this
 *   modal: AskAiPanel() portals in over the results area and embeds the
 *   site's Vertex AI Search widget inline (google's `alwaysOpened` widget
 *   mode, not the default full-page overlay — see AskAiPanel's own comment
 *   for how it decides between showing just the generated summary or the
 *   whole widget).
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

// .DocSearch-Footer (the bar with the Algolia logo + keyboard hints) is the
// one part of the modal that's outside .DocSearch-Dropdown's scroll area and
// present on every screen (results, no-results, start) — unlike
// resultsFooterComponent, which only renders with hits and scrolls out of
// view with them. There's no render prop for this bar, so this appends the
// "Ask AI" button to it once, by hand, and leaves it there for the modal's
// lifetime. It reads the query straight from .DocSearch-Input at click time
// (via onAskAi), so the button itself never needs updating as the user types.
function useAskAiFooterButton({isOpen, searchContainer, onAskAi}) {
  useEffect(() => {
    if (!isOpen || !searchContainer.current) return undefined;

    const container = searchContainer.current;
    const injectButton = () => {
      const footer = container.querySelector('.DocSearch-Footer');
      if (!footer || footer.querySelector('#ask-ai-trigger')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'ask-ai-trigger';
      button.className = 'ask-ai-footer-button';
      button.textContent = 'Ask AI';
      button.addEventListener('click', () => {
        const query = container.querySelector('.DocSearch-Input')?.value ?? '';
        if (query) onAskAi(query);
      });
      footer.insertBefore(button, footer.querySelector('.DocSearch-Commands'));
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

// Embeds the Vertex AI Search widget inline instead of the full-page
// overlay its triggerId mode normally opens: created here fresh each time
// with the `alwaysOpened` attribute (per Google's docs — "to always show
// the widget without a trigger"), so it renders as a plain in-page panel
// rather than a fixed backdrop+overlay we'd otherwise have no way to
// restyle (its internals are shadow DOM, opaque to our CSS).
//
// Ideal outcome: extract just the generated summary (.summary-container,
// inside ucs-results > ucs-summary's shadow roots — the same nesting the
// old genSearchWidget.ts already relied on) and render it with the site's
// own styling, so it reads as a native part of this modal. The widget stays
// invisible while we wait for that. If no summary shows up within the
// timeout — a real possibility even outside dev, since not every query gets
// a generated answer, not only the local domain-allowlist 403 this was
// actually tested against — the widget itself is revealed instead, so the
// user still gets *something* rather than a dead end.
function AskAiPanel({query, onBack, onFallbackToWidget}) {
  const {siteConfig} = useDocusaurusContext();
  const configId = siteConfig.customFields?.genSearchWidgetConfigId;
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'summary' | 'widget'
  const [summaryHtml, setSummaryHtml] = useState('');

  useEffect(() => {
    if (!configId || !containerRef.current) return undefined;
    let cancelled = false;
    const deadline = Date.now() + 8000;

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
    let reparented = false;

    // No summary materialized in time: the widget's own top-level element
    // is `position: fixed; inset: 0` internally (confirmed live — its
    // "opened" state forces a fullscreen layout regardless of the
    // alwaysOpened attribute, contrary to what Google's own docs implied),
    // so it can't actually be contained inside this panel. Rather than
    // leave a half-visible widget stacked over a now-redundant panel, close
    // the Algolia modal entirely and let the widget's fullscreen view take
    // over on its own — the same shape the old triggerId+overlay flow had,
    // just reached automatically instead of always. Reparent it to <body>
    // first so it survives the modal (and this component) unmounting —
    // otherwise this effect's own cleanup below would remove it the moment
    // onFallbackToWidget closes the modal.
    const revealWidget = () => {
      if (cancelled) return;
      reparented = true;
      document.body.appendChild(widget);
      setStatus('widget');
      onFallbackToWidget();
    };

    const pollForSummary = () => {
      if (cancelled) return;
      const summary = widget.shadowRoot
        ?.querySelector('ucs-results')
        ?.shadowRoot?.querySelector('ucs-summary');
      const summaryContainer = summary?.shadowRoot?.querySelector('.summary-container');
      const stillLoading = summary?.shadowRoot?.querySelector('.loader-container');

      if (summaryContainer && !stillLoading && summaryContainer.innerHTML.trim()) {
        setSummaryHtml(summaryContainer.innerHTML);
        setStatus('summary');
        return;
      }
      if (Date.now() < deadline) setTimeout(pollForSummary, 200);
      else revealWidget();
    };

    const submitQuery = () => {
      if (cancelled) return;
      // ucs-search-bar is a direct child of the widget's own shadow root —
      // a sibling of ucs-results, not nested inside it (confirmed live;
      // easy to get wrong since ucs-summary below *is* nested under
      // ucs-results).
      const searchInput = widget.shadowRoot
        ?.querySelector('ucs-search-bar')
        ?.shadowRoot?.querySelector('input');
      if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', {bubbles: true}));
        searchInput.dispatchEvent(
          new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}),
        );
        pollForSummary();
        return;
      }
      if (Date.now() < deadline) setTimeout(submitQuery, 100);
      else revealWidget();
    };
    setTimeout(submitQuery, 100);

    return () => {
      cancelled = true;
      if (!reparented) widget.remove();
    };
  }, [configId, query]);

  return (
    <div className="ask-ai-panel">
      <button type="button" className="ask-ai-panel__back" onClick={onBack}>
        ← Back to results
      </button>
      {status === 'loading' && (
        <div className="ask-ai-panel__loading">Asking AI…</div>
      )}
      {status === 'summary' && (
        <div
          className="ask-ai-panel__summary"
          // The widget's own generated markup — see the comment above for
          // why this can't come from anywhere other than raw shadow-DOM
          // content pulled out of Google's widget.
          dangerouslySetInnerHTML={{__html: summaryHtml}}
        />
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
  useAskAiFooterButton({isOpen, searchContainer, onAskAi: setAskAiQuery});
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
          <AskAiPanel
            query={askAiQuery}
            onBack={() => setAskAiQuery('')}
            onFallbackToWidget={closeModal}
          />,
          askAiPanelHost,
        )}
    </>
  );
}

export default function SearchBar(props) {
  const {siteConfig} = useDocusaurusContext();
  const docSearchProps = {
    ...siteConfig.themeConfig.algolia,
    ...props,
  };
  return <DocSearch {...docSearchProps} />;
}
