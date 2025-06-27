import { onReset } from "./reset";

export const renderSidebarSubpageHeaders = () => {
  const subpageHeaders = Array.from(document.querySelectorAll('.nav-site-sidebar > li > a')).map((sidebarSubpageLink) => {
    const newSubpageSidebarHeader = document.createElement('div');
    newSubpageSidebarHeader.className = 'sidebar-subpage-header';
    newSubpageSidebarHeader.innerHTML = `
      <a href="/" class="sidebar-back-link">Back</a>
      <div class="sidebar-heading"><a href="${sidebarSubpageLink.href}">${sidebarSubpageLink.textContent.trim()}</a></div>
    `;
    sidebarSubpageLink.insertAdjacentElement('afterend', newSubpageSidebarHeader);
    return newSubpageSidebarHeader;
  });
  onReset(() => {
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
  onReset(() => {
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
  onReset(() => {
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
  onReset(() => {
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
  onReset(() => {
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
