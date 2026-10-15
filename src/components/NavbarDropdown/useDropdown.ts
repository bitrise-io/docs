import {useEffect, useRef, useState, type RefObject} from 'react';

/**
 * Open/close state for a navbar dropdown: closes on an outside press or Escape.
 */
export default function useDropdown(): {
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  rootRef: RefObject<HTMLDivElement>;
} {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return {open, setOpen, rootRef};
}
