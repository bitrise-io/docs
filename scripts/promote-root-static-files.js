#!/usr/bin/env node
/**
 * Copies Cloudflare Pages' special root-level files (_redirects, _headers)
 * up from the default locale's per-locale output directory to the true
 * build root.
 *
 * Since i18n.localeConfigs[locale].baseUrl gave each locale its own baseUrl
 * (see docusaurus.config.ts), Docusaurus now writes every locale's copy of
 * static/ — including _redirects and _headers — under its own subdirectory
 * (build/en/_redirects, build/ja/_redirects, ...), never at build/ itself.
 * Cloudflare Pages only reads these files from the deployed directory's
 * root, so without this step every redirect rule (including the
 * pre-existing legacy /jp/* one) would silently stop applying after
 * deploy, even though the build succeeds and looks correct locally.
 *
 * Every locale gets an identical copy of static/, so copying from any one
 * of them is equivalent — DEFAULT_LOCALE picks a deterministic source
 * rather than relying on directory-listing order.
 */
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '..', 'build');
const DEFAULT_LOCALE = 'en';
const FILES = ['_redirects', '_headers'];

for (const file of FILES) {
  const src = path.join(BUILD_DIR, DEFAULT_LOCALE, file);
  const dest = path.join(BUILD_DIR, file);
  if (!fs.existsSync(src)) {
    console.log(`· ${src} not found, skipping`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`✔ promoted ${file} to build root`);
}
