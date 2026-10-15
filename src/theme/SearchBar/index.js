/**
 * Swizzled from @docusaurus/theme-search-algolia's SearchBar. package.json pins
 * @docusaurus/theme-search-algolia (3.10.1) and @docsearch/react (4.6.3) to the
 * versions this file was checked against: it relies on the modal's props and
 * hooks, so update both together and re-check it.
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
import {
  FAILURE,
  classifyStall,
  createSettleDetector,
  isFallbackAnswer,
  reportAskAi,
  stripFallbackMarker,
} from './askAiHelpers';
import {hitBreadcrumb} from './hitBreadcrumb';
import {sanitizeSummary} from './sanitizeSummary';
import {cacheSummary, getCachedSummary} from './summaryCache';
import {loadWidgetScript} from './widgetScript';

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

let warnedUnconfigured = false;

// .DocSearch-Form (the input row itself, inside .DocSearch-SearchBar) is
// present on every screen (results, no-results, start) for the modal's
// entire lifetime — unlike resultsFooterComponent, which only renders with
// hits. There's no render prop for this row, so this appends the "AI
// Summary" button to it once, by hand, right before the clear/close icons
// (.DocSearch-Actions) — same placement Namespace uses for its own "Ask
// Assistant" button. It reads the query straight from .DocSearch-Input at
// click time (via onAskAi), so the button itself never needs updating as
// the user types.
function useAskAiSearchBarButton({isOpen, enabled, searchContainer, onAskAi}) {
  useEffect(() => {
    if (!isOpen || !searchContainer.current) return undefined;
    if (!enabled) {
      // No GEN_SEARCH_WIDGET_ID in this build: AskAiPanel would have nothing
      // to query, so don't offer the button at all.
      if (process.env.NODE_ENV !== 'production' && !warnedUnconfigured) {
        warnedUnconfigured = true;
        console.warn(
          '[SearchBar] GEN_SEARCH_WIDGET_ID is not set — the "AI Summary" button is hidden.',
        );
      }
      return undefined;
    }

    const container = searchContainer.current;
    const injectButton = () => {
      const form = container.querySelector('.DocSearch-Form');
      const actions = form?.querySelector('.DocSearch-Actions');
      if (!form || !actions || form.querySelector('#ask-ai-trigger')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'ask-ai-trigger';
      button.className = 'ask-ai-searchbar-button';
      // The visible label is hidden on narrow viewports (see custom.css), so
      // the name has to live on the button itself.
      button.setAttribute('aria-label', 'AI Summary');
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
    // discrepancy further. Done with a class on our own container (see
    // custom.css), not an inline style on the dropdown: DocSearch re-renders
    // and can replace that element, which would silently undo the hiding.
    const container = searchContainer.current;
    container.classList.add('ask-ai-active');

    const host = document.createElement('div');
    host.className = 'ask-ai-panel-host';
    modal.appendChild(host);
    setPanelHost(host);
    return () => {
      container.classList.remove('ask-ai-active');
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

function AskAiPanel({query, onBack, onNavigate}) {
  const {siteConfig, i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale;
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
    // A summary already finished for this query: show it, no widget needed.
    const cached = getCachedSummary(locale, query);
    if (cached !== undefined) {
      setSummaryHtml(cached);
      setStatus('summary');
      return undefined;
    }
    if (!containerRef.current) return undefined;
    if (!configId) {
      // Not reachable while the button is only injected when configured (see
      // useAskAiSearchBarButton) — but never leave the loading state up forever.
      setStatus('unavailable');
      return undefined;
    }

    let cancelled = false;
    // How long submitQuery below keeps looking for the widget's own form
    // before giving up (the widget mounts lazily, after its script loads).
    // Starts counting once the script itself has loaded (see loadWidgetScript).
    let deadline = 0;
    // Once submitted, the wait is bounded by progress instead of a fixed
    // clock: generation alone takes up to ~8s for some queries (confirmed
    // live), and the widget then reveals the text with a typewriter
    // animation (~9s regardless of length in local measurements), so a
    // flat 18s deadline was showing "no AI summary" while the answer was
    // still streaming in. "Progress" is the widget visibly working — its
    // loader showing, or the streamed text having changed since the last
    // poll. Background tabs get throttled timers (this poll and the
    // widget's streaming both slow to ~1/s), so hidden time counts toward
    // neither budget; the answer is picked up on the next poll after the
    // tab is visible again.
    const STALL_MS = 18000; // give up after this long without progress...
    const MAX_VISIBLE_MS = 90000; // ...or after this much visible time in total
    // The answer counts as finished once the text has stayed unchanged this
    // long (see createSettleDetector).
    const SETTLE_MS = 1500;
    let visibleMs = 0;
    let stalledMs = 0;
    let lastPollAt = Date.now();

    // Hide via the wrapper, not the widget's own inline style: the widget
    // resets its own visibility almost immediately after connecting (part
    // of alwaysOpened's own "opened" state taking effect), so a style we
    // set directly on it gets silently overwritten. Its parent is not
    // something it touches.
    containerRef.current.style.visibility = 'hidden';

    // Created by start() below, once Google's script has loaded.
    let widget = null;

    // Every way this ends in "no summary" is reported with its reason (see
    // FAILURE in askAiHelpers): a rise in markup_changed means Google changed
    // the widget's internals, not that there was nothing to say.
    const giveUp = (reason) => {
      if (cancelled) return;
      reportAskAi('ask_ai_unavailable', {ask_ai_reason: reason, ask_ai_locale: locale});
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
    const settle = createSettleDetector(SETTLE_MS);
    // What the polls have seen, so that giving up can say why (classifyStall).
    let sawSummaryContainer = false;
    let sawMarkdown = false;
    let lastStillZeroState = false;

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
      const snapshot = markdownDocument?.innerHTML.trim() || null;

      sawSummaryContainer ||= Boolean(summaryContainer);
      sawMarkdown ||= Boolean(markdownDocument);
      lastStillZeroState = Boolean(stillZeroState);

      const now = Date.now();
      // Finished once the text has stayed the same for SETTLE_MS: the widget
      // doesn't say when it is done, and the text arrives in bursts, so two
      // equal reads in a row can be a pause, not the end.
      if (settle.observe(stillLoading ? null : snapshot, now)) {
        if (isFallbackAnswer(snapshot)) {
          // Vertex's "no summary" sentence: not an answer, and not cached.
          giveUp(FAILURE.fallbackAnswer);
          return;
        }
        // Rebuilt from an allow-list before it is stored, cached or rendered:
        // this is third-party output, see sanitizeSummary.
        const finished = sanitizeSummary(stripFallbackMarker(snapshot), {
          origin: window.location.origin,
          siteOrigin: siteConfig.url,
          baseUrl: siteConfig.baseUrl,
        });
        cacheSummary(locale, query, finished);
        setSummaryHtml(finished);
        setStatus('summary');
        reportAskAi('ask_ai_summary_shown', {ask_ai_locale: locale});
        return;
      }
      const progressed = Boolean(stillLoading) || snapshot !== lastSnapshot;
      lastSnapshot = snapshot;
      if (stillZeroState) resubmit();

      if (document.visibilityState === 'visible') {
        visibleMs += now - lastPollAt;
        stalledMs = progressed ? 0 : stalledMs + (now - lastPollAt);
      }
      lastPollAt = now;
      if (stalledMs < STALL_MS && visibleMs < MAX_VISIBLE_MS) {
        setTimeout(pollForSummary, 400);
      } else {
        giveUp(classifyStall({sawSummaryContainer, sawMarkdown, lastStillZeroState}));
      }
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
      else {
        giveUp(
          window.customElements?.get('gen-search-widget')
            ? FAILURE.widgetNotRendered
            : FAILURE.widgetNotDefined,
        );
      }
    };

    // The widget is a full-screen element we never show. If it locks page
    // scrolling or takes focus while it exists, undo that when it goes, so
    // closing or leaving the panel can't leave the page stuck.
    let restoreFromWidget = null;

    const start = () => {
      if (cancelled || !containerRef.current) return;
      const {body, documentElement: html} = document;
      const bodyOverflow = body.style.overflow;
      const htmlOverflow = html.style.overflow;
      const previouslyFocused = document.activeElement;
      restoreFromWidget = () => {
        if (body.style.overflow !== bodyOverflow) body.style.overflow = bodyOverflow;
        if (html.style.overflow !== htmlOverflow) html.style.overflow = htmlOverflow;
        const active = document.activeElement;
        if ((!active || active === body) && previouslyFocused !== body && previouslyFocused?.isConnected) {
          previouslyFocused.focus?.({preventScroll: true});
        }
      };
      widget = document.createElement('gen-search-widget');
      widget.setAttribute('configId', configId);
      widget.setAttribute('location', 'us');
      widget.setAttribute('alwaysOpened', '');
      containerRef.current.appendChild(widget);
      deadline = Date.now() + 18000;
      setTimeout(submitQuery, 100);
    };
    // The modal already started loading the script as it opened, so this is
    // normally instant; it also covers the script failing or being held back.
    loadWidgetScript().then(start, () => giveUp(FAILURE.scriptFailed));

    return () => {
      cancelled = true;
      widget?.remove();
      restoreFromWidget?.();
    };
  }, [configId, locale, query, siteConfig.url, siteConfig.baseUrl]);

  // Links inside the summary that point at this site (marked by
  // sanitizeSummary) navigate within the app and close the modal, like picking
  // a normal search result, instead of reloading the page underneath it.
  // Modified clicks (new tab, new window) keep their default behavior.
  const handleSummaryClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[data-ask-ai-internal]');
    if (!link) return;
    event.preventDefault();
    onNavigate(link.getAttribute('href'));
  };

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
            onClick={handleSummaryClick}
            // The widget's generated markup, after sanitizeSummary: see the
            // comment above for why it can't come from anywhere other than
            // raw shadow-DOM content pulled out of Google's widget.
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
  // DocSearch prints the matched text as the result's title; this adds the
  // trail of ancestors under it (see hitBreadcrumb). Its own path line, which
  // would repeat the page title, is hidden in custom.css.
  const breadcrumb = hitBreadcrumb(hit).join(' › ');
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
  const {siteConfig} = useDocusaurusContext();
  const askAiEnabled = Boolean(siteConfig.customFields?.genSearchWidgetConfigId);
  const navigator = useNavigator({externalUrlRegex});
  const history = useHistory();
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
  const navigateFromSummary = useCallback(
    (path) => {
      closeModal();
      history.push(path);
    },
    [closeModal, history],
  );
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
  useAskAiSearchBarButton({
    isOpen,
    enabled: askAiEnabled,
    searchContainer,
    onAskAi: setAskAiQuery,
  });
  const askAiPanelHost = useAskAiPanelHost({isOpen, askAiQuery, searchContainer});
  // The search box stays usable while a summary is showing. Typing something
  // else would leave the answer to the old query sitting over the results, so
  // go back to the results instead. Listens on our container rather than on
  // the input itself, so it survives DocSearch re-rendering the input.
  useEffect(() => {
    const container = searchContainer.current;
    if (!isOpen || !askAiQuery || !container) return undefined;
    const onInput = (event) => {
      if (!event.target.matches?.('.DocSearch-Input')) return;
      if (event.target.value.trim() !== askAiQuery.trim()) setAskAiQuery('');
    };
    container.addEventListener('input', onInput);
    return () => container.removeEventListener('input', onInput);
  }, [isOpen, askAiQuery]);
  // Start fetching Google's widget script as the modal opens, so it is ready
  // by the time "AI Summary" is clicked. Nothing loads for visitors who never
  // open search. A failure here is not reported: the panel retries it.
  useEffect(() => {
    if (isOpen && askAiEnabled) loadWidgetScript().catch(() => {});
  }, [isOpen, askAiEnabled]);
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
            onBack={closeAskAiPanel}
            onNavigate={navigateFromSummary}
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
