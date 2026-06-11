import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';

const sidebarConfig: Record<string, {label: string; href: string}> = {
  platformSidebar:          {label: 'Bitrise as a Platform', href: '/en/bitrise-platform'},
  ciSidebar:                {label: 'Bitrise CI',            href: '/en/bitrise-ci'},
  buildCacheSidebar:        {label: 'Build Cache',           href: '/en/bitrise-build-cache'},
  releaseManagementSidebar: {label: 'Release Management',    href: '/en/release-management'},
  insightsSidebar:          {label: 'Insights',              href: '/en/insights'},
  buildHubSidebar:          {label: 'Build Hub',             href: '/en/bitrise-build-hub'},
};

export default function HomeBreadcrumbItem(): ReactNode {
  const sidebar = useDocsSidebar();
  const config = sidebar && sidebarConfig[sidebar.name];
  const label = config?.label ?? 'Home';
  const href  = config?.href  ?? '/';

  return (
    <li className="breadcrumbs__item">
      <Link className="breadcrumbs__link" href={href}>
        <span>{label}</span>
      </Link>
    </li>
  );
}
