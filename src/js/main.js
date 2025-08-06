import '../css/global.css';
import { 
  renderHubLinks,
  renderIntroContainer,
  renderSidebarSubpageHeaders,
  renderTabContainers,
  renderCodeBlocks,
  renderNavbarSearch,
  detectOverviewContainer,
  updateOverviewContainerPosition,
  fixContentPager,
  initializeIntercomBannerObserver
} from './lib/common';
import { reset } from './lib/reset';
import { addSidebarLinks } from './pages/bitrise-ci';

const redirectToHtml = () => {
  if (window.location.pathname.match(/\/(en|ja)\/index-(en|ja)/)) {
    window.location.pathname = window.location.pathname.replace(/\/(en|ja)\/index-(en|ja).*/, '/');
    return;
  }
  if (!window.location.pathname.match(/(\.html|\/)$/)) {
    window.location.pathname += '.html';
    return;
  }
}

const onScroll = () => {
  updateOverviewContainerPosition();
};

const main = async () => {
  const subpageMatch = window.location.href.match(/\/(en|ja)\/([^\/]+)(\.html|\/)/);
  if (subpageMatch && subpageMatch[2]) {
    const language = subpageMatch[1];
    const subpage = subpageMatch[2];
    const isHub = subpageMatch[3] === '.html';
    // console.log('subpage:', subpage, 'isHub:', isHub, 'language:', language);

    document.querySelector('.site-content').dataset.isHub = isHub ? 'true' : 'false';

    renderSidebarSubpageHeaders(language);

    if (isHub) {
      renderIntroContainer();
      renderHubLinks();
    } else {
      renderTabContainers();
      renderCodeBlocks();
      detectOverviewContainer();
      fixContentPager();
    }

    renderNavbarSearch();

    if (subpage === 'bitrise-ci') {
      addSidebarLinks();
    }
  } else {
     // console.log('subpage:', 'portal');
  }

  initializeIntercomBannerObserver();

  onScroll();
};

redirectToHtml();
window.addEventListener('scroll', onScroll);
window.addEventListener('DOMContentLoaded', main);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  main().catch((error) => {
    console.error('Error:', error);
  });
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('DOMContentLoaded', main);
    reset(); 
  }); 
  import.meta.webpackHot.accept();
}