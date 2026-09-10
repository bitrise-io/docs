/**
 * Swizzled from @docusaurus/theme-classic's LocaleDropdownNavbarItem.
 *
 * The only change from the original: renders every locale as its own button
 * in a segmented pill (EN / JP), the active one highlighted, instead of a
 * "English ▾" dropdown. The link-computation logic (useLocaleDropdownUtils)
 * is untouched, copied verbatim from the stock component.
 */
import React, {type ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAlternatePageUtils} from '@docusaurus/theme-common/internal';
import {mergeSearchStrings, useHistorySelector} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/NavbarItem/LocaleDropdownNavbarItem';

import styles from './styles.module.css';

// Country-style short codes to match the requested design, rather than
// strict ISO 639-1 language codes (which would show "JA" for Japanese).
const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  ja: 'JP',
};

function useLocaleDropdownUtils() {
  const {
    siteConfig,
    i18n: {localeConfigs},
  } = useDocusaurusContext();
  const alternatePageUtils = useAlternatePageUtils();
  const search = useHistorySelector((history) => history.location.search);
  const hash = useHistorySelector((history) => history.location.hash);

  const getLocaleConfig = (locale: string) => {
    const localeConfig = localeConfigs[locale];
    if (!localeConfig) {
      throw new Error(
        `Docusaurus bug, no locale config found for locale=${locale}`,
      );
    }
    return localeConfig;
  };

  const getBaseURLForLocale = (locale: string) => {
    const localeConfig = getLocaleConfig(locale);
    const isSameDomain = localeConfig.url === siteConfig.url;
    if (isSameDomain) {
      // Shorter paths if localized sites are hosted on the same domain
      // This reduces HTML size a bit
      return `pathname://${alternatePageUtils.createUrl({
        locale,
        fullyQualified: false,
      })}`;
    }
    return alternatePageUtils.createUrl({locale, fullyQualified: true});
  };

  return {
    getURL: (locale: string, options: {queryString: string | undefined}) => {
      const finalSearch = mergeSearchStrings(
        [search, options.queryString],
        'append',
      );
      return `${getBaseURLForLocale(locale)}${finalSearch}${hash}`;
    },
  };
}

export default function LocaleDropdownNavbarItem({
  queryString,
}: Props): ReactNode {
  const utils = useLocaleDropdownUtils();
  const {
    i18n: {currentLocale, locales},
  } = useDocusaurusContext();

  return (
    <div className={styles.localeSwitcher}>
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <Link
            key={locale}
            to={utils.getURL(locale, {queryString})}
            target="_self"
            autoAddBaseUrl={false}
            className={
              isActive
                ? `${styles.localeSwitcherItem} ${styles.localeSwitcherItemActive}`
                : styles.localeSwitcherItem
            }>
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
