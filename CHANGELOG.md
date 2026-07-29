# Changelog

All notable changes to the grist-sprints grouped-view widget.

## v4.1 — 2026-07-29

### Fixed
- **ISO date parsing hardened** — strings stored by formulas/imports may carry
  invisible artifacts; `parseIsoDateSec` now strips zero-width characters
  (ZWSP U+200B, ZWNJ U+200C, ZWJ U+200D, word joiner U+2060, BOM U+FEFF) and
  normalizes whitespace runs (including non-breaking spaces) before matching.
  Previously such values fell back to raw text in cells and excluded the
  column from date-granularity grouping.
- **Checkboxes render dark in dark-mode browsers** — the widget now declares
  `color-scheme: light` on `:root` so native form controls keep the light
  theme regardless of the OS/browser color scheme.

### Changed
- Cache-buster bumped to `?v=5` on all CSS/JS URLs.
- README gains a **Troubleshooting** section (stale cache, lost widget
  linking after re-adding, wiped per-widget options, Full access requirement,
  dark checkboxes).

## v4 — 2026-07-29

### Added
- **Multi-select bulk actions** (`widget-actions.js`): checkbox column in
  every group table, per-group select-all, and a bottom action bar
  (*N selected — Duplicate selected / Delete selected / Clear*) shown while a
  selection exists. Bulk delete uses the same two-step arm/confirm pattern.
  Selection is pruned automatically when records disappear.
- Cache-busted asset URLs (`?v=4`) so browsers pick up new files reliably.

### Changed
- **Row action buttons (⧉ / ✕) are always visible** (dimmed at rest, full
  opacity on hover/focus) instead of hover-revealed.
- **ISO date cell rendering is per value** — no longer gated on the whole
  column passing the date-like check.
- **Numbers render without thousand separators** (`-1425`, not `-1,425`) in
  cells and aggregate chips; averages still rounded to ≤ 2 decimals.

## v3 — 2026-07-28

### Added
- **Row actions**: duplicate ⧉ / delete ✕ per record (two-step delete with
  4 s auto-disarm) via `grist.selectedTable.create/destroy`; requires
  `requiredAccess: 'full'`.
- **ISO 8601 text date support**: text columns storing ISO strings are
  detected as date-like and get day/month/year grouping; values without a
  timezone designator are treated as UTC.
- **Unlimited group height by default** (no internal scrollbar); optional
  height cap via ⚙ → *Limit group height* (persisted `limitMaxH`).
- Split the single-file widget into `widget.css`, `widget-core.js`,
  `widget-app.js` for maintainability.

## v2 — 2026-07-28

### Fixed
- **Empty GROUP BY dropdown** when the linked/filtered selection returns
  zero records: columns learned from previous non-empty fetches are kept
  (`knownDateCols` persists date-column knowledge), and the column selector
  is rebuilt on every `onRecords` — including empty ones.

## v1 — 2026-07-28

- Fork of
  [maximelacoste/grist-widget-grouped-view](https://github.com/maximelacoste/grist-widget-grouped-view)
  with **aggregate chips in group headers** (count/sum/avg/min/max, persisted
  via `grist.setOption('aggregates', …)`) and full **EN/FR localization**.
- Date-aware grouping (by day/month/year, UTC bucketing, chronological sort)
  for native Grist Date/DateTime columns (epoch seconds).
