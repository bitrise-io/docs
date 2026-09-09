import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';

declare global {
  interface Window {
    Intercom?: ((...args: unknown[]) => void) & { q?: unknown[] };
    intercomSettings?: Record<string, unknown>;
  }
}

if (ExecutionEnvironment.canUseDOM) {
  const appId = (siteConfig.customFields?.intercomAppId as string) || '';
  const shouldLoad = appId && Boolean(siteConfig.customFields?.intercomEnabled);

  if (shouldLoad && !window.Intercom) {
    window.intercomSettings = { app_id: appId };

    const bootQueue = (...args: unknown[]) => {
      bootQueue.q!.push(args);
    };
    bootQueue.q = [];
    window.Intercom = bootQueue;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://widget.intercom.io/widget/${appId}`;
    document.head.appendChild(script);
  }
}
