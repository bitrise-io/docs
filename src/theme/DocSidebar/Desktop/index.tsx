/**
 * Swizzled from @docusaurus/theme-classic DocSidebar/Desktop.
 * Adds bottom links (Changelog, Integration Steps, Workflow Recipes) as a
 * sibling of Content so they sit at the foot of the sidebar flex column,
 * outside the scrollable nav area.
 */

import React from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import type {Props} from '@theme/DocSidebar/Desktop';

import styles from './styles.module.css';

const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M2.75 3.5C2.75 2.25736 3.75736 1.25 5 1.25H12.5C12.9142 1.25 13.25 1.58579 13.25 2V13C13.25 13.4142 12.9142 13.75 12.5 13.75H10V12.25H11.75V10.75H5C4.58579 10.75 4.25 11.0858 4.25 11.5C4.25 11.9142 4.58579 12.25 5 12.25V13.75C3.75736 13.75 2.75 12.7426 2.75 11.5V3.5ZM11.75 2.75V9.25H5C4.73702 9.25 4.48458 9.29512 4.25 9.37803V3.5C4.25 3.08579 4.58579 2.75 5 2.75H11.75Z" fill="currentColor"/>
    <path d="M6 15V12H9L9 15L7.5 14.1L6 15Z" fill="currentColor"/>
  </svg>
);

const IconStep = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.24419 1.4409C7.71124 1.16846 8.28876 1.16846 8.75581 1.4409L13.2558 4.0659C13.7166 4.33472 14 4.82807 14 5.36157V10.6385C14 11.172 13.7166 11.6653 13.2558 11.9341L8.75581 14.5591C8.28876 14.8316 7.71124 14.8316 7.24419 14.5591L2.74419 11.9341C2.28337 11.6653 2 11.172 2 10.6385V5.36157C2 4.82807 2.28337 4.33472 2.74419 4.0659L7.24419 1.4409ZM11.777 4.93982L8 2.73657L4.22301 4.93982L8.00001 7L11.777 4.93982ZM3.5 6.25408L3.5 10.6385L7.25 12.826V8.29954L3.5 6.25408ZM8.75 12.826L12.5 10.6385L12.5 6.25409L8.75 8.29955V12.826Z" fill="currentColor"/>
  </svg>
);

const IconWorkflow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.5 7C6.61941 7 7.56698 6.26428 7.88555 5.25H11C12.2426 5.25 13.25 6.25736 13.25 7.5C13.25 8.44951 12.6618 9.26165 11.83 9.59197C11.4666 8.66019 10.5604 8 9.5 8C8.38059 8 7.43302 8.73572 7.11445 9.75H5C2.92893 9.75 1.25 11.4289 1.25 13.5V14H2.75V13.5C2.75 12.2574 3.75736 11.25 5 11.25H7.11445C7.43302 12.2643 8.38059 13 9.5 13C10.6607 13 11.6366 12.2091 11.9182 11.1368C13.5454 10.7272 14.75 9.2543 14.75 7.5C14.75 5.42893 13.0711 3.75 11 3.75H7.88555C7.56698 2.73572 6.61941 2 5.5 2C4.38059 2 3.43302 2.73572 3.11445 3.75H1V5.25H3.11445C3.43302 6.26428 4.38059 7 5.5 7ZM5.5 5.5C6.05228 5.5 6.5 5.05228 6.5 4.5C6.5 3.94772 6.05228 3.5 5.5 3.5C4.94772 3.5 4.5 3.94772 4.5 4.5C4.5 5.05228 4.94772 5.5 5.5 5.5ZM10.5 10.5C10.5 11.0523 10.0523 11.5 9.5 11.5C8.94772 11.5 8.5 11.0523 8.5 10.5C8.5 9.94772 8.94772 9.5 9.5 9.5C10.0523 9.5 10.5 9.94772 10.5 10.5Z" fill="currentColor"/>
  </svg>
);

const IconArrowNE = () => (
  <svg className="sidebar-bottom-link-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M12.9999 3H5V4.5H10.4394L2.46973 12.4697L3.53039 13.5303L11.4999 5.56078V11H12.9999V3Z" fill="currentColor"/>
  </svg>
);

function SidebarBottomLinks({path}: {path: string}) {
  // path is like /en/bitrise-ci/... — segment[2] is the hub dirName
  const dirName = path.split('/')[2] ?? '';
  const isChangelog = path.endsWith('/changelog');

  return (
    <div className="sidebar-bottom-links">
      <a
        href={`/en/${dirName}/changelog`}
        className={`sidebar-bottom-link${isChangelog ? ' sidebar-bottom-link--active' : ''}`}
        aria-current={isChangelog ? 'page' : undefined}
      >
        <IconBook />
        Changelog
      </a>
      <a
        href="https://bitrise.io/integrations"
        className="sidebar-bottom-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconStep />
        Bitrise Integration Steps
        <IconArrowNE />
      </a>
      <a
        href="https://github.com/bitrise-io/workflow-recipes"
        className="sidebar-bottom-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconWorkflow />
        Bitrise Workflow Recipes
        <IconArrowNE />
      </a>
    </div>
  );
}

function DocSidebarDesktop({path, sidebar, onCollapse, isHidden}: Props) {
  const {
    navbar: {hideOnScroll},
    docs: {
      sidebar: {hideable},
    },
  } = useThemeConfig();

  return (
    <div
      className={clsx(
        styles.sidebar,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden,
      )}>
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      <Content path={path} sidebar={sidebar} />
      <SidebarBottomLinks path={path} />
      {hideable && <CollapseButton onClick={onCollapse} />}
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
