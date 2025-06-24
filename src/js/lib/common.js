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
