/**
 * Navbar dropdown that jumps between Bitrise hubs without a round trip to the
 * portal page. The trigger shows the hub the reader is in; the menu lists every
 * hub with a check on the current one. The URL is the source of truth: the
 * current hub is derived from the first path segment.
 */
import React, {type ComponentType, type ReactNode, type SVGProps} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {translate} from '@docusaurus/Translate';
import IconCheck from '@site/src/images/icon-check-16px.svg';
import IconChevronDown from '@site/src/images/icon-chevron-down-16px.svg';
import IconBuildCache from '@site/src/images/icon-build-cache-16px.svg';
import IconCi from '@site/src/images/icon-ci-16px.svg';
import IconCpu from '@site/src/images/icon-cpu-16px.svg';
import IconDashboard from '@site/src/images/icon-dashboard-16px.svg';
import IconInsights from '@site/src/images/icon-insights-16px.svg';
import IconRelease from '@site/src/images/icon-release-16px.svg';
import IconRemoteAccess from '@site/src/images/icon-remote-access-16px.svg';
import useDropdown from '@site/src/components/NavbarDropdown/useDropdown';

import styles from './styles.module.css';

type Hub = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Extra first path segments that belong to this hub (its API reference). */
  alsoMatches?: string[];
};

// Same icons as the portal cards (src/pages/index.tsx).
const HUBS: Hub[] = [
  {id: 'bitrise-platform', href: '/bitrise-platform', icon: IconDashboard, label: translate({id: 'portal.bitrise-platform.title', message: 'Bitrise as a Platform'})},
  {id: 'bitrise-ci', href: '/bitrise-ci', icon: IconCi, alsoMatches: ['bitrise-api'], label: translate({id: 'portal.bitrise-ci.title', message: 'Bitrise CI'})},
  {id: 'bitrise-build-cache', href: '/bitrise-build-cache', icon: IconBuildCache, label: translate({id: 'portal.bitrise-build-cache.title', message: 'Build Cache'})},
  {id: 'release-management', href: '/release-management', icon: IconRelease, alsoMatches: ['release-management-api'], label: translate({id: 'portal.release-management.title', message: 'Release Management'})},
  {id: 'insights', href: '/insights', icon: IconInsights, alsoMatches: ['insights-api'], label: translate({id: 'portal.insights.title', message: 'Insights'})},
  {id: 'bitrise-build-hub', href: '/bitrise-build-hub', icon: IconCpu, label: translate({id: 'portal.bitrise-build-hub.title', message: 'Build Hub'})},
  {id: 'bitrise-rde', href: '/bitrise-rde', icon: IconRemoteAccess, alsoMatches: ['bitrise-rde-api'], label: translate({id: 'portal.bitrise-rde.title', message: 'Remote Dev Environments'})},
];

function useCurrentHub(): Hub | undefined {
  const {pathname} = useLocation();
  const baseUrl = useBaseUrl('/');
  const path = pathname.startsWith(baseUrl) ? pathname.slice(baseUrl.length) : pathname.replace(/^\//, '');
  const segment = path.split('/')[0];
  return HUBS.find((hub) => hub.id === segment || hub.alsoMatches?.includes(segment));
}

export default function HubSwitcher(): ReactNode {
  const current = useCurrentHub();
  const {open, setOpen, rootRef} = useDropdown();
  const fallback = translate({id: 'hubSwitcher.fallback', message: 'All hubs'});
  const CurrentIcon = current?.icon;

  return (
    <div className={`${styles.hubSwitcher} hub-switcher`} ref={rootRef}>
      <button
        type="button"
        className={CurrentIcon ? `${styles.trigger} ${styles.triggerWithIcon}` : styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={current?.label ?? fallback}
        onClick={() => setOpen((value) => !value)}>
        {CurrentIcon && <CurrentIcon width={16} height={16} aria-hidden="true" className={styles.hubIcon} />}
        <span className={styles.label}>{current?.label ?? fallback}</span>
        <IconChevronDown width={16} height={16} aria-hidden="true" className={open ? styles.chevronOpen : undefined} />
      </button>
      {open && (
        <ul className={styles.menu}>
          {HUBS.map((hub) => {
            const isActive = hub.id === current?.id;
            const HubIcon = hub.icon;
            return (
              <li key={hub.id}>
                <Link
                  to={hub.href}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                  className={isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                  <HubIcon width={16} height={16} aria-hidden="true" className={styles.hubIcon} />
                  <span className={styles.itemLabel}>{hub.label}</span>
                  <span className={styles.check}>
                    {isActive && <IconCheck width={16} height={16} aria-hidden="true" />}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
