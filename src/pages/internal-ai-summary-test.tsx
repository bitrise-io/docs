import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import SearchBar from '@theme/SearchBar';

/**
 * Unlisted, throwaway page for testing the "AI Summary" panel (see
 * src/theme/SearchBar) against the real Vertex AI Search domain allowlist
 * on production — nothing else can do that locally, since the widget 403s
 * on any domain other than docs.bitrise.io.
 *
 * Not linked from any nav/sidebar/homepage. noindex below keeps it out of
 * search engines even if a crawler stumbles onto it. Delete this file (and
 * this comment's reason for existing) once the AI Summary feature ships
 * for real — it has no purpose beyond that.
 */
export default function InternalAiSummaryTest(): React.JSX.Element {
  return (
    <Layout title="AI Summary test (internal)">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main style={{padding: '3rem 2rem', maxWidth: 640, margin: '0 auto'}}>
        <h1>AI Summary test</h1>
        <p>
          Internal, unlisted page — not linked anywhere on the site. Click
          the search button below, type a query, and click "AI Summary" to
          test the real Vertex AI Search response on this domain.
        </p>
        <SearchBar />
      </main>
    </Layout>
  );
}
