import '../css/global.css';
import { renderHubLinks, renderIntroContainer, renderSidebarSubpageHeaders, renderTabContainers, renderCodeBlocks } from './lib/common';
import { reset } from './lib/reset';
import { addSidebarLinks } from './pages/bitrise-ci';

const main = async () => {
  if (!window.location.href.match(/(\.html|\/)$/)) {
    window.location.href += '.html';
    return;
  }

  renderSidebarSubpageHeaders();

  const subpageMatch = window.location.href.match(/\/(en|jp)\/([^\/]+)(\.html|\/)/);
  if (subpageMatch && subpageMatch[2]) {
    const language = subpageMatch[1];
    const subpage = subpageMatch[2];
    const isHub = subpageMatch[3] === '.html';
    // console.log('subpage:', subpage, 'isHub:', isHub, 'language:', language);

    document.querySelector('.site-content').dataset.isHub = isHub ? 'true' : 'false';

    if (isHub) {
      renderIntroContainer();
      renderHubLinks();
    } else {
      renderTabContainers();
      renderCodeBlocks();
    }

    if (subpage === 'bitrise-ci') {
      addSidebarLinks();
    }
  } else {
     console.log('subpage:', 'portal');
  }
};

main().catch((error) => {
  console.error('Error:', error);
});

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    reset();
  });
  import.meta.webpackHot.accept();
}