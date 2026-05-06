import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import glossary from '@site/migration/glossary.json';
import styles from './styles.module.css';

type GlossaryEntry = {term: string; definition: string};
const data: Record<string, GlossaryEntry> = glossary as Record<string, GlossaryEntry>;

const GLOSSARY_PATH = '/en/bitrise-ci/references/glossary';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function GlossTerm({
  baseform,
  children,
}: {
  baseform: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const childText = typeof children === 'string' ? children : '';
  const entry = data[baseform?.toLowerCase()] ?? data[childText.toLowerCase()];

  if (!entry) {
    return <>{children}</>;
  }

  const anchor = slugify(entry.term);
  const href = `${GLOSSARY_PATH}#${anchor}`;

  return (
    <span
      className={styles.term}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <Link to={href} className={styles.label}>
        {children}
      </Link>
      {hovered && (
        <span className={styles.popover} role="tooltip">
          <span className={styles.popoverTerm}>{entry.term}</span>
          <span className={styles.popoverDef}>{entry.definition}</span>
        </span>
      )}
    </span>
  );
}
