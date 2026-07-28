# grist-sprints — Grist grouped-view widget

> Grist custom widget — collapsible grouped view, Airtable/Notion-style. Groups records by any column with fold/unfold, group sorting, per-group colors, aggregate chips in group headers, and persisted options via `grist.setOption()`.

Fork of [maximelacoste/grist-widget-grouped-view](https://github.com/maximelacoste/grist-widget-grouped-view) with added **aggregates in group headers** and full **EN/FR localization**.

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
- **EN / FR localization** — interface language follows the browser locale (English by default)

## Setup

1. In your Grist document, add a widget → **Custom**
2. Set the custom URL to:
   ```
   https://arkhivar.github.io/grist-sprints/widget_groupes.html
   ```
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
- Day-aligned integer values (midnight UTC) in date-like columns render as
  `YYYY-MM-DD` in table cells instead of raw epoch numbers.
- ISO-text values render as `YYYY-MM-DD` when the time part is 00:00:00,
  otherwise as `YYYY-MM-DD HH:mm` (UTC). This cell rendering is **per value**:
  any string matching the ISO pattern is formatted even if the column as a
  whole is not date-like.

## Hosting

The widget is a set of small static files — no npm, no build step.

- **GitHub Pages**: enabled on this repo (source: `main` branch, root). Widget URL: `https://arkhivar.github.io/grist-sprints/widget_groupes.html`
- **Any static HTTP server** works too (Netlify, Scalingo, a public WebDAV share…)

## Files

The widget is split into small files (easier to review and maintain). All of
them must be deployed together — GitHub Pages serves them side by side from
the same repo, so no extra hosting steps are needed:

| File | Description |
|---|---|
| `widget_groupes.html` | Page shell — loads the CSS and the three scripts |
| `widget.css` | All styles |
| `widget-core.js` | i18n (EN/FR), constants, state, date helpers |
| `widget-app.js` | Settings panel, aggregates, Grist wiring, grouping, rendering, row actions |
| `widget-actions.js` | Multi-select state, selection action bar, bulk duplicate/delete |

## Credits

Original widget by [Maxime Lacoste](https://github.com/maximelacoste/grist-widget-grouped-view), shared on the [Grist community forum](https://community.getgrist.com/t/collapsible-grouped-view-based-on-column-values-custom-widget/13789).

## License

MIT
