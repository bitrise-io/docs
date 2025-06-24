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

  return () => {
    subpageHeaders.forEach((header) => {
      header.remove();
    });
  };
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
  return () => {
    homepageDescription.remove();
    homepageCta.remove();
    homepageImage.remove();
  };
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
  return () => {
    newComponents.forEach((header) => {
      header.remove();
    });
  };
};
