import React from 'react';
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
  return (
    <div className={styles.wrapper} data-product-overview>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroDescription}>{description}</p>
          {(overviewHref || quickstartHref) && (
            <div className={styles.heroButtons}>
              {overviewHref && (
                <a href={overviewHref} className={styles.buttonPrimary}>
                  Overview
                </a>
              )}
              {quickstartHref && (
                <a href={quickstartHref} className={styles.buttonSecondary}>
                  Quickstart
                </a>
              )}
            </div>
          )}
        </div>
        {illustration && (
          <div className={styles.heroIllustration}>
            <img src={illustration} alt="" />
          </div>
        )}
      </div>

      <div className={styles.linkColumns}>
        {columns.map((col) => (
          <div key={col.title} className={styles.linkColumn}>
            <div className={styles.columnTitle}>{col.title}</div>
            <div className={styles.columnLinks}>
              {col.links.map((link) => (
                <a key={link.label} href={link.href} className={styles.linkCard}>
                  <span className={styles.linkLabel}>{link.label}</span>
                  <span className={styles.linkDescription}>{link.description}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
