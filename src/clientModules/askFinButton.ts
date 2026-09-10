import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

declare global {
  interface Window {
    Intercom?: (...args: unknown[]) => void;
  }
}

if (ExecutionEnvironment.canUseDOM) {
  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement)?.closest('#ask-fin-button');
    if (!target) return;

    if (window.Intercom) {
      // Pre-fills the Messenger's new-message composer with the search
      // query — the user still has to hit send themselves. Intercom's API
      // has no "send on the user's behalf" method, by design.
      const query = target.getAttribute('data-fin-query') ?? '';
      window.Intercom('showNewMessage', query);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Ask Fin: Intercom Messenger is not loaded.');
    }
  });
}
