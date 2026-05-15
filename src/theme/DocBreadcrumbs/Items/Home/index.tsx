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

export default function HomeBreadcrumbItem(): ReactNode {
  const sidebar = useDocsSidebar();
  const label = (sidebar && sidebarLabels[sidebar.name]) || 'Home';

  return (
    <li className="breadcrumbs__item">
      <Link className="breadcrumbs__link" href="/">
        <span>{label}</span>
      </Link>
    </li>
  );
}
