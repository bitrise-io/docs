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
import clsx from 'clsx';
import DateRangePicker, {type DateRange} from './DateRangePicker';
import styles from './styles.module.css';

// The documentation areas, one per product hub (API references belong to their
// product). Order here is the order of the filter options. `id` is what entries
// put in `areas="..."` and what each hub's changelog page passes as `area`.
export const AREAS = [
  {id: 'ci', label: 'Bitrise CI'},
  {id: 'build-cache', label: 'Build Cache'},
  {id: 'release-management', label: 'Release Management'},
  {id: 'platform', label: 'Platform'},
  {id: 'build-hub', label: 'Build Hub'},
  {id: 'insights', label: 'Insights'},
  {id: 'rde', label: 'Remote Dev Environments'},
] as const;

// The filter options sit on two lines inside one segmented control. The split
// (All areas + the first three areas, then the other four) is picked so both
// lines come out about the same width at the options' natural sizes; revisit it
// if a label changes.
const FILTER_ITEMS = [{id: 'all', label: 'All areas'}, ...AREAS] as const;
const FILTER_ROWS = [FILTER_ITEMS.slice(0, 4), FILTER_ITEMS.slice(4)];

type AreaId = (typeof AREAS)[number]['id'];
type Filter = AreaId | 'all';

const AREA_LABEL: Record<string, string> = Object.fromEntries(
  AREAS.map((a) => [a.id, a.label]),
);

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
  const [range, setRange] = useState<DateRange | null>(null);

  // Feed items and shared links point at /<hub>/changelog#<anchor> regardless of
  // the entry's area or date. If the target entry is filtered out, show
  // everything so the link lands on something visible.
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      setFilter('all');
      setRange(null);
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView(),
      );
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);

  return (
    <ChangelogContext.Provider value={{filter, range, setFilter}}>
      <div className={styles.toolbar}>
        <svg
          className={styles.filterIcon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true">
          <path d="M3 5h14M5.5 10h9M8 15h4" />
        </svg>
        <div className={styles.segmented} role="group" aria-label="Filter by area">
          {FILTER_ROWS.map((row, i) => (
            <div key={i} className={styles.segmentedRow}>
              {row.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={clsx(styles.option, filter === a.id && styles.optionActive)}
                  aria-pressed={filter === a.id}
                  onClick={() => setFilter(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>
      {children}
    </ChangelogContext.Provider>
  );
}

interface EntryProps {
  /** Space-separated area ids. */
  areas: string;
  /** The entry's date (YYYY-MM-DD), used by the date range filter. */
  date?: string;
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
            title={`Show only ${AREA_LABEL[id] ?? id} entries`}
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

/**
 * A time bucket. Its first child is the `##` heading, so the page TOC still
 * lists the quarters. Entries are filtered here, and a quarter with no visible
 * entry is hidden along with its heading.
 */
export function Quarter({children}: {children: ReactNode}): ReactElement | null {
  const {filter, range} = useContext(ChangelogContext);

  const all = Children.toArray(children);
  const entries = all.filter(isEntry);
  const rest = all.filter((c) => !isEntry(c));

  const visible = entries.filter((e) => {
    const {areas, date} = e.props;
    if (filter !== 'all' && !parseAreas(areas).includes(filter)) return false;
    if (range && date && (date < range.start || date > range.end)) return false;
    return true;
  });
  if (visible.length === 0) return null;

  return (
    <>
      {rest}
      {visible}
    </>
  );
}
