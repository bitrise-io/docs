import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';
import SidebarIcon from '../SidebarIcon';

import styles from './styles.module.css';

function LinkLabel({label, icon}: {label: string; icon?: string}) {
  return (
    <span title={label} className={styles.linkLabel}>
      <SidebarIcon name={icon} />
      {label}
    </span>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const isNewTab = !!item.customProps?.newTab;
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx(
          'menu__link',
          (!isInternalLink || isNewTab) && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        target={isNewTab ? '_blank' : undefined}
        rel={isNewTab ? 'noopener noreferrer' : undefined}
        {...(isInternalLink && !isNewTab && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <LinkLabel
          label={label}
          icon={item.customProps?.icon as string}
        />
        {isNewTab && <span aria-hidden="true" style={{marginLeft: '4px'}}>↗</span>}
        {!isInternalLink && !isNewTab && <IconExternalLink />}
      </Link>
    </li>
  );
}
