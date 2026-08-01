# Architecture and capability boundaries

This note exists so future development sessions can recover the widget's
architecture without rediscovering how Grist and GitHub Pages divide the work.

## What runs where

| Layer | Responsibility |
|---|---|
| GitHub Pages | Serves the static HTML, CSS, and JavaScript. It has no database, background worker, or secret storage. |
| Widget iframe | Renders the interface, reacts to pointer/keyboard events, computes groups and sums, and calls the Grist plugin API. |
| Grist plugin bridge | Connects the iframe to the containing document, subject to the widget's granted access level. |
| Grist document | Stores records, formulas, references, attachments, and saved widget options. It is the backend for this widget. |
| Optional external service | Needed for secret API keys, AI calls, long-running jobs, scheduled work, large-file processing, or integrations outside Grist. |

The production widget imports Grist's bridge from
`https://docs.getgrist.com/grist-plugin-api.js`. Full access lets the widget
read and modify document data; access should only be granted to trusted widget
code. See Grist's [Custom Widget documentation](https://support.getgrist.com/widget-custom/).

## Startup lifecycle

Grist delivers the following independently; their callback order is not
guaranteed:

1. `grist.onOptions(...)` supplies saved widget options and interaction details.
2. `grist.onRecords(...)` supplies the records selected for this widget.
3. Metadata calls such as `grist.docApi.fetchTable(...)` supply real column
   datatypes and formula/writability information.

Code that depends on more than one source must wait for every required source.
For example, automatic grouping waits for options, records, and metadata so it
can choose a real single-value `Choice` column without overwriting a valid
saved grouping or mistaking `ChoiceList` for `Choice`.

## Persistence

Widget configuration is not stored in this repository or in browser cookies.
It is stored by Grist as JSON options belonging to the particular custom-widget
section. The write/read pattern is:

```js
await grist.setOption('groupBy', groupBy);

grist.onOptions((options) => {
  if (options && options.groupBy) groupBy = options.groupBy;
});
```

After an option changes, Grist may show its green **Save** control. Applying
that change commits the section configuration to the document and makes it
available to collaborators. A second widget using the same GitHub Pages URL
has its own options because persistence belongs to the widget section, not the
URL. See the official [Widget options API](https://support.getgrist.com/code/interfaces/grist_plugin_api.WidgetAPI/).

Currently persisted:

- grouping column and group sort;
- shared column order and widths;
- editable-column choices;
- boolean display format;
- group-height settings.

Currently session-only:

- selected record IDs;
- expanded/collapsed groups;
- open editor state;
- drag state and transient animations.

Widget options are suitable for compact configuration, not business records,
logs, media, or secrets. Those belong in Grist tables or an external service.

## Data access and writes

- `grist.onRecords(...)` follows the widget's selected table, filters, and
  linking configuration.
- `grist.selectedTable` performs row operations on that selected table.
- `grist.docApi.fetchTable(...)` can read other tables when access allows it.
- `grist.docApi.applyUserActions(...)` can perform document actions when full
  access allows it.
- Grist's REST API can support services operating outside the widget. Prefer
  document-scoped OAuth/connected-app access over embedding an account-wide API
  key. See [REST API usage](https://support.getgrist.com/rest-api/).
- Grist webhooks can notify an external service when rows are added or changed,
  enabling background workflows. See [Webhooks](https://support.getgrist.com/webhooks/).

## Practical boundaries

The iframe can implement almost any ordinary browser interface: dashboards,
calendars, timelines, canvases, charts, rich editors, drag-and-drop workflows,
audio capture, and multi-step tools. Grist remains responsible for document
permissions and data.

Do not put secrets in JavaScript served by GitHub Pages: every visitor can read
them. Calls requiring an AI key, email credential, payment key, or private
third-party token need a small server-side endpoint. Long-running or scheduled
work also needs Grist Automations/webhooks or an external worker because a
widget only runs while its page is open. Large media should normally live in
Grist attachments or object storage, with metadata and URLs stored in tables.

When adding a feature, first decide whether it is:

1. **View/configuration state** → widget options.
2. **School data** → Grist tables and references.
3. **Immediate document interaction** → Grist plugin API.
4. **Secret, scheduled, long-running, or integration work** → external backend
   connected through webhooks or the REST API.
