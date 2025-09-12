import hljs from '@highlightjs/cdn-assets/es/highlight.js';
import '@highlightjs/cdn-assets/styles/vs2015.css';

import { onReset } from "./reset";


/**
 * 
 * @param {string} language 
 */
export const renderSidebarSubpageHeaders = (language) => {
  const subpageHeaders = Array.from(document.querySelectorAll('.nav-site-sidebar > li > a')).map((sidebarSubpageLink) => {
    const homeButtonLabel = language === 'ja' ? 'ホーム' : 'Home';

    const newSubpageSidebarHeader = document.createElement('div');
    newSubpageSidebarHeader.className = 'sidebar-subpage-header';
    newSubpageSidebarHeader.innerHTML = `
      <a href="/" class="sidebar-back-link">${homeButtonLabel}</a>
      <div class="sidebar-heading"><a href="${sidebarSubpageLink.href}">${sidebarSubpageLink.textContent.trim()}</a></div>
    `;
    sidebarSubpageLink.insertAdjacentElement('afterend', newSubpageSidebarHeader);
    return newSubpageSidebarHeader;
  });

  if (import.meta.webpackHot) onReset(() => {
    subpageHeaders.forEach((header) => {
      header.remove();
    });
  });
};

export const renderIntroContainer = () => {
  const homepageTitleContainer = document.querySelector('div.homepage-title')?.parentNode;
  const homepageDescription = document.createElement("div");
  homepageDescription.className = "homepage-description";
  homepageTitleContainer.appendChild(homepageDescription);
  const homepageCta = document.createElement("div");
  homepageCta.className = "homepage-cta";
  homepageTitleContainer.appendChild(homepageCta);
  const homepageImage = document.createElement("div");
  homepageImage.className = "homepage-image";
  homepageTitleContainer.parentNode.appendChild(homepageImage);
  
  const introContainer = document.querySelector('div.intro-container');
  if (introContainer) {
    Array.from(introContainer.querySelectorAll(':scope > ul.intro-container > li')).forEach((li) => {
      const introDescription = li.querySelector(':scope > p.homepage-intro');
      if (introDescription) {
        homepageDescription.appendChild(introDescription.cloneNode(true));
      }
      const introCta = li.querySelector(':scope > p > a.bitbutton');
      if (introCta) {
        homepageCta.appendChild(introCta.cloneNode(true));
      }
      const introImage = li.querySelector(':scope > .mediaobject img');
      if (introImage) {
        const newIntroImage = introImage.cloneNode(true);
        newIntroImage.className = '';
        homepageImage.appendChild(newIntroImage);
      }
    });
  }

  if (import.meta.webpackHot) onReset(() => {
    homepageDescription.remove();
    homepageCta.remove();
    homepageImage.remove();
  });
};

export const renderHubLinks = () => {
  const newComponents = [];
  let newHubHeader = null;
  Array.from(document.querySelectorAll('.itemizedlist')).forEach((itemizedlist) => {
    if (itemizedlist.classList.contains('explore')) {
      newHubHeader = document.createElement('h2');
      newHubHeader.innerHTML = itemizedlist.textContent.trim();
    }
    if (itemizedlist.classList.contains('index-container')) {
      if (newHubHeader) {
        itemizedlist.querySelector("ul").insertAdjacentElement('beforebegin', newHubHeader);
        newComponents.push(newHubHeader);
        
        const newLinkList = document.createElement('ul');
        Array.from(itemizedlist.querySelectorAll('li')).forEach((li) => {
          const newLinkBox = document.createElement('li');
          const link = li.querySelector('a');
          const para = li.querySelector('p.box-para');
          newLinkBox.innerHTML = `<a href="${link.href}" title="${link.title}">
            <strong>${link.textContent.trim()}</strong>
            <span class="box-para">${para ? para.textContent.trim() : ''}</span>
          </a>`;
          newLinkList.appendChild(newLinkBox);
        });
        newHubHeader.insertAdjacentElement('afterend', newLinkList);
        newComponents.push(newLinkList);

        newHubHeader = null; // Reset for next iteration
      }
    }
  });

  if (import.meta.webpackHot) onReset(() => {
    newComponents.forEach((header) => {
      header.remove();
    });
  });
};

