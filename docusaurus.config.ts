import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import * as fs from 'node:fs';
import * as path from 'node:path';
import bitriseAPIApiSidebar from './docs/bitrise-api/api-reference/sidebar';
import changelogFeedPlugin from './src/plugins/changelog-feed';

// Build-time expansion for list-context partial references.
//
// Migration emits `1. <Partial_OpeningTheWorkflowEditor />` placeholders in
// consumer pages where Paligo had an `<xi:include>` inside a `<procedure>`.
// MDX would render that JSX component as a block, breaking step numbering, so
// we splice the partial's actual list items in BEFORE MDX parses the page.
// The partial file remains the canonical source.
const PARTIALS_DIR = path.resolve(__dirname, 'src/partials');
const PARTIALS_INDEX_FILE = path.resolve(__dirname, 'migration/partials_index.json');

let partialsIndex: Record<string, string> = {};
try {
  partialsIndex = JSON.parse(fs.readFileSync(PARTIALS_INDEX_FILE, 'utf-8')).components ?? {};
} catch {
  // No index yet (first migration run not done) — preprocessor becomes a no-op.
}

const partialContentCache = new Map<string, string[]>();

/**
 * Read a partial file once and extract the items of its first contiguous
 * Markdown list (numbered or bulleted). Each returned string is one item with
 * the leading prefix removed; multi-line items keep their indented
 * continuation lines (3-space for ordered, 2-space for bulleted).
 */
function extractPartialItems(component: string): string[] | null {
  if (partialContentCache.has(component)) return partialContentCache.get(component)!;
  const slug = partialsIndex[component];
  if (!slug) return null;
  const file = path.join(PARTIALS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf-8');

  // Walk lines, skip frontmatter / imports / blank lines, then collect the
  // first list block.
  const lines = text.split('\n');
  let i = 0;
  if (lines[0]?.trim() === '---') {
    i++;
    while (i < lines.length && lines[i].trim() !== '---') i++;
    i++;
  }
  while (i < lines.length) {
    const stripped = lines[i].trim();
    if (stripped === '' || stripped.startsWith('import ') || stripped.startsWith('export ')) {
      i++;
      continue;
    }
    break;
  }

  const items: string[] = [];
  const listLineRe = /^(\d+\.|[-+*])\s+(.*)$/;
  let current: string[] | null = null;
  let detected: 'ordered' | 'bullet' | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(listLineRe);
    if (m) {
      const isOrdered = /^\d+\./.test(m[1]);
      const kind = isOrdered ? 'ordered' : 'bullet';
      if (detected === null) detected = kind;
      if (kind !== detected) break;
      if (current) items.push(current.join('\n'));
      current = [m[2]];
      continue;
    }
    // Continuation: blank or indented line while we're inside an item
    if (current !== null) {
      const expectedIndent = detected === 'ordered' ? 3 : 2;
      if (line === '' || line.startsWith(' '.repeat(expectedIndent)) || line.startsWith('\t')) {
        current.push(line.startsWith(' '.repeat(expectedIndent)) ? line.slice(expectedIndent) : line);
        continue;
      }
      // First non-list, non-continuation line ends the block
      break;
    }
    // Non-list content before any list item — keep scanning until we hit one
  }
  if (current) items.push(current.join('\n'));
  partialContentCache.set(component, items);
  return items;
}

/**
 * Replace `1. <Partial_X />` (and bulleted `- <Partial_X />`) lines with the
 * partial's actual list items, re-prefixed to match the consumer's list style.
 */
