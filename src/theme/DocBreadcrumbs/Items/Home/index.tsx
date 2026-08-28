import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';

const sidebarConfig: Record<string, {label: string; href: string}> = {
  platformSidebar:          {label: 'Bitrise as a Platform', href: '/bitrise-platform'},
  ciSidebar:                {label: 'Bitrise CI',            href: '/bitrise-ci'},
  buildCacheSidebar:        {label: 'Build Cache',           href: '/bitrise-build-cache'},
  releaseManagementSidebar: {label: 'Release Management',    href: '/release-management'},
  insightsSidebar:          {label: 'Insights',              href: '/insights'},
  buildHubSidebar:          {label: 'Build Hub',             href: '/bitrise-build-hub'},
  bitriseAPISidebar:        {label: 'Bitrise API',           href: '/bitrise-api'},
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
