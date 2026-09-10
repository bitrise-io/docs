/**
 * Swizzled from @docusaurus/theme-search-algolia's SearchBar (v3.10.2).
 *
 * The only change from the original: the results footer is now always built
 * (not gated behind `searchPagePath`, which this site doesn't configure) and
 * additionally renders an "Ask Fin" action, so it lives inside the search
 * modal in the same spot Algolia's own (unused) native Ask AI row would —
 * see the research behind this in TW-1799. Deliberately not Algolia's `askAi`
 * prop: that talks to Algolia's own hosted AI, a second brain separate from
 * Fin, which is exactly what this button avoids.
 */
import React, {useCallback, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {DocSearchButton} from '@docsearch/react/button';
import {useDocSearchKeyboardEvents} from '@docsearch/react/useDocSearchKeyboardEvents';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useHistory, useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
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

function useResultsFooterComponent({closeModal, searchPagePath}) {
  return useMemo(
    () =>
      ({state}) => (
        <ResultsFooter
          state={state}
          onClose={closeModal}
          searchPagePath={searchPagePath}
        />
      ),
    [closeModal, searchPagePath],
  );
}

function Hit({hit, children}) {
  return <Link to={hit.url}>{children}</Link>;
}

function ResultsFooter({state, onClose, searchPagePath}) {
  const createSearchLink = useSearchLinkCreator();
  return (
    <div className="ask-fin-results-footer">
      {searchPagePath && (
        <Link to={createSearchLink(state.query)} onClick={onClose}>
          <Translate
            id="theme.SearchBar.seeAll"
            values={{count: state.context.nbHits}}>
            {'See all {count} results'}
          </Translate>
        </Link>
      )}
      <button
        id="ask-fin-button"
        type="button"
        className="ask-fin-results-footer__button"
        data-fin-query={state.query}
      >
        <span className="ask-fin-results-footer__icon" aria-hidden="true">✨</span>
        Ask Fin about &ldquo;{state.query}&rdquo;
      </button>
    </div>
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
  const resultsFooterComponent = useResultsFooterComponent({
    closeModal,
    searchPagePath: props.searchPagePath,
  });
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
            resultsFooterComponent={resultsFooterComponent}
            placeholder={currentPlaceholder}
            {...props}
            translations={props.translations?.modal ?? translations.modal}
            searchParameters={searchParameters}
            {...extraAskAiProps}
          />,
          searchContainer.current,
        )}
    </>
  );
}

export default function SearchBar(props) {
  const {siteConfig} = useDocusaurusContext();
  const {pathname} = useLocation();
  const homePath = useBaseUrl('/');

  // The portal page (src/pages/index.tsx) has its own large hero search box
  // that opens this same modal — the navbar bar would just be a redundant
  // second entry point there.
  const isHomepage = pathname === homePath || pathname === homePath.replace(/\/$/, '');
  if (isHomepage) {
    return null;
  }

  const docSearchProps = {
    ...siteConfig.themeConfig.algolia,
    ...props,
  };
  return <DocSearch {...docSearchProps} />;
}
