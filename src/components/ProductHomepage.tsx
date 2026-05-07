import React from 'react';
import Link from '@docusaurus/Link';
import styles from './ProductHomepage.module.css';

interface ArticleLink {
  title: string;
  href: string;
  description: string;
}

interface Column {
  heading: string;
  links: ArticleLink[];
}

interface ProductHomepageProps {
  title: string;
  description: string;
  illustration?: string;
  buttons?: Array<{
    label: string;
    href: string;
    variant: 'filled' | 'outlined';
  }>;
  columns?: Column[];
}

export default function ProductHomepage({
  title,
  description,
  illustration,
  buttons = [],
  columns,
}: ProductHomepageProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroDescription}>{description}</p>
          {buttons.length > 0 && (
            <div className={styles.heroButtons}>
              {buttons.map((btn) => (
                <Link
                  key={btn.label}
                  to={btn.href}
                  className={btn.variant === 'filled' ? styles.btnFilled : styles.btnOutlined}
                >
                  {btn.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {illustration && (
          <div className={styles.heroIllustration}>
            <img src={illustration} alt="" aria-hidden="true" />
          </div>
        )}
      </div>

      {columns && columns.length > 0 && <div className={styles.grid}>
        {columns.map((col) => (
          <div key={col.heading} className={styles.column}>
            <h2 className={styles.columnHeading}>{col.heading}</h2>
            <ul className={styles.linkList}>
              {col.links.map((link) => (
                <li key={link.href} className={styles.linkItem}>
                  <Link to={link.href} className={styles.linkTitle}>
                    {link.title}
                  </Link>
                  {link.description && (
                    <p className={styles.linkDescription}>{link.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>}
    </div>
  );
}
