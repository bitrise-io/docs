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
    newCodeFragment.appendChild(codeBlock.querySelector('.code-button'));
    const originalCode = document.createElement('div');
    originalCode.className = 'original-code';
    originalCode.innerHTML = codeBlock.innerHTML;
    newCodeFragment.appendChild(originalCode);
    const newCode = [];
    const codeLines = codeBlock.innerHTML.split('\n');
    codeLines.forEach((line, index) => {
      newCode.push(`<div class="code-line" style="--line-number: '${index + 1}'; --max-line-number-length: ${(codeLines.length + 1).toString().length};">${line}</div>`);
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
      const resetCodeFragment = document.createDocumentFragment();
      resetCodeFragment.appendChild(codeBlock.querySelector('.code-button'));
      const originalCode = codeBlock.querySelector('.original-code');
      if (originalCode) {
        codeBlock.innerHTML = originalCode.innerHTML;
      }
      codeBlock.appendChild(resetCodeFragment);
      codeBlock.classList.remove('code-block');
      codeBlock.classList.remove('single-line');
    });
  });
}

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
