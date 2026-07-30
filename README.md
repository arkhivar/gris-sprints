# grist-sprints — Grist grouped-view widget

> Grist custom widget — collapsible grouped view, Airtable/Notion-style. Groups records by any column with fold/unfold, group sorting, per-group colors, aggregate chips in group headers, and persisted options via `grist.setOption()`.

Fork of [maximelacoste/grist-widget-grouped-view](https://github.com/maximelacoste/grist-widget-grouped-view) with added **aggregates in group headers**. Since v5.0 the interface is **English-only**.

---

## Features

- **Group by any column** — dropdown selector in the toolbar
- **Date-aware grouping** — Date/DateTime columns (epoch seconds **or** ISO 8601 text) can be grouped **by day, month or year** (UTC-based), with chronological sorting (see below)
- **Fold / unfold** each group by clicking its header; **expand all / collapse all** in one click
- **Group sort**: alphabetical A→Z or Z→A, by record count ascending or descending
- **Row actions** — duplicate ⧉ and delete ✕ any record inline, always visible (two-step delete, requires **Full access**, see below)
- **Multi-select bulk actions** — tick row checkboxes (or a group's select-all), then duplicate / delete the whole selection from the bottom action bar
- **Aggregates in group headers** — configurable count / sum / avg / min / max chips per group (see below)
- **Stable color per group** (rotating palette) with per-group color picker
- **Null values** collected in an *(empty)* group, sorted last
- **Cell formatting**: booleans ✓/✗ (several display styles), plain numbers (no thousand separators — `-1425`, not `-1,425`), ISO dates, arrays
- **Unlimited group height by default** — uncollapsed groups show all their rows and the page scrolls; an optional per-group height cap can be enabled in settings (see below)
- **Persisted options** via `grist.setOption()` — grouping column, sort order, colors, height cap, and aggregate rules all survive page reload
- **English-only UI** — as of v5.0 the interface is English only (the old EN/FR auto-localization was removed)
- **⚙ Diagnostics section** — the settings panel ends with a diagnostics list showing the widget version, per-column type detection (value type, date-like yes/no) and the first raw value of each column via `JSON.stringify`, so invisible characters appear as `\uXXXX` escapes

## Setup

1. In your Grist document, add a widget → **Custom**
2. Set the custom URL to:
   ```
   https://arkhivar.github.io/grist-sprints/groups.html
   ```
   (The old `widget_groupes.html` URL still works — it redirects to `groups.html`.)
3. Select access level **Full access** — required for the row actions (duplicate / delete). With a lower level the view still works but the write actions fail with an error toast.
4. Pick a grouping column in the widget toolbar

## Row actions (duplicate / delete)

Every record row has a trailing actions cell with always-visible buttons
(dimmed at rest, full opacity on hover/focus):

- **⧉ Duplicate** — clones the record via `grist.selectedTable.create()` (all
  fields copied except `id` and `manualSort`).
- **✕ Delete** — **two-step**: the first click arms the button (red, `?`,
  auto-disarms after ~4 s); the second click executes
  `grist.selectedTable.destroy(id)`.

### Multi-select bulk actions

Each row starts with a checkbox; each group table header has a select-all
checkbox for that group. As soon as at least one record is selected, an action
bar appears at the bottom of the widget showing the selection count and three
buttons:

- **Duplicate selected** — clones every selected record (sequentially).
- **Delete selected** — same two-step arm/confirm pattern as per-row delete,
  then destroys every selected record.
- **Clear** — empties the selection.

The selection survives collapsing/expanding groups, and is pruned automatically
when records disappear (e.g. after a delete or a filter change).

These are **write operations**: the widget must be configured with **Full
access** in Grist (step 3 above). If access is insufficient, the operation is
rejected and a transient error toast is shown at the top of the widget. After a
successful action the widget does not patch its own state — Grist pushes fresh
records and the view re-renders.

## Group height

By default, uncollapsed groups have **no height limit**: all rows are visible
and the widget page scrolls. To restore the old capped behavior, open the
settings panel (⚙) and tick **Limit group height** — the slider (80–600 px)
then becomes active and each group body scrolls internally at that height.
Both the checkbox (`limitMaxH`) and the slider value (`maxGroupH`) are
persisted. Older widgets that only have a saved `maxGroupH` migrate to the
unlimited default (checkbox unticked).

## Aggregates in group headers

Each group header can show aggregate chips computed from that group's records,
next to the record count (e.g. `Σ Price 12480`). Numbers are rendered without
thousand separators (`-1425`, not `-1,425`); averages are rounded to ≤ 2
decimals.

1. Open the widget settings panel (⚙ button in the toolbar).
2. In the **Aggregates** section, pick a **function** and a **column**, then click **+ Add**. Repeat for as many rules as you need; remove a rule with its ✕ button.

Available functions:

| Function | Symbol | Eligible columns |
|---|---|---|
| Count (non-empty values) | `#` | any column |
| Sum | `Σ` | Numeric / Int only |
| Average | `x̄` | Numeric / Int only |
| Min | `↓` | Numeric / Int only |
| Max | `↑` | Numeric / Int only |

- Null / empty values are skipped; averages are rounded to at most 2 decimals; numbers are rendered plain, without thousand separators.
- Rules are persisted via `grist.setOption('aggregates', …)`, restored on reload, and recomputed on every data update.

## Date-aware grouping

Grist delivers **Date** and **DateTime** column values to custom widgets as Unix
epoch seconds (UTC). When a column's non-empty values are all numbers in the
plausible epoch range (1980-01-01 → 2100-01-01 UTC), the widget treats it as
date-like. **Text columns storing ISO 8601 dates** (e.g.
`2026-07-15T00:00:00.000Z` or `2026-07-15 14:30`) are detected the same way:
every non-empty value must match the ISO pattern, parse successfully, and fall
in the 1980 → 2100 range. Values without a timezone designator are interpreted
as UTC (`YYYY-MM-DD HH:mm` is normalized to `YYYY-MM-DDTHH:mmZ` before parsing).

Date-like columns (numeric or ISO text) get three extra granularities in the
**Group by** dropdown, in addition to the plain exact-value option:

- `Column — by day` → one group per UTC calendar day (label e.g. *7 Apr 2025*)
- `Column — by month` → one group per UTC month (label e.g. *April 2025*)
- `Column — by year` → one group per UTC year (label e.g. *2025*)

Details:

- **Bucketing is UTC-based** — day/month/year boundaries are computed with
  `Date.UTC`, so groups never shift with the viewer's local timezone.
- With a date granularity active, **A→Z / Z→A sort chronologically** by bucket
  start (not by label string); count sorts are unchanged and the *(empty)*
  group stays last.
- The selection is persisted as `Column::day|month|year` via
  `grist.setOption('groupBy', …)` and restored on reload; plain column names
  (no suffix) keep working exactly as before.
- Numeric values in date-like columns render as `YYYY-MM-DD` at midnight UTC
  or `YYYY-MM-DD HH:mm` otherwise, instead of raw epoch seconds.
- ISO-text values render as `YYYY-MM-DD` when the time part is 00:00:00,
  otherwise as `YYYY-MM-DD HH:mm` (UTC). This cell rendering is **per value**:
  any string matching the ISO pattern is formatted even if the column as a
  whole is not date-like. The parser is **tolerant of import artifacts**:
  invisible/format characters (zero-width spaces, LRM/RLM, bidi controls,
  soft hyphen, BOM…) are stripped and whitespace runs (including
  non-breaking spaces) are normalized before matching, so strings copied
  from exports still parse. ISO values exposed by Grist through object wrappers
  are normalized through the same strict parser.
- Duplicate actions fetch raw cell values and copy only writable columns;
  formula/helper fields are left for Grist to calculate. Delete actions use
  array operations for consistent single- and multi-row behavior. If an action
  fails, the widget shows the actual Grist API error and granted access level.
- Reference cells are fetched in Grist's typed, unexpanded format before
  duplication so Ref/RefList values remain valid IDs rather than decoded
  `RecordStub` objects. Diagnostics also records recent action payload types,
  outcomes, record IDs, table/access context, and complete API errors.

## Troubleshooting

- **Dates show as raw ISO text** (`2026-07-16T00:00:00.000Z`): the widget
  files are versioned (`?v=N` in the HTML) to defeat browser caching — reload
  the Grist document, or hard-refresh (Ctrl/Cmd+Shift+R). If a specific value
  still renders raw, it contains a character outside the tolerated set —
  open ⚙ → **Diagnostics** and check the column's `first:` value for
  `\uXXXX` escapes.
- **Widget shows all records / ignores the linked selection**: removing and
  re-adding a custom widget **resets its data selection**. Restore it via the
  widget's ⋮ menu → *Edit data selection*: source table **ungrouped**, and
  **Select By** = the linking summary widget.
- **Aggregate chips / grouping / colors disappeared after re-adding the
  widget**: display options are persisted per widget instance. Re-create
  aggregate rules via ⚙ → *Aggregates* → **+ Add**.
- **Duplicate / delete fails with an error toast**: the widget's access level
  must be **Full access** (set in the widget's data-selection panel).
- **Checkboxes render dark**: the widget declares `color-scheme: light` so
  native controls stay light even in dark-mode browsers; update to the latest
  `widget.css` if you host your own copy.

## Hosting

The widget is a set of small static files — no npm, no build step.

- **GitHub Pages**: enabled on this repo (source: `main` branch, root). Widget URL: `https://arkhivar.github.io/grist-sprints/groups.html`
- **Any static HTTP server** works too (Netlify, Scalingo, a public WebDAV share…)

## Files

The widget is split into small files (easier to review and maintain). All of
them must be deployed together — GitHub Pages serves them side by side from
the same repo, so no extra hosting steps are needed:

| File | Description |
|---|---|
| `groups.html` | Page shell — loads the CSS and the three scripts |
| `widget_groupes.html` | Redirect stub for the old URL (points to `groups.html`) |
| `widget.css` | All styles |
| `widget-core.js` | English UI strings, constants, state, date helpers |
| `widget-app.js` | Settings panel, aggregates, diagnostics, Grist wiring, grouping, rendering, row actions |
| `widget-actions.js` | Multi-select state, selection action bar, bulk duplicate/delete |

## Credits

Original widget by [Maxime Lacoste](https://github.com/maximelacoste/grist-widget-grouped-view), shared on the [Grist community forum](https://community.getgrist.com/t/collapsible-grouped-view-based-on-column-values-custom-widget/13789).

## License

MIT
