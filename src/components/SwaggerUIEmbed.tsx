import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function SwaggerUIEmbed({ url }: { url: string }) {
  return (
    <BrowserOnly fallback={<div>Loading API reference…</div>}>
      {() => {
        const SwaggerUI = require('swagger-ui-react').default;
        require('swagger-ui-react/swagger-ui.css');
        return <SwaggerUI url={url} />;
      }}
    </BrowserOnly>
  );
}
