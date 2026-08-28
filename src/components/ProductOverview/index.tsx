import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './ProductOverview.module.css';

type OverviewLink = {
  label: string;
  href: string;
  description: string;
};

type LinkColumn = {
  title: string;
  links: OverviewLink[];
};

type ProductOverviewProps = {
  title: string;
  description: string;
  illustration?: string;
  overviewHref?: string;
  quickstartHref?: string;
  columns: LinkColumn[];
};

export default function ProductOverview({
  title,
  description,
  illustration,
  overviewHref,
  quickstartHref,
  columns,
}: ProductOverviewProps) {
  // Every href/src below is a bare absolute path (no locale prefix), so it
  // needs Docusaurus's baseUrl resolution to land in the locale that is
  // actually rendering — a raw <a href> or <img src> skips that entirely and
  // requests the path at the domain root, where nothing is served any more.
  const illustrationSrc = useBaseUrl(illustration ?? '');
  return (
    <div className={styles.wrapper} data-product-overview>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroDescription}>{description}</p>
          {(overviewHref || quickstartHref) && (
            <div className={styles.heroButtons}>
              {overviewHref && (
                <Link to={overviewHref} className={styles.buttonPrimary}>
                  Overview
                </Link>
              )}
              {quickstartHref && (
                <Link to={quickstartHref} className={styles.buttonSecondary}>
                  Quickstart
                </Link>
              )}
            </div>
          )}
        </div>
        {illustration && (
          <div className={styles.heroIllustration}>
            <img src={illustrationSrc} alt="" />
          </div>
        )}
      </div>

      <div className={styles.linkColumns}>
        {columns.map((col) => (
          <div key={col.title} className={styles.linkColumn}>
            <div className={styles.columnTitle}>{col.title}</div>
            <div className={styles.columnLinks}>
              {col.links.map((link) => (
                <Link key={link.label} to={link.href} className={styles.linkCard}>
                  <span className={styles.linkLabel}>{link.label}</span>
                  <span className={styles.linkDescription}>{link.description}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
