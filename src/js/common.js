import '../css/global.css';

const resetPage = [];


const renderSidebarSubpageHeaders = () => {
  const subpageHeaders = Array.from(document.querySelectorAll('.nav-site-sidebar > li > a')).map((sidebarSubpageLink) => {
    const newSubpageSidebarHeader = document.createElement('div');
    newSubpageSidebarHeader.className = 'sidebar-subpage-header';
    newSubpageSidebarHeader.innerHTML = `
      <a href="/" class="sidebar-back-link">Back</a>
      <h3>${sidebarSubpageLink.textContent.trim()}</h3>
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


const main = async () => {
  console.log('common.js');

  resetPage.push(renderSidebarSubpageHeaders());
  
  // console.log('subpage:', subpage);
  //throw new Error('This is a test error to check error handling in common.js');
};

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    console.log('Hot module replacement is disposing of the current module.');
    resetPage.forEach((reset) => reset && reset());
  });
  import.meta.webpackHot.accept();
  main();
}