class TabbedContent {
  constructor(tabContainer) {
    this.tabContainer = tabContainer;
    this.tabs = Array.from(tabContainer.querySelectorAll('p.tabs'));
    this.sections = [];
    let next = tabContainer.nextElementSibling;
    while (next && next.classList.contains('tab-content')) {
      this.sections.push(next);
      next = next.nextElementSibling;
    }

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        this.setActiveTabIndex(index);
      });
    });

    this.setActiveTabIndex(0);
  }

  setActiveTabIndex(index) {
    this.activeTabIndex = index;
    this.tabs.forEach((tab, i) => {
      if (i === index) {
        tab.classList.add('is-active');
      } else {
        tab.classList.remove('is-active');
      }
    });
    this.sections.forEach((section, i) => {
      if (i === index) {
        section.classList.add('is-active');
      } else {
        section.classList.remove('is-active');
      }
    });
  }
}

export const renderTabContainers = () => {
  const tabElements = Array.from(document.querySelectorAll('p.tabs'));
  const wrapped = new Set();

  tabElements.forEach((tab, idx) => {
    if (wrapped.has(tab)) return;

    const group = [tab];
    let next = tab.nextElementSibling;

    while (next && next.matches('p.tabs')) {
      group.push(next);
      wrapped.add(next);
      next = next.nextElementSibling;
    }

    if (group.length > 1) {
      const container = document.createElement('div');
      container.className = 'tab-container';
      tab.parentNode.insertBefore(container, group[0]);
      group.forEach(el => container.appendChild(el));
      group.forEach(el => wrapped.add(el));

      const tabbedContent = new TabbedContent(container);
    }
  });

  if (import.meta.webpackHot) onReset(() => {
    document.querySelectorAll('div.tab-container').forEach(container => {
      while (container.firstChild) {
        container.parentNode.insertBefore(container.firstChild, container);
      }
      container.remove();
    });
  });
};

export const renderCodeBlocks = () => {
  Array.from(document.querySelectorAll('.programlisting')).forEach((codeBlock) => {
    const newCodeFragment = document.createFragment = document.createDocumentFragment();

    const originalCode = document.createElement('div');
    originalCode.className = 'original-code' + (codeBlock.className ? ' ' + codeBlock.className : '');
    originalCode.innerHTML = codeBlock.innerHTML;
    newCodeFragment.appendChild(originalCode);

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.classList.add("code-button");
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(originalCode.textContent);
      copyButton.textContent = "Copied!"
      copyButton.parentElement.querySelector('.copy-toast').classList.add('visible');
      setTimeout(function() {
        copyButton.textContent = "Copy";
        copyButton.parentElement.querySelector('.copy-toast').classList.remove('visible');
      },
      2000)
    });
    newCodeFragment.appendChild(copyButton);
    const copyToast = document.createElement("div");
    copyToast.className = "copy-toast";
    copyToast.textContent = "Copied to clipboard";
    newCodeFragment.appendChild(copyToast);

    hljs.highlightElement(codeBlock);
    const newCode = [];
    const codeLines = codeBlock.innerHTML.split('\n');
    codeLines.forEach((line, index) => {
      newCode.push(`<div class="code-line" style="--line-number: '${index + 1}'; --max-line-number-length: ${(codeLines.length + 1).toString().length};"><span>${line}</span></div>`);
    });
    codeBlock.innerHTML = newCode.join('');
    codeBlock.classList.add('code-block');
    if (codeLines.length === 1) {
      codeBlock.classList.add('single-line');
    }

    codeBlock.appendChild(newCodeFragment);
  });

  if (import.meta.webpackHot) onReset(() => {
    Array.from(document.querySelectorAll('.programlisting')).forEach((codeBlock) => {
      const originalCode = codeBlock.querySelector('.original-code');
      if (originalCode) {
        codeBlock.innerHTML = originalCode.innerHTML;
        codeBlock.className = originalCode.className
        codeBlock.classList.remove('original-code');
        delete(codeBlock.dataset.highlighted);
      }
    });
  });
};

