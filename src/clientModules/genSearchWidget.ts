import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';

if (ExecutionEnvironment.canUseDOM) {
  const configId =
    (siteConfig.customFields?.genSearchWidgetConfigId as string) || '';

  if (configId && !document.querySelector('gen-search-widget')) {
    const widget = document.createElement('gen-search-widget');
    widget.setAttribute('configId', configId);
    widget.setAttribute('location', 'us');
    widget.setAttribute('triggerId', 'searchWidgetTrigger');
    document.body.appendChild(widget);
  }

  if (configId) {
    let genSearchWidget: Element | null;
    let ucsResults: ShadowRoot | null;
    let ucsSummary: ShadowRoot | null;
    let ucsSearchBar: ShadowRoot | null;

    const FIXED_HEIGHT = 300;

    setInterval(() => {
      if (!genSearchWidget)
        genSearchWidget = document.querySelector('gen-search-widget');
      if (!genSearchWidget) return;

      if (!ucsResults)
        ucsResults =
          (genSearchWidget as any).shadowRoot?.querySelector('ucs-results') ??
          null;
      if (!ucsResults) return;

      if (!ucsSummary)
        ucsSummary =
          (ucsResults as any).shadowRoot?.querySelector('ucs-summary') ?? null;
      if (ucsSummary) {
        const loader = (ucsSummary as any).shadowRoot?.querySelector(
          '.loader-container',
        );
        if (loader) loader.style.height = `${FIXED_HEIGHT + 45}px`;

        const summary = (ucsSummary as any).shadowRoot?.querySelector(
          '.summary-container',
        );
        if (summary) {
          summary.style.height = summary.className.match(/expanded/)
            ? 'auto'
            : `${FIXED_HEIGHT}px`;
        }
      }

      if (!ucsSearchBar)
        ucsSearchBar =
          (genSearchWidget as any).shadowRoot?.querySelector('ucs-search-bar') ??
          null;
      if (ucsSearchBar) {
        const searchInput = (ucsSearchBar as any).shadowRoot?.querySelector(
          'input',
        ) as HTMLInputElement | null;
        if (searchInput && !searchInput.dataset.handled) {
          searchInput.dataset.handled = 'true';
          searchInput.placeholder = 'Press Enter to search';
        }
      }
    }, 50);
  }
}
