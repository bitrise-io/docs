import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {translate} from '@docusaurus/Translate';
import DateRangePicker, {ALL_DATES, type DateFilterValue, type DateRange} from './DateRangePicker';
import Dropdown, {type MenuItem} from './Dropdown';
import styles from './styles.module.css';

// The documentation areas, one per product hub (API references belong to their
// product). Order here is the order of the filter options. `id` is what entries
// put in `areas="..."` and what each hub's changelog page passes as `area`.
export const AREAS = [
  {
    id: 'ci',
    label: translate({
      id: 'changelog.area.ci',
      message: 'Bitrise CI',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'build-cache',
    label: translate({
      id: 'changelog.area.build-cache',
      message: 'Build Cache',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'release-management',
    label: translate({
      id: 'changelog.area.release-management',
      message: 'Release Management',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'platform',
    label: translate({
      id: 'changelog.area.platform',
      message: 'Platform',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'build-hub',
    label: translate({
      id: 'changelog.area.build-hub',
      message: 'Build Hub',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'insights',
    label: translate({
      id: 'changelog.area.insights',
      message: 'Insights',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
  {
    id: 'rde',
    label: translate({
      id: 'changelog.area.rde',
      message: 'Remote Dev Environments',
      description: 'Changelog area filter option and badge. Product name, keep in English',
    }),
  },
] as const;

// The choices in the area dropdown: everything first, then each area.
const FILTER_ITEMS = [
  {
    id: 'all',
    label: translate({
      id: 'changelog.filter.allAreas',
      message: 'All areas',
      description: 'Changelog area filter option that shows entries from every area',
    }),
  },
  ...AREAS,
] as const;

type AreaId = (typeof AREAS)[number]['id'];
type Filter = AreaId | 'all';

const AREA_LABEL: Record<string, string> = Object.fromEntries(
  AREAS.map((a) => [a.id, a.label]),
);

const AREA_ITEMS: MenuItem[] = FILTER_ITEMS.map((a) => ({
  id: a.id,
  label: a.label,
  dividerAfter: a.id === 'all',
}));

interface ChangelogState {
  filter: Filter;
  range: DateRange | null; // null shows every date
  setFilter: (f: Filter) => void;
}

const ChangelogContext = createContext<ChangelogState>({
  filter: 'all',
  range: null,
  setFilter: () => {},
});

const parseAreas = (areas: string): string[] =>
  areas.split(/[\s,]+/).filter(Boolean);

const isArea = (v: unknown): v is AreaId =>
  AREAS.some((a) => a.id === v);

/**
 * Wraps the whole changelog. `area` is the hub the page is served from; it is
 * the initial filter, so each hub opens on its own entries with a one-click way
 * to see everything.
 */
export default function Changelog({
  area,
  children,
}: {
  area?: string;
  children: ReactNode;
}): ReactElement {
  const [filter, setFilter] = useState<Filter>(isArea(area) ? area : 'all');
  const [date, setDate] = useState<DateFilterValue>(ALL_DATES);

  // Feed items and shared links point at /<hub>/changelog#<anchor> regardless of
  // the entry's area or date. If the target entry is filtered out, show
  // everything so the link lands on something visible.
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      setFilter('all');
      setDate(ALL_DATES);
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView(),
      );
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);

  return (
    <ChangelogContext.Provider value={{filter, range: date.range, setFilter}}>
      <div className={styles.toolbar}>
        <Dropdown
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4.5h14l-5.5 6.3v4.7l-3 1.8v-6.5z" />
            </svg>
          }
          label={AREA_LABEL[filter] ?? FILTER_ITEMS[0].label}
          items={AREA_ITEMS}
          selectedId={filter}
          onSelect={(id) => setFilter(id as Filter)}
          ariaLabel={translate({
            id: 'changelog.filter.ariaLabel',
            message: 'Filter by area',
            description: 'ARIA label of the changelog area filter',
          })}
        />
        <DateRangePicker value={date} onChange={setDate} />
      </div>
      {children}
    </ChangelogContext.Provider>
  );
}

interface EntryProps {
  /** Space-separated area ids. */
  areas: string;
  children: ReactNode;
}

/**
 * One changelog entry: an H3 heading followed by its summary. Renders the area
 * badges right under the heading.
 */
export function Entry({areas, children}: EntryProps): ReactElement {
  const {setFilter} = useContext(ChangelogContext);
  const [heading, ...rest] = Children.toArray(children);
  return (
    <section className={styles.entry} data-areas={areas}>
      {heading}
      <div className={styles.badges}>
        {parseAreas(areas).map((id) => (
          <button
            key={id}
            type="button"
            className={styles.badge}
            title={translate(
              {
                id: 'changelog.badge.title',
                message: 'Show only {area} entries',
                description: 'Tooltip of a changelog entry area badge; {area} is the area name',
              },
              {area: AREA_LABEL[id] ?? id},
            )}
            onClick={() => setFilter(id as Filter)}>
            {AREA_LABEL[id] ?? id}
          </button>
        ))}
      </div>
      {rest}
    </section>
  );
}

const isEntry = (c: ReactNode): c is ReactElement<EntryProps> =>
  isValidElement(c) && c.type === Entry;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The date of an entry, read from its heading so it is written only once: the
 * `dateTime` of the `<time>` element, or a bare `YYYY-MM-DD` at the start of
 * the heading text.
 */
function findDate(node: ReactNode): string | undefined {
  if (typeof node === 'string') {
    const m = node.trim().match(/^(\d{4}-\d{2}-\d{2})\b/);
    return m?.[1];
  }
  if (!isValidElement(node)) return undefined;
  const props = node.props as {dateTime?: unknown; children?: ReactNode};
  if (typeof props.dateTime === 'string' && ISO_DATE.test(props.dateTime)) {
    return props.dateTime;
  }
  for (const child of Children.toArray(props.children)) {
    const found = findDate(child);
    if (found) return found;
  }
  return undefined;
}

const entryDate = (e: ReactElement<EntryProps>): string | undefined =>
  findDate(Children.toArray(e.props.children)[0]); // the heading

/**
 * A time bucket. Its first child is the `##` heading, so the page TOC still
 * lists the quarters. Entries are filtered here; a quarter with no visible
 * entry keeps its heading and shows a short notice instead.
 */
export function Quarter({children}: {children: ReactNode}): ReactElement {
  const {filter, range} = useContext(ChangelogContext);

  const all = Children.toArray(children);
  const entries = all.filter(isEntry);
  const rest = all.filter((c) => !isEntry(c));

  const visible = entries.filter((e) => {
    if (filter !== 'all' && !parseAreas(e.props.areas).includes(filter)) return false;
    if (range) {
      const date = entryDate(e);
      if (!date) {
        // Shown regardless of the range, but worth knowing about while writing.
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Changelog entry heading has no date; the date filter skips it.');
        }
        return true;
      }
      if (date < range.start || date > range.end) return false;
    }
    return true;
  });
  // Keep the heading even when nothing matches: the TOC is built from the MDX
  // at build time and links to every quarter, so a missing heading is a dead link.
  return (
    <>
      {rest}
      {visible.length > 0 ? (
        visible
      ) : (
        <p className={styles.emptyQuarter}>
          {translate({
            id: 'changelog.quarter.empty',
            message: 'No updates match the current filters in this quarter.',
            description: 'Changelog text under a quarter heading when the area or date filter hides all its entries',
          })}
        </p>
      )}
    </>
  );
}