export const renderCodeBlocksWithHighlightJs = () => {
  let originalCodeBlocks = [];
  Array.from(document.querySelectorAll('.programlisting')).forEach((codeBlock) => {
    originalCodeBlocks.push(codeBlock.innerHTML);
    hljs.highlightElement(codeBlock);
  });

  if (import.meta.webpackHot) onReset(() => {
    Array.from(document.querySelectorAll('.programlisting')).forEach((codeBlock, index) => {
      codeBlock.innerHTML = originalCodeBlocks[index];
    });
  });
};

export const renderNavbarSearch = () => {
  const navbarHeader = document.querySelector('.navbar-header');
  const searchField = document.createElement('div');
  searchField.className = 'navbar-search';
  searchField.id = 'searchWidgetTrigger';
  searchField.innerHTML = `
    <input type="text" name="q" placeholder="Search all documentation" aria-label="Search" />
  `;
  navbarHeader.insertAdjacentElement('afterend', searchField);

  if (import.meta.webpackHot) onReset(() => {
    searchField.remove();
  });
};

export const detectOverviewContainer = () => {
  const overviewContainer = document.querySelector('aside.section-nav-container');
  if (!overviewContainer) document.querySelector(".site-content").classList.add('no-overview');

  if (import.meta.webpackHot) onReset(() => {
    document.querySelector(".site-content").classList.remove('no-overview');
  });
};

export const updateOverviewContainerPosition = () => {
  const overviewContainer = document.querySelector('aside.section-nav-container');
  if (overviewContainer) {
    const navbarContainer = document.querySelector('.navbar-container');
    const mainSection = document.querySelector('main article#content-wrapper div#topic-content > section');
    const distanceFromSiteContentTop = mainSection.getBoundingClientRect().top - navbarContainer.getBoundingClientRect().height;
    overviewContainer.style.top = `${Math.max(0, distanceFromSiteContentTop)}px`;
  }
};

export const fixContentPager = () => {
  Array.from(document.querySelectorAll("#header-navigation-prev")).forEach((el) => {
    if (el.textContent.trim() === 'Prev') {
      el.textContent = 'Previous';
    }
  });
};

export const selectOpenedSubpage = () => {
  const permalink = window.location.pathname.replace(/\/(en|ja)\//, '');
  window.setTimeout(() => {
    const navSiteSidebar = document.querySelector('.nav-site-sidebar');
    const navItem = navSiteSidebar.querySelector(`a[data-permalink="${permalink}"]`);
    if (navItem) {
      navItem.parentElement.classList.add('active');
      
      let parentElement = navItem.parentElement;
      while (parentElement && parentElement !== navSiteSidebar) {
        if (parentElement.tagName === 'LI') {
          parentElement.classList.add('opened');
        }
        parentElement = parentElement.parentElement;
      }
      
      // If the navItem has no href, redirect to the first child link
      if (!navItem.href) {
        let firstChild = navItem.parentElement.querySelector('a[href]');
        if (firstChild) window.location.href = firstChild.href;
      }
    }
  }, 250);
};

let bannerHeight = '0px';

/**
 * Set the height of the Intercom banner.
 * @param {string} height 
 */
const setBannerHeight = (height) => {
  bannerHeight = height;

  // Render updated styles
  document.querySelector('aside.site-sidebar').style.marginTop = bannerHeight;
  document.querySelector('aside.site-sidebar').style.maxHeight = `calc(100% - ${bannerHeight})`;
  document.querySelector('.site-header-navbar').style.marginTop = bannerHeight;
};

/**
 * Check for the Intercom banner in the DOM mutations and adjust the sidebar and navbar styles accordingly.
 * @param {MutationRecord[]} mutations 
 */
const checkIntercomBanner = (mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      /** @type {HTMLIFrameElement | HTMLButtonElement} */
      const banner = node;
      if (banner.name === 'intercom-banner-frame') {
        const interval = setInterval(() => {
          const computedStyle = window.getComputedStyle(document.body);
          const newHeight = computedStyle.getPropertyValue('margin-top');
          if (newHeight !== bannerHeight) {
            setBannerHeight(newHeight);
          } else if (newHeight !== '0px') {
            clearInterval(interval);
          }
        }, 25);
      }
    });
    mutation.removedNodes.forEach((node) => {
      /** @type {HTMLIFrameElement | HTMLButtonElement} */
      const banner = node;
      if (banner.name === 'intercom-banner-frame') {
        setBannerHeight('0px');
      }
    });
  });
};

