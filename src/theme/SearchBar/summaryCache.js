// Finished AI summaries, kept in memory so asking for the same query again
// (Back to results, then AI Summary) shows the answer at once instead of
// spinning up the Vertex widget a second time.
//
// Module state lives as long as the page does: it survives Docusaurus's
// client-side navigation between docs, and is gone after a reload. Only
// finished summaries are stored, never the "no summary" outcome, so a retry
// still gets a fresh attempt.

const MAX_ENTRIES = 20;
const cache = new Map(); // insertion order = least recently used first

// Same question, different spacing or case, is the same entry. The locale is
// part of the key because the answer is written in the language of the site.
const keyOf = (locale, query) =>
  `${locale}\u0000${query.trim().replace(/\s+/g, ' ').toLowerCase()}`;

export function getCachedSummary(locale, query) {
  const key = keyOf(locale, query);
  if (!cache.has(key)) return undefined;
  const html = cache.get(key);
  cache.delete(key); // re-insert: now the most recently used
  cache.set(key, html);
  return html;
}

export function cacheSummary(locale, query, html) {
  const key = keyOf(locale, query);
  cache.delete(key);
  cache.set(key, html);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}
