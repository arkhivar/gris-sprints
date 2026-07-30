# Changelog

All notable changes to the grist-sprints grouped-view widget.

## v5.5 — 2026-07-30

- Normalize typed Grist values before duplication: Ref cells become row IDs,
  RefLists become Grist lists of row IDs, Date/DateTime cells become epoch
  seconds, and lookup wrappers are unwrapped recursively.
- Remove the Group Colors settings UI, saved color options, event handlers,
  and customization styles; groups retain an automatic visual palette.
- Expand Diagnostics to use the freed settings space and show typed versus
  normalized duplicate payload field types.
- Bumped static asset cache keys so the reference-normalization fix loads.

## v5.4 — 2026-07-30

- Fetch duplicate payloads with `cellFormat: "typed"` and unexpanded
  references so Ref/RefList cells stay valid Grist values instead of decoded
  `RecordStub` objects.
- Expand Diagnostics with granted access, selected table ID, writable columns,
  encoded payload types, created/deleted record IDs, recent action status, and
  full API error messages.
- Increase the diagnostics panel height and color-code action outcomes.
- Bumped static asset cache keys so the typed-reference fix loads.

## v5.3 — 2026-07-30

- Duplicate records from raw Grist values and copy only writable columns,
  excluding formula, helper, ID, and manual-sort fields.
- Delete records in one array operation, including single-row deletes, for
  compatibility with TableOperations implementations that reject the scalar
  response after deleting successfully.
- Report the real Grist API error and granted access level instead of showing
  a misleading Full-access message for every action failure.
- Bumped static asset cache keys so the corrected record actions load.

## v5.2 — 2026-07-29

- Format ISO dates supplied by Grist as object-wrapped cell values, rather
  than handling primitive JavaScript strings only.
- Bumped static asset cache keys to ensure the wrapper-aware formatter loads.

## v5.1 — 2026-07-29

- Fixed DateTime epoch values with a non-midnight time rendering as raw
  numbers; Date and DateTime values now share the UTC cell formatter.
- Bumped all static asset URLs so browsers and GitHub Pages cannot reuse a
  cached pre-fix v5 script that still displays ISO transport strings.

## v5.0 — 2026-07-29

### Changed
- **English rebrand** — the widget page is now `groups.html`
  (`<html lang="en">`, English static markup); `widget_groupes.html` becomes
  a tiny redirect stub (`<meta http-equiv="refresh">` + `location.replace`)
  so existing embeds keep working.
- **French localization removed** — the `I18N.fr` dictionary and the
  `navigator.language` switch are gone; `T` is now a flat English-only dict
  and `LOCALE` is fixed to `en-US`. All code comments are in English.

### Added
- **Version badge** in the toolbar (`v5.0`), fed from the new
  `WIDGET_VERSION` constant.
- **Diagnostics section** in the settings panel (⚙): widget version, record
  and column counts, and per-column detection (JS type, date-like yes/no,
  first raw value rendered with `JSON.stringify` so invisible characters
  appear as `\uXXXX` escapes).

### Fixed
- **Widened invisible-character strip** in `parseIsoDateSec` — in addition to
  ZWSP/ZWNJ/ZWJ/word joiner/BOM, the parser now also strips soft hyphen
  (U+00AD), Mongolian vowel separator (U+180E), LRM/RLM (U+200E/U+200F),
  bidi embedding/override controls (U+202A–U+202E), deprecated format
  characters (U+2061–U+2064) and bidi isolates (U+2066–U+2069) before
  matching ISO dates.

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
