import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './DateRangePicker.module.css';

export interface DateRange {
  /** ISO dates (YYYY-MM-DD), start <= end. */
  start: string;
  end: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n: number): string => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number): string => `${y}-${pad(m + 1)}-${pad(d)}`;

function todayIso(): string {
  const t = new Date();
  return iso(t.getFullYear(), t.getMonth(), t.getDate());
}

function shortDate(d: string, withYear: boolean): string {
  const [y, m, day] = d.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${pad(day)}${withYear ? `, ${y}` : ''}`;
}

/** "Sep 06 - Oct 06", with years when the range isn't inside the current year. */
export function formatRange(range: DateRange | null): string {
  if (!range) return 'All dates';
  const thisYear = String(new Date().getFullYear());
  const withYear = range.start.slice(0, 4) !== thisYear || range.end.slice(0, 4) !== thisYear;
  return `${shortDate(range.start, withYear)} - ${shortDate(range.end, withYear)}`;
}

interface View {
  year: number;
  month: number; // 0-11
}

const shift = (v: View, delta: number): View => {
  const i = v.year * 12 + v.month + delta;
  return {year: Math.floor(i / 12), month: i % 12};
};

function YearInput({value, onCommit}: {value: number; onCommit: (y: number) => void}): React.ReactElement {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      className={styles.year}
      type="number"
      min={2000}
      max={2100}
      value={text}
      aria-label="Year"
      onChange={(e) => {
        setText(e.target.value);
        const y = parseInt(e.target.value, 10);
        if (y >= 2000 && y <= 2100) onCommit(y);
      }}
    />
  );
}

interface PanelProps {
  view: View;
  onView: (v: View) => void;
  /** Range being shown: committed, or anchor + hovered day while picking. */
  from: string | null;
  to: string | null;
  today: string;
  onPick: (d: string) => void;
  onHover: (d: string | null) => void;
  nav: 'prev' | 'next';
  onNav: () => void;
}

function Panel({view, onView, from, to, today, onPick, onHover, nav, onNav}: PanelProps): React.ReactElement {
  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({length: days}, (_, i) => i + 1),
  ];

  const navButton = (
    <button
      type="button"
      className={styles.nav}
      aria-label={nav === 'prev' ? 'Previous month' : 'Next month'}
      onClick={onNav}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={nav === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
      </svg>
    </button>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        {nav === 'prev' && navButton}
        <select
          className={styles.month}
          aria-label="Month"
          value={view.month}
          onChange={(e) => onView({...view, month: Number(e.target.value)})}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <YearInput value={view.year} onCommit={(year) => onView({...view, year})} />
        {nav === 'next' && navButton}
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const date = iso(view.year, view.month, d);
          const disabled = date > today;
          const inRange = from !== null && to !== null && date >= from && date <= to;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              className={clsx(
                styles.day,
                inRange && styles.inRange,
                inRange && date === from && styles.rangeStart,
                inRange && date === to && styles.rangeEnd,
                date === today && styles.today,
              )}
              onClick={() => onPick(date)}
              onMouseEnter={() => onHover(date)}
              onMouseLeave={() => onHover(null)}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Button that opens a two-month calendar to pick a date range. Click a start
 * day, then an end day; the range applies as soon as the second day is picked.
 * Days after today are disabled.
 */
export default function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (r: DateRange | null) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({year: 2026, month: 0});
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    // Open on the range's first month, or on last month + this month.
    const today = todayIso();
    const base = value ? value.start : today;
    const [y, m] = base.split('-').map(Number);
    setView(value ? {year: y, month: m - 1} : shift({year: y, month: m - 1}, -1));
    setAnchor(null);
    setHover(null);
    setOpen(true);
  };

  const pick = (d: string) => {
    if (anchor === null) {
      setAnchor(d);
      return;
    }
    const [start, end] = anchor <= d ? [anchor, d] : [d, anchor];
    onChange({start, end});
    setAnchor(null);
    setOpen(false);
  };

  // While picking, preview the range from the anchor to the hovered day.
  let from: string | null = value?.start ?? null;
  let to: string | null = value?.end ?? null;
  if (anchor !== null) {
    const other = hover ?? anchor;
    [from, to] = anchor <= other ? [anchor, other] : [other, anchor];
  }

  const today = open ? todayIso() : '';

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={clsx(styles.trigger, open && styles.triggerOpen)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
          <path d="M3 8.5h14M7 3v3M13 3v3" />
        </svg>
        {formatRange(value)}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className={styles.popover} role="dialog" aria-label="Choose a date range">
          <div className={styles.panels}>
            <Panel
              nav="prev"
              view={view}
              onView={setView}
              onNav={() => setView(shift(view, -1))}
              from={from}
              to={to}
              today={today}
              onPick={pick}
              onHover={setHover}
            />
            <Panel
              nav="next"
              view={shift(view, 1)}
              onView={(v) => setView(shift(v, -1))}
              onNav={() => setView(shift(view, 1))}
              from={from}
              to={to}
              today={today}
              onPick={pick}
              onHover={setHover}
            />
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.clear}
              disabled={value === null && anchor === null}
              onClick={() => {
                onChange(null);
                setAnchor(null);
                setOpen(false);
              }}>
              Clear dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
