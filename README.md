# grist-sprints — Grist grouped-view widget

> Grist custom widget — collapsible grouped view, Airtable/Notion-style. Groups records by any column with fold/unfold, group sorting, per-group colors, aggregate chips in group headers, and persisted options via `grist.setOption()`.

Fork of [maximelacoste/grist-widget-grouped-view](https://github.com/maximelacoste/grist-widget-grouped-view) with added **aggregates in group headers** and full **EN/FR localization**.

---

## Features

- **Group by any column** — dropdown selector in the toolbar
- **Date-aware grouping** — Date/DateTime columns can be grouped **by day, month or year** (UTC-based), with chronological sorting (see below)
- **Fold / unfold** each group by clicking its header; **expand all / collapse all** in one click
- **Group sort**: alphabetical A→Z or Z→A, by record count ascending or descending
- **Aggregates in group headers** — configurable count / sum / avg / min / max chips per group (see below)
- **Stable color per group** (rotating palette) with per-group color picker
- **Null values** collected in an *(empty)* group, sorted last
- **Cell formatting**: booleans ✓/✗ (several display styles), localized numbers, arrays
- **Per-group scrolling** with adjustable max height
- **Persisted options** via `grist.setOption()` — grouping column, sort order, colors, and aggregate rules all survive page reload
- **EN / FR localization** — interface language follows the browser locale (English by default)

## Setup

1. In your Grist document, add a widget → **Custom**
2. Set the custom URL to:
   ```
   https://arkhivar.github.io/grist-sprints/widget_groupes.html
   ```
3. Select access level **Read table**
4. Pick a grouping column in the widget toolbar

## Aggregates in group headers

Each group header can show aggregate chips computed from that group's records,
next to the record count (e.g. `Σ Price 12,480`).

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

- Null / empty values are skipped; averages are rounded to at most 2 decimals; values are formatted with `toLocaleString` in the active locale.
- Rules are persisted via `grist.setOption('aggregates', …)`, restored on reload, and recomputed on every data update.

## Date-aware grouping

Grist delivers **Date** and **DateTime** column values to custom widgets as Unix
epoch seconds (UTC). When a column's non-empty values are all numbers in the
plausible epoch range (1980-01-01 → 2100-01-01 UTC), the widget treats it as
date-like and the **Group by** dropdown offers three extra granularities in
addition to the plain exact-value option:

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

## Hosting

The widget is a single self-contained HTML file — no npm, no build step.

- **GitHub Pages**: enabled on this repo (source: `main` branch, root). Widget URL: `https://arkhivar.github.io/grist-sprints/widget_groupes.html`
- **Any static HTTP server** works too (Netlify, Scalingo, a public WebDAV share…)

## Files

| File | Description |
|---|---|
| `widget_groupes.html` | Main (and only) widget file |

## Credits

Original widget by [Maxime Lacoste](https://github.com/maximelacoste/grist-widget-grouped-view), shared on the [Grist community forum](https://community.getgrist.com/t/collapsible-grouped-view-based-on-column-values-custom-widget/13789).

## License

MIT