/**
 * Initialize the Intercom banner observer to watch for changes in the DOM
 * and adjust the sidebar and navbar styles accordingly.
 */
export const initializeIntercomBannerObserver = () => {
  // Set up observer
  const observer = new MutationObserver(checkIntercomBanner);

  // Observe changes in body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  if (import.meta.webpackHot) onReset(() => {
    observer.disconnect();
  });
};

export const renderNavbarLanguageSwitcher = () => {
  const language = window.location.pathname.match(/\/(en|ja)\//)[1];
  if (!language) return;

  const languageMap = {
    'en': 'EN',
    'ja': '日本語'
  };
  const dropdownContainer = document.createElement('div');
  dropdownContainer.setAttribute('class', 'dropdown-container');
  dropdownContainer.innerHTML = `
    <span>${languageMap[language]}</span>
    <ul class="dropdown-content">
      ${Object.entries(languageMap).map(([lang, langName]) => `
        <li class="lang-option${language === lang ? ' active-lang' : ''}">
          <a href="${window.location.pathname.replace(/\/(en|ja)\//, `/${lang}/`)}" data-lang="${lang}">${langName}</a>
        </li>
      `).join('')}
    </ul>
  `;
  dropdownContainer.addEventListener('click', () => {
    dropdownContainer.querySelector('.dropdown-content').classList.toggle('show');
  });
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.insertBefore(dropdownContainer, navbar.firstChild);
  }

  if (import.meta.webpackHot) onReset(() => {
    dropdownContainer.remove();
  });
};

export const genSearchWidgetFixer = ({ fixedHeight, intervalDelay }) => {
  let genSearchWidget;
  let ucsResults;
  let ucsSummary;
  let ucsSearchBar;
  let loaderContainer;

  window.setInterval(() => {
    if (!genSearchWidget) genSearchWidget = document.querySelector("gen-search-widget");
    if (genSearchWidget) {
      if (!ucsResults) ucsResults = genSearchWidget.shadowRoot?.querySelector("ucs-results");
      if (ucsResults) {
        if (!ucsSummary) ucsSummary = ucsResults.shadowRoot?.querySelector("ucs-summary");
        if (ucsSummary) {
          if (!loaderContainer && ucsSummary.shadowRoot?.querySelector(".loader-container")) {
            console.log('Loading started');
          }
          loaderContainer = ucsSummary.shadowRoot?.querySelector(".loader-container");
          if (loaderContainer) {
            loaderContainer.style.height = `${fixedHeight + 45}px`;
          }
          const summaryContainer = ucsSummary.shadowRoot?.querySelector(".summary-container");
          if (summaryContainer) {
            summaryContainer.style.height = summaryContainer.className.match(/expanded/) ? "auto" : `${fixedHeight}px`;
          }
        }
        if (!ucsSearchBar) ucsSearchBar = genSearchWidget.shadowRoot?.querySelector("ucs-search-bar");
        if (ucsSearchBar) {
          const searchInput = ucsSearchBar.shadowRoot?.querySelector("input");
          if (!searchInput.dataset.handled) {
            searchInput.dataset.handled = 'true';
            searchInput.addEventListener('keyup', (event) => {
              if (event.key === 'Enter' || event.keyCode === 13) {
                console.log('Search triggered by Enter key', searchInput.value);
              }
            });
          }
          searchInput.placeholder = 'Press Enter to search';
        }
      }
    }
  }, intervalDelay);
};
// TEST: genSearchWidgetFixer({ fixedHeight: 300, intervalDelay: 50 });
