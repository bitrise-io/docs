import React from 'react';

/**
 * Marks product names, UI labels, Step names, and other terms that must stay
 * in English in every locale. `translate="no"` also tells browser/OS-level
 * auto-translate tools to leave the content alone.
 *
 * Purely a marker — no lookup, no styling. For terms that also have a
 * glossary entry, nest `<GlossTerm>` inside this component rather than
 * conflating the two: GlossTerm renders a no-op fragment for terms that
 * aren't in migration/glossary.json, so it can't carry this meaning alone.
 *
 * Named `NT` (not `NoTranslate`) to keep it visually light in raw MDX
 * source — it appears thousands of times across the docs, so a long tag
 * name adds real reading friction. Must stay capitalized: JSX requires an
 * uppercase first letter to treat a tag as a component rather than a plain
 * (and here, meaningless) HTML element.
 */
export default function NT({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <span translate="no">{children}</span>;
}
