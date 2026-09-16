import React from 'react';
import Link from '@docusaurus/Link';
import {useDocsVersion, useDocsData} from '@docusaurus/plugin-content-docs/client';
import IconBook from '@site/src/images/icon-book-16px.svg';
import seeAlso from '@site/src/data/see_also.json';
import styles from './styles.module.css';

const relatedIdsByDoc: Record<string, string[]> = seeAlso as Record<string, string[]>;

type ResolvedLink = {id: string; title: string; permalink: string};

/**
 * `see_also.json` maps a doc id to its related pages' doc ids -- no titles,
 * no hrefs. Both are resolved here, live, from Docusaurus's own per-locale
 * doc data, so the same relatedness graph renders the correct title and
 * permalink under any locale without regenerating per locale:
 *  - `useDocsVersion().docs[id]` carries the locale-correct title, but no
 *    permalink -- the route-level doc data doesn't include one.
 *  - `useDocsData(pluginId)`'s global data carries the locale-correct
 *    permalink (`path`), keyed by the same id, but no title.
 * A related id missing from either -- the page was deleted or renamed since
 * the last regeneration -- is dropped rather than rendered as a dead link.
 */
export default function SeeAlso({id}: {id?: string}): React.JSX.Element | null {
  const relatedIds = id ? relatedIdsByDoc[id] : undefined;
  const version = useDocsVersion();
  const pluginData = useDocsData(version.pluginId);

  if (!relatedIds || relatedIds.length === 0) {
    return null;
  }

  const globalVersion =
    pluginData.versions.find((v) => v.name === version.version) ?? pluginData.versions[0];

  const links: ResolvedLink[] = relatedIds
    .map((relatedId): ResolvedLink | null => {
      const doc = version.docs[relatedId];
      const globalDoc = globalVersion?.docs.find((d) => d.id === relatedId);
      return doc && globalDoc ? {id: relatedId, title: doc.title, permalink: globalDoc.path} : null;
    })
    .filter((link): link is ResolvedLink => link !== null);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={styles.seeAlso}>
      <hr className={styles.divider} />
      <h2 className={styles.heading}>
        <IconBook width={16} height={16} className={styles.icon} />
        See also
      </h2>
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.id} className={styles.item}>
            <Link to={link.permalink} className={styles.link}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
