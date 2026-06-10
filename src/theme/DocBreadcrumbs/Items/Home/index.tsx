import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';

const sidebarLabels: Record<string, string> = {
  platformSidebar: 'Bitrise as a Platform',
  ciSidebar: 'Bitrise CI',
  buildCacheSidebar: 'Build Cache',
  releaseManagementSidebar: 'Release Management',
  insightsSidebar: 'Insights',
  buildHubSidebar: 'Build Hub',
};

const sidebarHrefs: Record<string, string> = {
  platformSidebar: '/en/bitrise-platform',
  ciSidebar: '/en/bitrise-ci',
  buildCacheSidebar: '/en/bitrise-build-cache',
  releaseManagementSidebar: '/en/release-management',
  insightsSidebar: '/en/insights',
  buildHubSidebar: '/en/bitrise-build-hub',
};

export default function HomeBreadcrumbItem(): ReactNode {
  const sidebar = useDocsSidebar();
  const label = (sidebar && sidebarLabels[sidebar.name]) || 'Home';
  const href = (sidebar && sidebarHrefs[sidebar.name]) || '/';

  return (
    <li className="breadcrumbs__item">
      <Link className="breadcrumbs__link" href={href}>
        <span>{label}</span>
      </Link>
    </li>
  );
}
