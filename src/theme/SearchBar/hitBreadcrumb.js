// The breadcrumb under a search result: where the match sits, never the match
// itself. DocSearch already prints the matched text as the result's title (the
// heading for a heading hit, a snippet for a content hit, the page title for a
// page hit), so repeating it in the trail would show it twice.
//
// The records come from scripts/build-search-index.js: lvl0 is the product
// section ("Bitrise CI"), lvl1 the page title, lvl2 and lvl3 the h2 and h3
// above the match. Deeper headings aren't spelled out, which keeps the line
// short.
//
//   page hit     (lvl1):    Bitrise CI
//   h2 hit       (lvl2):    Bitrise CI › Creating a Workflow
//   h3 hit       (lvl3):    Bitrise CI › Creating a Workflow › Adding Steps
//   content hit:            Bitrise CI › Creating a Workflow › Adding Steps

const TRAIL = ['lvl0', 'lvl1', 'lvl2', 'lvl3'];

export function hitBreadcrumb(hit) {
  const hierarchy = hit.hierarchy || {};
  const own = /^lvl(\d)$/.exec(hit.type || '');
  // A heading hit is its own title, so only the levels above it belong in the
  // trail. A content hit has no heading of its own: the whole trail does.
  const ownLevel = own ? Number(own[1]) : Infinity;
  const ownTitle = own ? hierarchy[hit.type] : null;
  return (
    TRAIL.filter((_, level) => level < ownLevel)
      .map((key) => hierarchy[key])
      .filter(Boolean)
      // Source quirks that would show the same words twice: a page named
      // after its own section ("Bitrise API › Bitrise API"), a heading that
      // repeats its page title, the same heading at two levels.
      .filter((crumb, i, crumbs) => crumbs.indexOf(crumb) === i && crumb !== ownTitle)
  );
}
