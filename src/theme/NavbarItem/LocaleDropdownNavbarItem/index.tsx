/**
 * Swizzled from @docusaurus/theme-classic's LocaleDropdownNavbarItem.
 *
 * The only change from the original: the trigger is a globe icon button
 * instead of a "English ▾" label, and the menu lists each locale with a check
 * on the active one. The link-computation logic (useLocaleDropdownUtils)
 * is untouched, copied verbatim from the stock component.
 */
import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAlternatePageUtils} from '@docusaurus/theme-common/internal';
import {mergeSearchStrings, useHistorySelector} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import type {Props} from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import IconCheck from '@site/src/images/icon-check-16px.svg';
import IconGlobe from '@site/src/images/icon-globe-24px.svg';

import styles from './styles.module.css';

// Country-style short codes shown next to the globe, rather than strict
// ISO 639-1 language codes (which would show "JA" for Japanese).
const LOCALE_CODES: Record<string, string> = {
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
    i18n: {currentLocale, locales, localeConfigs},
  } = useDocusaurusContext();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.localeSwitcher} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={translate({
          id: 'theme.navbar.mobileLanguageDropdown.label',
          message: 'Languages',
          description: 'The label for the mobile language switcher dropdown',
        })}
        onClick={() => setOpen((value) => !value)}>
        <IconGlobe width={24} height={24} aria-hidden="true" />
        <span className={styles.code}>
          {LOCALE_CODES[currentLocale] ?? currentLocale.toUpperCase()}
        </span>
      </button>
      {open && (
        <ul className={styles.menu}>
          {locales.map((locale) => {
            const isActive = locale === currentLocale;
            return (
              <li key={locale}>
                <Link
                  to={utils.getURL(locale, {queryString})}
                  target="_self"
                  autoAddBaseUrl={false}
                  lang={localeConfigs[locale]?.htmlLang}
                  aria-current={isActive ? 'true' : undefined}
                  className={
                    isActive
                      ? `${styles.menuItem} ${styles.menuItemActive}`
                      : styles.menuItem
                  }>
                  <span className={styles.check}>
                    {isActive && <IconCheck width={16} height={16} aria-hidden="true" />}
                  </span>
                  {localeConfigs[locale]?.label ?? locale}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
