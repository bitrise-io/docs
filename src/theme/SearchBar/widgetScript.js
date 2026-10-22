// Loads Google's Vertex AI Search script, which defines <gen-search-widget>,
// the first time it is needed instead of on every page: most visitors never
// open the search modal, and this is a third-party script.
//
// The modal warms it up as it opens (see DocSearch), so it is usually ready by
// the time someone clicks "AI Summary"; AskAiPanel waits on the same promise
// either way. Calling this again returns the same pending or finished load.

export const WIDGET_SCRIPT_URL = 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US';

// A script blocked until consent (the cookie banner can hold third-party
// scripts back) never fires load or error: don't wait on it forever.
const LOAD_TIMEOUT_MS = 15000;

let pending = null;

export function loadWidgetScript() {
  if (typeof document === 'undefined') return Promise.reject(new Error('no document'));
  if (window.customElements?.get('gen-search-widget')) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;

    const timer = setTimeout(() => fail(new Error('timed out')), LOAD_TIMEOUT_MS);
    const fail = (err) => {
      clearTimeout(timer);
      pending = null; // a later attempt may succeed (offline blip, consent given)
      script.remove();
      reject(err);
    };
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => fail(new Error('failed to load'));
    document.head.appendChild(script);
  });
  return pending;
}
