/**
 * Replaces @docusaurus/theme-classic's navbar color mode toggle with the
 * Light / Dark / System menu used on the Bitrise website.
 *
 * The preference logic mirrors bitrise-website's app/javascript/utils/colorMode.ts:
 * `light` is the default and is stored as no value, `dark` and `system` are
 * stored under `bitkitColorMode`, and `system` follows the OS setting live.
 * Docusaurus's own color mode state (`setColorMode`) does the actual theming,
 * so only the resolved light/dark value ever reaches it.
 */
import React, {useCallback, useEffect, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {useColorMode} from '@docusaurus/theme-common';
import IconCheck from '@site/src/images/icon-check-16px.svg';
import IconModeDark from '@site/src/images/icon-mode-dark-24px.svg';
import IconModeLight from '@site/src/images/icon-mode-light-24px.svg';
import IconModeSystem from '@site/src/images/icon-mode-system-24px.svg';
import useDropdown from '@site/src/components/NavbarDropdown/useDropdown';

import styles from './styles.module.css';

type ColorModePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'bitkitColorMode';

const getPreference = (): ColorModePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Storage blocked: fall back to light.
  }
  return 'light';
};

const storePreference = (preference: ColorModePreference) => {
  try {
    if (preference === 'light') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Storage blocked: the choice applies to this page only.
  }
};

const osQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

const resolve = (preference: ColorModePreference): 'light' | 'dark' =>
  preference === 'system' ? (osQuery().matches ? 'dark' : 'light') : preference;

const OPTIONS: {value: ColorModePreference; Icon: typeof IconModeLight; label: () => string}[] = [
  {
    value: 'system',
    Icon: IconModeSystem,
    label: () => translate({id: 'colorMode.system', message: 'System', description: 'Color mode option that follows the operating system'}),
  },
  {
    value: 'light',
    Icon: IconModeLight,
    label: () => translate({id: 'colorMode.light', message: 'Light', description: 'Light color mode option'}),
  },
  {
    value: 'dark',
    Icon: IconModeDark,
    label: () => translate({id: 'colorMode.dark', message: 'Dark', description: 'Dark color mode option'}),
  },
];

export default function NavbarColorModeToggle(): ReactNode {
  const {setColorMode} = useColorMode();
  const {open, setOpen, rootRef} = useDropdown();
  const [preference, setPreference] = useState<ColorModePreference>('light');

  // Read the stored preference after hydration so the server render matches.
  useEffect(() => {
    setPreference(getPreference());
  }, []);

  // In system mode, follow the OS setting, including changes while the page is open.
  useEffect(() => {
    if (preference !== 'system') {
      return undefined;
    }
    const query = osQuery();
    const apply = () => setColorMode(query.matches ? 'dark' : 'light');
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [preference, setColorMode]);

  const select = useCallback(
    (next: ColorModePreference) => {
      setPreference(next);
      storePreference(next);
      setColorMode(resolve(next));
      setOpen(false);
    },
    [setColorMode, setOpen],
  );

  const current = OPTIONS.find((option) => option.value === preference) ?? OPTIONS[1];
  const CurrentIcon = current.Icon;

  return (
    <div className={styles.colorMode} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={translate({id: 'colorMode.label', message: 'Color mode', description: 'Label of the color mode menu button'})}
        onClick={() => setOpen((value) => !value)}>
        <CurrentIcon width={24} height={24} aria-hidden="true" />
      </button>
      {open && (
        <ul className={styles.menu}>
          {OPTIONS.map(({value, Icon, label}) => {
            const isActive = value === preference;
            return (
              <li key={value}>
                <button
                  type="button"
                  className={isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}
                  aria-pressed={isActive}
                  onClick={() => select(value)}>
                  <Icon width={24} height={24} aria-hidden="true" />
                  <span className={styles.label}>{label()}</span>
                  <span className={styles.check}>{isActive && <IconCheck width={16} height={16} aria-hidden="true" />}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
