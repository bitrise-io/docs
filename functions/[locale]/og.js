/**
 * Locale-prefixed route for the social-card renderer in ../og.js.
 *
 * The og:image URL is produced by src/theme/DocItem/Metadata/index.tsx as
 * `/og?title=…`, and Docusaurus's PageMetadata runs it through
 * withBaseUrl(image, {absolute: true}). Now that each locale has its own
 * baseUrl (/en/, /ja/, ...), that resolves to /en/og?… — not /og?… — so
 * without this route every doc page's card 404s.
 *
 * [locale] matches exactly one path segment, so this serves /en/og and
 * /ja/og (and any future locale) from the same handler. The root /og route
 * stays in place for anything still linking to it directly.
 */
export { onRequest } from "../og.js";