function expandListPartials(content: string): string {
  const refRe = /^([ \t]*)(\d+\.|[-+*])\s*<(Partial_[A-Za-z0-9_]+)\s*\/>\s*$/gm;
  return content.replace(refRe, (match, indent, prefix, name) => {
    const items = extractPartialItems(name);
    if (!items || items.length === 0) return match;
    const isOrdered = /^\d+\./.test(prefix);
    const itemPrefix = isOrdered ? '1. ' : '- ';
    const itemIndent = isOrdered ? '   ' : '  ';
    return items
      .map((body) => {
        const [first, ...rest] = body.split('\n');
        const lines = [indent + itemPrefix + first];
        for (const r of rest) lines.push(r ? indent + itemIndent + r : '');
        return lines.join('\n');
      })
      .join('\n');
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function injectApiSidebar(items: any[]): any[] {
  return items.map(item => {
    // Replace hub-link markers with a link item that opens in a new tab
    if (item.type === 'category' && item.customProps?.isApiHubLink) {
      return {
        type: 'link',
        label: item.label,
        href: item.customProps.isApiHubLink,
        customProps: {...item.customProps, newTab: true},
      };
    }
    if (item.type === 'category' && Array.isArray(item.items)) {
      const children = injectApiSidebar(item.items);
      // Append an "API reference" hub link as the last child of this category
      if (item.customProps?.appendApiHubLink) {
        children.push({
          type: 'link',
          label: 'API reference',
          href: item.customProps.appendApiHubLink,
          customProps: {newTab: true},
        });
      }
      return {...item, items: children};
    }
    return item;
  });
}

const config: Config = {
  title: 'Bitrise Docs',
  tagline: 'Find product documentation, code samples, API & CLI references, and more.',
  favicon: 'favicon.ico',

  url: 'https://docs.bitrise.io',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'bitrise-io',
  projectName: 'docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownImages: 'warn',
    },
    // Escape angle-bracket placeholders in MDX bodies so things like
    // `<Git provider>` or `<connected-app-id>` don't get parsed as JSX.
    // Real components we use (Tabs/TabItem/GlossTerm) are left alone.
    preprocessor: ({filePath, fileContent}) => {
      if (!filePath.endsWith('.mdx')) return fileContent;
      // Generated API reference files use openapi-docs JSX components that span
      // multiple lines. The line-by-line tag escaper would mangle their closing
      // tags (e.g. `</StatusCodes>`) while leaving multi-line opening tags intact,
      // causing MDX to report unclosed-tag errors. Skip them entirely.
      if (filePath.includes('/bitrise-api/api-reference/')) return fileContent;
      // Step 1: expand `1. <Partial_X />` placeholders (list-context partials)
      // BEFORE we do tag escaping below, so the inlined items are subject to
      // the same escape rules as inline content.
      fileContent = expandListPartials(fileContent);
      const ALLOWED = new Set([
        'Tabs', 'TabItem', 'GlossTerm',
        'SwaggerUIEmbed',
        'br', 'hr', 'sup', 'sub', 'strong', 'em', 'code', 'pre', 'p',
        'div', 'span', 'a', 'img', 'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'dl', 'dt', 'dd', 'details', 'summary', 'figure', 'figcaption',
      ]);
      // Strip frontmatter and import block so we don't touch them
      const fmEnd = fileContent.indexOf('\n---', 3);
      if (fmEnd < 0) return fileContent;
      const head = fileContent.slice(0, fmEnd + 4);
      let body = fileContent.slice(fmEnd + 4);
      // Replace `<Word ...>` and `</Word>` with escaped versions when Word
      // isn't in our allow-list. Skip code fences and inline code.
      const lines = body.split('\n');
      let inFence = false;
      for (let i = 0; i < lines.length; i++) {
        const stripped = lines[i].trimStart();
        if (stripped.startsWith('```')) {
          inFence = !inFence;
          continue;
        }
        if (inFence) continue;
        // Process line, skipping inline `code` segments
        const segments = lines[i].split('`');
        for (let s = 0; s < segments.length; s += 2) {
          // Escape `<word>` placeholders that aren't real components.
          // Real components: allow-list + auto-generated `Partial_*` refs.
          segments[s] = segments[s].replace(
            /<(\/?)([A-Za-z][A-Za-z0-9_-]*)([^>]*)>/g,
            (m, slash, name, rest) => {
              if (ALLOWED.has(name) || name.startsWith('Partial_')) return m;
              return `&lt;${slash}${name}${rest}&gt;`;
            }
          );
          // Escape `<` followed by a digit or whitespace+digit (version ranges
          // like `<1.2.3`, comparison expressions like `< 5`). MDX otherwise
          // tries to read a JSX name and chokes.
          segments[s] = segments[s].replace(/<(\s*\d)/g, '&lt;$1');
          // Escape `{kebab-case}` placeholders — they look like JSX expressions
          // to MDX but are never valid identifiers because of the hyphen.
          segments[s] = segments[s].replace(/\{([a-z][a-z0-9]*-[a-z0-9-]+)\}/g, '\\{$1\\}');
        }
        lines[i] = segments.join('`');
      }
      return head + lines.join('\n');
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap',
      },
    },
  ],

  scripts: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          {
            src: 'https://cdn.cookielaw.org/consent/74dfda25-8e61-4fab-9330-4718635e7050/OtAutoBlock.js',
          },
          {
            src: 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js',
            charset: 'UTF-8',
            'data-domain-script': '74dfda25-8e61-4fab-9330-4718635e7050',
          },
        ]
      : []),
    ...(process.env.GEN_SEARCH_WIDGET_ID
      ? [
          {
            src: 'https://cloud.google.com/ai/gen-app-builder/client?hl=en_US',
            async: true,
          },
        ]
      : []),
  ],

  clientModules: [
    './src/clientModules/genSearchWidget.ts',
  ],

  customFields: {
    gtmId: process.env.GTM_ID || '',
    genSearchWidgetConfigId: process.env.GEN_SEARCH_WIDGET_ID || '',
    intercomAppId: 'e2rdidtm',
  },

  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'bitrise-api',
        docsPluginId: 'classic',
        config: {
          bitriseCI: {
            specPath: 'api/bitrise-ci.json',
            outputDir: 'docs/bitrise-api/api-reference',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          },
        },
      },
    ],
    changelogFeedPlugin,
    function webpackFallbacks() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpack = require('webpack');
      return {
        name: 'webpack-fallbacks',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configureWebpack(): any {
          return {
            resolve: {
              fallback: {
                // swagger-ui-react depends on Node.js core modules.
                // Webpack 5 no longer polyfills them automatically.
                stream: false,
                buffer: require.resolve('buffer/'),
              },
            },
            plugins: [
              // Provide Buffer globally so packages that reference it at
              // runtime (e.g. swagger-ui-react → deep-extend) don't crash.
              new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
              }),
            ],
          };
        },
      };
    },
  ],

  themes: ['docusaurus-theme-openapi-docs'],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'en',
          path: 'docs',
          sidebarPath: './sidebars.ts',
          // Transform sidebar items: resolve hub-link markers and append API reference links.
          sidebarItemsGenerator: async ({defaultSidebarItemsGenerator, ...args}) => {
            const items = await defaultSidebarItemsGenerator(args);
            return injectApiSidebar(items);
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        // Only register the plugin when a container ID is configured: its
        // containerId option is required (Joi-validated), so passing
        // undefined would fail the build. Injection itself happens in
        // production builds only, same guard as the CookieConsent scripts.
        ...(process.env.GTM_ID
          ? {
              googleTagManager: {
                containerId: process.env.GTM_ID,
              },
            }
          : {}),
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: '',
      logo: {
        alt: 'Bitrise Docs',
        src: 'img/brand/logo-white.svg',
        href: '/',
      },
      items: [
        {
          href: 'https://support.bitrise.io/en/',
          label: 'Go to support',
          position: 'right',
          className: 'navbar-btn navbar-btn--ghost',
        },
        {
          href: 'https://app.bitrise.io/users/sign_up',
          label: 'Start for free',
          position: 'right',
          className: 'navbar-btn navbar-btn--solid',
        },
      ],
      hideOnScroll: false,
    },
    colorMode: {
      disableSwitch: true,
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `© ${new Date().getFullYear()} Bitrise Ltd.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['yaml', 'bash', 'json', 'ruby', 'swift', 'kotlin', 'groovy', 'dart'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
