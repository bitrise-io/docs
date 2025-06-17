import '../css/global.css';

const main = () => {
  // const languageDropdown = document.querySelector('footer .languages');
  // if (languageDropdown) {
  //   languageDropdown.classList.remove('dropup');
  //   languageDropdown.classList.add('dropdown');
  //   const navbarContainer = document.querySelector('.navbar-container');
  //   if (navbarContainer) {
  //     navbarContainer.appendChild(languageDropdown);
  //   }
  // }
};
main();

window.addEventListener('DOMContentLoaded', main);

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    console.log('Hot module replacement is disposing of the current module.');
    window.removeEventListener('DOMContentLoaded', main);
  });
  import.meta.webpackHot.accept();
}
