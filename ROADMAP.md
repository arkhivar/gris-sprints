# Roadmap

This file records both shipped foundations and deferred ideas. Deferred ideas
are proposals, not promises about a particular release.

## Drag records between groups

### Implemented in v6.4

- Allow moving records only when the active grouping column is writable,
  non-formula, and has Grist type `Text` or single-value `Choice`.
- Dropping into an existing group writes that group's exact underlying value,
  rather than its formatted label.
- Dropping into the `(empty)` group clears the grouping value.
- Keep the record in its original group until Grist confirms the update. On
  success, animate it into the destination; on failure, leave it in place and
  report the complete error in the toast and Diagnostics.
- Highlight only valid destination groups while dragging. Collapsed groups
  remain valid destinations without needing to open.
- Recalculate group counts and numeric sums after the confirmed move.
- Do not enable moves for formula, numeric, Boolean, reference, multi-value,
  or date-bucket grouping in the first version.

### Unified selection and drag control — implemented in v6.4

The row checkboxes are replaced by one grip-shaped row control in the existing
selection column, so no additional table width is required.

- Click the grip to select the row; click it again to deselect it.
- Clicking additional grips builds a multi-row selection without requiring a
  keyboard modifier. The existing selected-count action bar and Clear action
  remain available.
- Pressing and moving the grip beyond a small pointer-distance threshold starts
  a drag instead of toggling selection. Suppress the click after a completed or
  cancelled drag so dropping never changes selection accidentally.
- Give selected grips a clear accent state without restoring square checkbox
  visuals.
- Expose each grip as a real button with `aria-pressed`, an accessible row
  label, and normal keyboard selection via Space/Enter.
- Replace the old group-header checkbox with a visually matching, non-checkbox
  “select all in this group” control, preserving fast bulk selection.
- If a dragged row is already part of a multi-selection, show a count in the
  drag preview and move the selected records together. If it is not selected,
  drag only that row.
- Use Pointer Events rather than browser-native HTML drag-and-drop so the same
  interaction can support mouse, pen, and touch.

### Guardrails — implemented in v6.4

- Never write the displayed group label; retain a raw write value on every
  group and use that value in `grist.selectedTable.update()`.
- Recheck that the record exists and the grouping column is still writable
  immediately before saving.
- Ignore drops back into the record's current group.
- Make invalid targets visibly inactive and let Escape cancel a drag.
- Record move start, destination, affected record IDs, success, and full API
  errors in Diagnostics.
- Respect `prefers-reduced-motion` for the post-drop transition.

## Deferred grouping types

### Choice List

Grist `ChoiceList` cells may contain several tags. Before enabling drag-and-drop,
choose an explicit meaning:

- replace the complete list with the destination group value;
- remove the source tag and add the destination tag; or
- add the destination tag while retaining all existing tags.

The first version should not guess between these behaviors.

### Date and DateTime buckets

Postpone moving records grouped by day, month, or year until the conversion rule
is configurable and visible to the user.

A future implementation may preserve the smaller date components when changing
the bucket. It must reject or explicitly resolve invalid results—for example,
moving `2024-02-29 14:30` into year 2025—and define whether it clamps to the
last valid day, asks the user, or cancels the move.

Exact-value Date/DateTime groups are less ambiguous and may be considered
separately: a drop could copy the destination group's exact underlying epoch
value.

### Other types

- `Ref` groups could eventually write the destination record ID, never its
  displayed label.
- Numeric and Boolean groups are technically writable but should be opt-in
  because moving a card would silently change business data.
- Formula columns remain permanently read-only.
