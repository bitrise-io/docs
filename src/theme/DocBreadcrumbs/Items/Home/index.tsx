import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';

export default function HomeBreadcrumbItem(): ReactNode {
  const sidebar = useDocsSidebar();
  // translate() runs at render time so it picks up the current locale.
  const sidebarConfig: Record<string, {label: string; href: string}> = {
    platformSidebar: {label: translate({id: 'breadcrumb.hub.platformSidebar', message: 'Bitrise as a Platform', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-platform'},
    ciSidebar: {label: translate({id: 'breadcrumb.hub.ciSidebar', message: 'Bitrise CI', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-ci'},
    buildCacheSidebar: {label: translate({id: 'breadcrumb.hub.buildCacheSidebar', message: 'Build Cache', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-build-cache'},
    releaseManagementSidebar: {label: translate({id: 'breadcrumb.hub.releaseManagementSidebar', message: 'Release Management', description: 'Hub name shown as the first breadcrumb'}), href: '/release-management'},
    insightsSidebar: {label: translate({id: 'breadcrumb.hub.insightsSidebar', message: 'Insights', description: 'Hub name shown as the first breadcrumb'}), href: '/insights'},
    buildHubSidebar: {label: translate({id: 'breadcrumb.hub.buildHubSidebar', message: 'Build Hub', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-build-hub'},
    bitriseAPISidebar: {label: translate({id: 'breadcrumb.hub.bitriseAPISidebar', message: 'Bitrise API', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-api'},
    rdeSidebar: {label: translate({id: 'breadcrumb.hub.rdeSidebar', message: 'Remote Dev Environments', description: 'Hub name shown as the first breadcrumb'}), href: '/bitrise-rde'},
  };
  const config = sidebar && sidebarConfig[sidebar.name];
  const label = config?.label ?? translate({id: 'breadcrumb.home', message: 'Home', description: 'First breadcrumb outside any hub'});
  const href  = config?.href  ?? '/';

  return (
    <li className="breadcrumbs__item">
      <Link className="breadcrumbs__link" href={href}>
        <span>{label}</span>
      </Link>
    </li>
  );
}
