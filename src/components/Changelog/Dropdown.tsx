import React, {Fragment, useEffect, useRef, useState, type ReactNode} from 'react';
import clsx from 'clsx';
import styles from './Dropdown.module.css';

export interface MenuItem {
  id: string;
  label: string;
  /** Draw a divider under this item. */
  dividerAfter?: boolean;
  /** Show a trailing arrow: the item opens something else instead of just selecting. */
  opensMore?: boolean;
}

interface DropdownProps {
  icon: ReactNode;
  /** Text on the button, usually the label of the selected item. */
  label: string;
  items: MenuItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  /** Called when the menu opens or closes, so a sibling popover can close. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A button that opens a menu of single-choice items. The selected item is shown
 * in the accent color with a check mark.
 */
export default function Dropdown({
  icon,
  label,
  items,
  selectedId,
  onSelect,
  ariaLabel,
  onOpenChange,
}: DropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) change(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') change(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // `change` only calls setState and the parent callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={clsx(styles.trigger, open && styles.triggerOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => change(!open)}>
        {icon}
        {label}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label={ariaLabel}>
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <Fragment key={item.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={clsx(styles.item, selected && styles.itemSelected)}
                  onClick={() => {
                    change(false);
                    onSelect(item.id);
                  }}>
                  {item.label}
                  {item.opensMore ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  ) : selected ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 8.5l3.5 3.5L13 4.5" />
                    </svg>
                  ) : null}
                </button>
                {item.dividerAfter && <div className={styles.divider} role="separator" />}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
