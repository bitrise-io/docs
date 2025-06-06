import '../css/global.css';

console.log('Hello, world!');

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    console.log('Hot module replacement is disposing of the current module.');
  });
  import.meta.webpackHot.accept();
}
