import '../css/global.css';
import { renderHubLinks, renderIntroContainer, renderSidebarSubpageHeaders } from './lib/common';
import { addSidebarLinks } from './pages/bitrise-ci';


const resetPage = [];
const main = async () => {
  if (!window.location.href.match(/(\.html|\/)$/)) {
    window.location.href += '.html';
    return;
  }

  resetPage.push(renderSidebarSubpageHeaders());

  const subpageMatch = window.location.href.match(/\/(en|jp)\/([^\/]+)(\.html|\/)/);
  if (subpageMatch && subpageMatch[2]) {
    const language = subpageMatch[1];
    const subpage = subpageMatch[2];
    const isHub = subpageMatch[3] === '.html';
    // console.log('subpage:', subpage, 'isHub:', isHub, 'language:', language);

    document.querySelector('.site-content').dataset.isHub = isHub ? 'true' : 'false';

    if (isHub) {
      resetPage.push(renderIntroContainer());
      resetPage.push(renderHubLinks());
    }

    if (subpage === 'bitrise-ci') {
      resetPage.push(addSidebarLinks());
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
    console.log('Hot module replacement is disposing of the current module.');
    resetPage.forEach((reset) => reset && reset());
  });
  import.meta.webpackHot.accept();
}