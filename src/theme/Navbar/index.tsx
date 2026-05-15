import React, {type ReactNode, useEffect, useRef} from 'react';
import Navbar from '@theme-original/Navbar';
import type NavbarType from '@theme/Navbar';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import {createPortal} from 'react-dom';

type Props = WrapperProps<typeof NavbarType>;

function NavbarSearchPortal(): ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    const navbar = document.querySelector('.navbar__inner');
    if (!navbar) return;

    let searchEl = navbar.querySelector('.navbar-search') as HTMLDivElement | null;
    if (!searchEl) {
      searchEl = document.createElement('div');
      searchEl.className = 'navbar-search';
      searchEl.innerHTML = `
        <svg class="navbar-search__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 11.5L14.5 14.5M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input class="navbar-search__input" type="text" placeholder="Search all documentation" id="searchWidgetTrigger" readonly />
      `;
      navbar.insertBefore(searchEl, navbar.querySelector('.navbar__items--right'));
    }

    return () => {
      searchEl?.remove();
    };
  }, []);

  return null;
}

export default function NavbarWrapper(props: Props): ReactNode {
  const {pathname} = useLocation();
  const isDocPage = pathname.startsWith('/en/');

  return (
    <>
      <Navbar {...props} />
      {isDocPage && <NavbarSearchPortal />}
    </>
  );
}
