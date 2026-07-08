import React from 'react';
import Link from '@docusaurus/Link';
import IconBook from '@site/src/images/icon-book-16px.svg';
import seeAlso from '@site/src/data/see_also.json';
import styles from './styles.module.css';

type RelatedLink = {title: string; href: string};
const data: Record<string, RelatedLink[]> = seeAlso as Record<string, RelatedLink[]>;

export default function SeeAlso({source}: {source?: string}): React.JSX.Element | null {
  const links = source ? data[source] : undefined;

  if (!links || links.length === 0) {
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
          <li key={link.href} className={styles.item}>
            <Link to={link.href} className={styles.link}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
