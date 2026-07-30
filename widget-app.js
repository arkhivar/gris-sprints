  // ── 7. Settings panel — button ─────────────────────────
  btnSettings.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active', isOpen);
    btnSettings.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      refreshBoolSection();
      refreshEditableColumnsSection();
      refreshAggSection();
      refreshDiag();
    }
  });

  // ── 7b. Editable Text columns ──────────────────────────────
  function isTextColumnType(type) {
    return String(type || '').split(':')[0] === 'Text';
  }

  function editableTextCandidates() {
    const groupCol = parseGroupBy(groupBy).col;
    return allColumns.filter(col =>
      col !== groupCol &&
      writableColumnIds.includes(col) &&
      isTextColumnType(writableColumnTypes[col]));
  }

  function isEditableTextColumn(col) {
    return editableColumns.has(col) && editableTextCandidates().includes(col);
  }

  function saveEditableColumns() {
    editableColumnsConfigured = true;
    grist.setOption('editableColumns', JSON.stringify([...editableColumns].sort()));
  }

  function applyEditableColumnDefaults() {
    if (editableDefaultsApplied || editableColumnsConfigured) return;
    editableDefaultsApplied = true;
    // This widget's attendance-notes field is C. Enable it immediately when
    // it is a genuine writable Text column; every column remains configurable.
    if (writableColumnIds.includes('C') && isTextColumnType(writableColumnTypes.C)) {
      editableColumns.add('C');
      saveEditableColumns();
    }
  }

  function refreshEditableColumnsSection() {
    if (!editableColList) return;
    editableColList.innerHTML = '';
    if (!writableColumnIds.length) {
      const msg = document.createElement('span');
      msg.className = 'editable-col-empty';
      msg.textContent = T.editableLoading;
      editableColList.appendChild(msg);
      return;
    }
    const candidates = editableTextCandidates();
    if (!candidates.length) {
      const msg = document.createElement('span');
      msg.className = 'editable-col-empty';
      msg.textContent = T.editableNone;
      editableColList.appendChild(msg);
      return;
    }
    candidates.forEach(col => {
      const label = document.createElement('label');
      label.className = 'editable-col-option';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = editableColumns.has(col);
      cb.value = col;
      cb.addEventListener('change', () => {
        if (cb.checked) editableColumns.add(col);
        else editableColumns.delete(col);
        saveEditableColumns();
        render();
      });
      const text = document.createElement('span');
      text.textContent = col;
      label.appendChild(cb);
      label.appendChild(text);
      editableColList.appendChild(label);
    });
  }

  // ── 8. Boolean formats ────────────────────────────────────
  function buildBoolButtons() {
    boolRow.innerHTML = '';
    BOOL_FORMATS.forEach(fmt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bool-btn' + (fmt.key === boolFmtKey ? ' selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(fmt.key === boolFmtKey));
      btn.setAttribute('aria-label', T.boolFormatLabel + ' ' + fmt.label);
      btn.textContent = fmt.label;
      btn.addEventListener('click', () => {
        boolFmtKey = fmt.key;
        boolRow.querySelectorAll('.bool-btn').forEach(b => {
          b.classList.remove('selected');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        grist.setOption('boolFmtKey', boolFmtKey);
        render();
      });
      boolRow.appendChild(btn);
    });
  }

  // ── 10. Max height per group (checkbox + slider) ──
  // Unchecked (default): unlimited height, no internal scrolling.
  // Checked: the slider is active and caps the group height.
  function refreshMaxHControls() {
    document.getElementById('limit-maxh-cb').checked    = limitMaxH;
    document.getElementById('maxh-range').disabled      = !limitMaxH;
    document.getElementById('btn-reset-maxh').disabled  = !limitMaxH;
  }

  function syncMaxHUI() {
    const range   = document.getElementById('maxh-range');
    const valSpan = document.getElementById('maxh-val');
    range.value = maxGroupH;
    valSpan.textContent = maxGroupH + 'px';
    refreshMaxHControls();
    applyMaxGroupH();
  }

  function initMaxHSlider() {
    const range   = document.getElementById('maxh-range');
    const valSpan = document.getElementById('maxh-val');
    if (!range) return;
    document.getElementById('limit-maxh-cb').addEventListener('change', (e) => {
      limitMaxH = e.target.checked;
      refreshMaxHControls();
      applyMaxGroupH();
      grist.setOption('limitMaxH', limitMaxH);
    });
    range.addEventListener('input',  () => { valSpan.textContent = range.value + 'px'; });
    range.addEventListener('change', () => {
      maxGroupH = parseInt(range.value);
      applyMaxGroupH();
      grist.setOption('maxGroupH', maxGroupH);
    });
    document.getElementById('btn-reset-maxh').addEventListener('click', () => {
      maxGroupH = 200;
      range.value = 200;
      valSpan.textContent = '200px';
      applyMaxGroupH();
      grist.setOption('maxGroupH', maxGroupH);
    });
    syncMaxHUI();
  }

  // ── 10b. Aggregates ─────────────────────────────────────────
  // A column is eligible for numeric functions if all its non-empty
  // values are numbers (Grist Numeric/Int types).
  function isNumericColumn(col) {
    let hasNum = false;
    for (const r of allRecords) {
      const v = r[col];
      if (v == null || v === '') continue;
      if (typeof v !== 'number') return false;
      hasNum = true;
    }
    return hasNum;
  }

  function computeAggregate(records, rule) {
    const vals = records
      .map(r => r[rule.column])
      .filter(v => v != null && v !== '');
    if (rule.fn === 'count') return vals.length;
    const nums = vals.filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length === 0) return null;
    switch (rule.fn) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
      case 'min': return Math.min(...nums);
      case 'max': return Math.max(...nums);
    }
    return null;
  }

  function formatAggValue(v, fn) {
    if (fn === 'avg') v = Math.round(v * 100) / 100;   // ≤ 2 decimals
    return String(v);   // no thousand separators (-1425, never -1,425)
  }

  // Chips shown in the header after the record-count badge
  function buildAggChips(records) {
    if (!aggregates.length) return '';
    const chips = aggregates
      .filter(rule => AGG_FNS[rule.fn] && allColumns.includes(rule.column))
      .map(rule => {
        const v   = computeAggregate(records, rule);
        const txt = v == null ? '—' : formatAggValue(v, rule.fn);
        const meta = AGG_FNS[rule.fn];
        return `<span class="agg-chip" title="${esc(meta.label)} — ${esc(rule.column)}"`
             + `>${meta.symbol} ${esc(rule.column)} ${txt}</span>`;
      });
    return chips.length ? `<span class="agg-chips">${chips.join('')}</span>` : '';
  }

  function saveAggregates() {
    grist.setOption('aggregates', JSON.stringify(aggregates));
  }

  // Columns offered depend on the chosen function (numeric only
  // for sum/avg/min/max, all columns for count)
  function rebuildAggColSelect() {
    const fn = aggFnSelect.value || 'count';
    const numericOnly = AGG_FNS[fn] ? AGG_FNS[fn].numericOnly : false;
    aggColSelect.innerHTML = '';
    allColumns
      .filter(col => !numericOnly || isNumericColumn(col))
      .forEach(col => {
        const opt = document.createElement('option');
        opt.value = col; opt.textContent = col;
        aggColSelect.appendChild(opt);
      });
  }

  function refreshAggSection() {
    // Existing rules list
    aggList.innerHTML = '';
    if (aggregates.length === 0) {
      const note = document.createElement('p');
      note.className = 'agg-empty-note';
      note.textContent = T.aggNoRules;
      aggList.appendChild(note);
    }
    aggregates.forEach((rule, i) => {
      const meta = AGG_FNS[rule.fn];
      const row  = document.createElement('div');
      row.className = 'agg-row';

      const lbl = document.createElement('span');
      lbl.className = 'agg-row-label';
      lbl.innerHTML = `<span class="agg-fn-sym" aria-hidden="true">${meta.symbol}</span>`
                    + `${esc(rule.column)} · ${esc(meta.label)}`;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-reset-color';
      del.textContent = '✕';
      del.setAttribute('aria-label', T.aggRemove + ' ' + rule.column);
      del.addEventListener('click', () => {
        aggregates.splice(i, 1);
        saveAggregates();
        refreshAggSection();
        render();
      });

      row.appendChild(lbl);
      row.appendChild(del);
      aggList.appendChild(row);
    });
    rebuildAggColSelect();
  }

  // Diagnostics: per-column type detection + first raw value shown with
  // JSON.stringify so invisible characters appear as \uXXXX escapes.
  // (JSON.stringify alone does not escape format chars like LRM, so they
  // are escaped explicitly after serialization.)
  function refreshDiag() {
    const list = document.getElementById('diag-list');
    list.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'diag-row diag-head';
    head.textContent = `v${WIDGET_VERSION} · ${allRecords.length} records · ${allColumns.length} columns`;
    list.appendChild(head);
    const context = document.createElement('div');
    context.className = 'diag-row';
    context.textContent = `access: ${grantedAccessLevel} · table: ${selectedTableId}`;
    list.appendChild(context);
    const writable = document.createElement('div');
    writable.className = 'diag-row';
    writable.textContent = writableColumnIds.length
      ? `writable: ${writableColumnIds.join(', ')}`
      : 'writable: not loaded yet';
    list.appendChild(writable);
    const editable = document.createElement('div');
    editable.className = 'diag-row';
    editable.textContent = editableColumns.size
      ? `editable text: ${[...editableColumns].join(', ')}`
      : 'editable text: none';
    list.appendChild(editable);
    allColumns.forEach(col => {
      const first = allRecords.map(r => r[col]).find(v => v != null && v !== '');
      const row = document.createElement('div');
      row.className = 'diag-row';
      const raw = first === undefined ? '(empty)' : JSON.stringify(first)
        .replace(/[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g,
          c => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0'));
      row.textContent = `${col} · ${typeof first} · date-like: ${isDateLikeColumn(col) ? 'yes' : 'no'} · first: ${raw.length > 80 ? raw.slice(0, 80) + '…' : raw}`;
      list.appendChild(row);
    });
    if (actionDiagnostics.length) {
      const actionHead = document.createElement('div');
      actionHead.className = 'diag-row diag-head diag-action-head';
      actionHead.textContent = 'Recent record actions';
      list.appendChild(actionHead);
      actionDiagnostics.forEach(entry => {
        const row = document.createElement('div');
        row.className = `diag-row diag-action diag-${entry.status}`;
        const details = entry.details ? ` · ${entry.details}` : '';
        row.textContent = `${entry.time} · ${entry.action} · ${entry.status}${details}`;
        list.appendChild(row);
      });
    }
  }

  function initAggSection() {
    // Function dropdown (labels from T)
    Object.keys(AGG_FNS).forEach(fn => {
      const opt = document.createElement('option');
      opt.value = fn;
      opt.textContent = AGG_FNS[fn].symbol + ' ' + AGG_FNS[fn].label;
      aggFnSelect.appendChild(opt);
    });
    aggFnSelect.addEventListener('change', rebuildAggColSelect);
    btnAddAgg.addEventListener('click', () => {
      const col = aggColSelect.value;
      const fn  = aggFnSelect.value;
      if (!col || !AGG_FNS[fn]) return;
      if (AGG_FNS[fn].numericOnly && !isNumericColumn(col)) return;
      aggregates.push({ column: col, fn: fn });
      saveAggregates();
      refreshAggSection();
      render();
    });
    rebuildAggColSelect();
  }

  function isValidAggRule(r) {
    return r && typeof r.column === 'string' && typeof r.fn === 'string' && !!AGG_FNS[r.fn];
  }

  // ── 11. Grist ────────────────────────────────────────────
  // Full access required: row actions and editable Text cells write through
  // grist.selectedTable.create / update / destroy.
  grist.ready({ requiredAccess: 'full' });

  grist.onOptions((opts, settings) => {
    grantedAccessLevel = settings && settings.accessLevel
      ? settings.accessLevel
      : 'unknown';
    if (opts) {
      if (opts.groupBy)  { groupBy  = opts.groupBy;  groupSelect.value = groupBy;  }
      if (opts.sortMode) { sortMode = opts.sortMode; sortSelect.value  = sortMode; }
      if (opts.boolFmtKey && BOOL_FORMATS.find(f => f.key === opts.boolFmtKey))
        boolFmtKey = opts.boolFmtKey;
      if (opts.maxGroupH) maxGroupH = parseInt(opts.maxGroupH) || 200;
      // Backward compat: a saved maxGroupH without limitMaxH → unlimited (unchecked).
      if (opts.limitMaxH !== undefined)
        limitMaxH = opts.limitMaxH === true || opts.limitMaxH === 'true' || opts.limitMaxH === 1;
      syncMaxHUI();
      if (opts.aggregates) {
        try {
          const arr = JSON.parse(opts.aggregates);
          if (Array.isArray(arr)) aggregates = arr.filter(isValidAggRule);
        } catch(e) { aggregates = []; }
      }
      if (Object.prototype.hasOwnProperty.call(opts, 'editableColumns')) {
        editableColumnsConfigured = true;
        try {
          const arr = typeof opts.editableColumns === 'string'
            ? JSON.parse(opts.editableColumns)
            : opts.editableColumns;
          editableColumns = new Set(Array.isArray(arr)
            ? arr.filter(col => typeof col === 'string')
            : []);
        } catch (e) {
          editableColumns = new Set();
        }
      }
    }
    getWritableColumnIds().then(() => {
      applyEditableColumnDefaults();
      refreshEditableColumnsSection();
      refreshDiag();
      render();
    }).catch(err =>
      recordActionDiagnostic('Metadata', 'error',
        err && err.message ? err.message : String(err)));
    buildBoolButtons();
    refreshEditableColumnsSection();
    refreshAggSection();
    refreshDiag();
    render();
  });

  grist.onRecords((records) => {
    allRecords = records || [];
    // Prune the selection: drop ids missing from the new records
    if (selectedIds.size > 0) {
      const present = new Set(allRecords.map(r => String(r.id)));
      selectedIds.forEach(id => { if (!present.has(id)) selectedIds.delete(id); });
    }
    // updateSelBar lives in widget-actions.js (loaded later) — keep the typeof guard
    if (typeof updateSelBar === 'function') updateSelBar();
    dateLikeCache = new Map();
    if (allRecords.length > 0) {
      allColumns = Object.keys(allRecords[0])
        .filter(k => k !== 'id' && k !== 'manualSort');
      allColumns.forEach(c => {
        if (isDateLikeColumn(c)) knownDateCols.add(c);
        else knownDateCols.delete(c);
      });
    }
    // Always rebuild: already-known columns stay offered
    // even when the current filter returns no records.
    rebuildColumnSelect();
    if (settingsPanel.classList.contains('open')) refreshEditableColumnsSection();
    if (settingsPanel.classList.contains('open')) refreshAggSection();
    if (settingsPanel.classList.contains('open')) refreshDiag();
    render();
  });

  buildBoolButtons();
  initMaxHSlider();
  initAggSection();

  // ── 12. Column selector ──────────────────────────────
  function rebuildColumnSelect() {
    const prev = groupSelect.value;
    groupSelect.innerHTML = `<option value="">${T.chooseCol}</option>`;
    allColumns.forEach(col => {
      const opt = document.createElement('option');
      opt.value = col; opt.textContent = col;
      groupSelect.appendChild(opt);
      // Date-like columns: extra day / month / year granularities
      // (knownDateCols persists even when the current fetch is empty)
      if (knownDateCols.has(col)) {
        DATE_GRANULARITIES.forEach(g => {
          const o = document.createElement('option');
          o.value = `${col}::${g}`;
          o.textContent = `${col} — ${T[GRAN_I18N_KEY[g]]}`;
          groupSelect.appendChild(o);
        });
      }
    });
    const target = groupBy || prev;
    const values = Array.from(groupSelect.options).map(o => o.value);
    if (target && values.includes(target)) groupSelect.value = target;
  }

  groupSelect.addEventListener('change', () => {
    groupBy = groupSelect.value;
    collapsed.clear();
    grist.setOption('groupBy', groupBy);
    if (settingsPanel.classList.contains('open')) refreshEditableColumnsSection();
    render();
  });

  sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    grist.setOption('sortMode', sortMode);
    render();
  });

  document.getElementById('btn-expand').addEventListener('click', () => {
    collapsed.clear();
    document.querySelectorAll('.group.collapsed').forEach(el => {
      el.classList.remove('collapsed');
      el.querySelector('.group-header').setAttribute('aria-expanded', 'true');
    });
  });

  document.getElementById('btn-collapse').addEventListener('click', () => {
    getGroups().forEach(g => collapsed.add(g.key));
    document.querySelectorAll('.group:not(.collapsed)').forEach(el => {
      el.classList.add('collapsed');
      el.querySelector('.group-header').setAttribute('aria-expanded', 'false');
    });
  });

  // ── 13. Grouping ────────────────────────────────────────
  function getGroups() {
    if (!groupBy) return [];
    const { col, granularity } = parseGroupBy(groupBy);
    // Granularity active only if the column is still date-like
    const dateMode = !!granularity && allColumns.includes(col) && isDateLikeColumn(col);
    const map = new Map();
    allRecords.forEach(rec => {
      const raw = rec[col];
      let key, label, sortKey;
      if (raw == null || raw === '') {
        key = '\x00__empty__'; label = raw; sortKey = null;
      } else if (dateMode) {
        // raw = epoch (number) or ISO string → epoch seconds
        const sec = toEpochSec(raw);
        if (sec == null) {
          key = '\x00__empty__'; label = raw; sortKey = null;
        } else {
          const ms = bucketStartMs(sec, granularity);
          key     = String(ms);               // the key carries the bucket epoch
          label   = bucketLabel(ms, granularity);
          sortKey = ms;
        }
      } else {
        key = String(raw); label = raw; sortKey = null;
      }
      if (!map.has(key)) map.set(key, { key, label, sortKey, records: [] });
      map.get(key).records.push(rec);
    });
    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      if (a.key === '\x00__empty__') return  1;
      if (b.key === '\x00__empty__') return -1;
      // Chronological sort (bucket epoch) when grouping by date
      if (sortMode === 'alpha-asc')  return dateMode
        ? a.sortKey - b.sortKey
        : String(a.label).localeCompare(String(b.label), 'fr');
      if (sortMode === 'alpha-desc') return dateMode
        ? b.sortKey - a.sortKey
        : String(b.label).localeCompare(String(a.label), 'fr');
      if (sortMode === 'count-desc') return b.records.length - a.records.length;
      if (sortMode === 'count-asc')  return a.records.length - b.records.length;
      return 0;
    });
    return groups;
  }

  // ── 14. Rendering ─────────────────────────────────────────────
  function render() {
    Array.from(content.children).forEach(c => {
      if (c.id !== 'empty-state' && c.id !== 'toast') c.remove();
    });

    if (!groupBy || allRecords.length === 0) {
      emptyState.style.display = '';
      // No known column (never saw data): dedicated message.
      const noData = !groupBy && allColumns.length === 0;
      emptyState.querySelector('.empty-title').textContent =
        noData ? T.emptyNoDataTitle
               : (!groupBy ? T.emptyTitle : T.emptyTitleNoRec);
      emptyState.querySelector('.empty-sub').innerHTML =
        noData ? T.emptyNoDataSub
               : (!groupBy ? T.emptySub : T.emptySubNoRec);
      statsbar.classList.remove('visible');
      return;
    }

    emptyState.style.display = 'none';
    const groups      = getGroups();
    const groupCol    = parseGroupBy(groupBy).col;
    const displayCols = allColumns.filter(c => c !== groupCol);

    statsbar.classList.add('visible');
    statGroups.textContent  = groups.length;
    statRecords.textContent = allRecords.length;

    groups.forEach((group, groupIndex) => {
      const isCollapsed = collapsed.has(group.key);
      const isEmpty     = group.key === '\x00__empty__';
      const dotColor    = DEFAULT_PALETTE[groupIndex % DEFAULT_PALETTE.length];
      const labelTxt    = isEmpty ? T.emptyGroup : esc(String(group.label));
      const labelCls    = isEmpty ? 'group-label is-empty' : 'group-label';
      const bodyId      = 'grp-' + btoa(encodeURIComponent(group.key)).replace(/[^a-zA-Z0-9]/g, '');

      const card = document.createElement('article');
      card.className = 'group' + (isCollapsed ? ' collapsed' : '');

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'group-header';
      header.setAttribute('aria-expanded', String(!isCollapsed));
      header.setAttribute('aria-controls', bodyId);
      header.innerHTML = `
        <svg class="chevron" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true" focusable="false">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span class="group-dot" style="background:${dotColor}" aria-hidden="true"></span>
        <span class="${labelCls}">${labelTxt}</span>
        <span class="group-badge"
              aria-label="${group.records.length}\u00a0${group.records.length > 1 ? T.records : T.record}"
        >${group.records.length}</span>${buildAggChips(group.records)}`;

      header.addEventListener('click', () => {
        if (collapsed.has(group.key)) {
          collapsed.delete(group.key);
          card.classList.remove('collapsed');
          header.setAttribute('aria-expanded', 'true');
        } else {
          collapsed.add(group.key);
          card.classList.add('collapsed');
          header.setAttribute('aria-expanded', 'false');
        }
      });

      const body = document.createElement('div');
      body.className = 'group-body';
      body.id = bodyId;
      body.setAttribute('role', 'region');
      body.setAttribute('aria-label', T.ariaGroupRegion + labelTxt);

      const inner = document.createElement('div');
      inner.className = 'group-body-inner';
      inner.innerHTML = displayCols.length === 0
        ? `<p class="only-group-col">${T.noOtherCol}</p>`
        : buildTable(displayCols, group.records, labelTxt);

      body.appendChild(inner);
      card.appendChild(header);
      card.appendChild(body);
      content.appendChild(card);
    });
    refreshBoolSection();
  }

  function buildTable(cols, records, groupLabel) {
    // Multi-select column first, actions column last
    const thead = '<th class="col-sel"><input type="checkbox" class="sel-cb sel-cb-all"'
                + ` aria-label="${esc(T.selAll)}"></th>`
                + cols.map(c =>
      `<th scope="col" title="${esc(c)}">${esc(c)}</th>`
    ).join('') + '<th class="col-actions" aria-hidden="true"></th>';
    const tbody = records.map(rec => {
      const idStr = String(rec.id);
      const sel   = selectedIds.has(idStr);
      return `<tr${sel ? ' class="row-selected"' : ''}>`
      + `<td class="row-sel"><input type="checkbox" class="sel-cb sel-cb-row"`
      + ` data-id="${esc(idStr)}"${sel ? ' checked' : ''}`
      + ` aria-label="${esc(T.selAll)}"></td>`
      + `${cols.map(c => renderTableCell(rec, c)).join('')}`
      + `<td class="row-actions">${rowActionsHtml(rec)}</td></tr>`;
    }).join('');
    return `<div class="scroll-inner"><table class="rec-table">
      <caption>${T.groupCaption} ${esc(groupLabel)}</caption>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table></div>`;
  }

  // Per-row actions cell: duplicate ⧉ / delete ✕
  // (always visible, dimmed at rest; full opacity on hover / focus).
  function rowActionsHtml(rec) {
    const id = esc(String(rec.id));
    return `<button type="button" class="row-act act-dup" data-act="dup" data-id="${id}"`
         + ` title="${esc(T.dupRecord)}" aria-label="${esc(T.dupRecord)}">⧉</button>`
         + `<button type="button" class="row-act act-del" data-act="del" data-id="${id}"`
         + ` title="${esc(T.delRecord)}" aria-label="${esc(T.delRecord)}">✕</button>`;
  }

  // ── 14b. Row actions: delegation on #content ───────
  let toastTimer = null;
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'alert');
      content.prepend(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  function actionErrorMessage(action, err) {
    console.error(`Grist ${action} failed`, err);
    const detail = err && err.message ? err.message : String(err || 'Unknown error');
    recordActionDiagnostic(action, 'error', detail);
    const accessHint = grantedAccessLevel !== 'full'
      ? ` (granted access: ${grantedAccessLevel})`
      : '';
    return `${action} failed${accessHint}: ${detail}`.slice(0, 240);
  }

  function renderTableCell(rec, col) {
    const rendered = renderCell(rec[col], col);
    if (!isEditableTextColumn(col))
      return `<td>${rendered}</td>`;
    const id = esc(String(rec.id));
    const colAttr = esc(col);
    return `<td class="cell-editable">`
      + `<button type="button" class="cell-edit-btn" data-edit-id="${id}" data-edit-col="${colAttr}"`
      + ` aria-label="${esc(T.editCell)}: ${colAttr}">`
      + `<span class="cell-edit-value">${rendered}</span>`
      + `<span class="cell-edit-pencil" aria-hidden="true">✎</span>`
      + `</button></td>`;
  }

  function updateEditorCharacterCount() {
    cellEditorCount.textContent = `${cellEditorText.value.length} ${T.editCharacters}`;
  }

  function setEditorBusy(busy) {
    cellEditorText.disabled = busy;
    btnEditorClose.disabled = busy;
    btnEditorCancel.disabled = busy;
    btnEditorSave.disabled = busy;
    btnEditorSave.textContent = busy ? 'Saving…' : T.editSave;
  }

  function openTextEditor(idStr, col) {
    if (!isEditableTextColumn(col)) return;
    const recordId = validRecordId(idStr);
    const rec = allRecords.find(r => Number(r.id) === recordId);
    if (!rec) return;
    const value = rec[col] == null ? '' : String(rec[col]);
    editingCell = { recordId, col, originalValue: value };
    cellEditorTitle.textContent = `${T.editTitle} ${col}`;
    cellEditorMeta.textContent = `${T.editRecord} ${recordId} · ${selectedTableId}`;
    cellEditorText.setAttribute('aria-label', `${T.editTitle} ${col}`);
    cellEditorMeta.classList.remove('error');
    cellEditorText.value = value;
    updateEditorCharacterCount();
    setEditorBusy(false);
    cellEditor.hidden = false;
    requestAnimationFrame(() => {
      cellEditorText.focus();
      cellEditorText.setSelectionRange(value.length, value.length);
    });
  }

  function closeTextEditor() {
    if (btnEditorSave.disabled) return;
    cellEditor.hidden = true;
    editingCell = null;
    cellEditorText.value = '';
  }

  async function saveTextEditor() {
    if (!editingCell || btnEditorSave.disabled) return;
    const { recordId, col, originalValue } = editingCell;
    const nextValue = cellEditorText.value;
    if (nextValue === originalValue) {
      closeTextEditor();
      return;
    }
    setEditorBusy(true);
    cellEditorMeta.classList.remove('error');
    recordActionDiagnostic('Edit', 'start',
      `record=${recordId} · column=${col} · characters=${nextValue.length}`);
    try {
      await grist.selectedTable.update(
        { id: recordId, fields: { [col]: nextValue } },
        { parseStrings: false });
      recordActionDiagnostic('Edit', 'ok',
        `record=${recordId} · column=${col} · characters=${nextValue.length}`);
      const current = allRecords.find(r => Number(r.id) === recordId);
      if (current) current[col] = nextValue;
      setEditorBusy(false);
      closeTextEditor();
      render();
    } catch (err) {
      const message = actionErrorMessage('Edit', err);
      cellEditorMeta.textContent = message;
      cellEditorMeta.classList.add('error');
      setEditorBusy(false);
      cellEditorText.focus();
    }
  }

  function recordActionDiagnostic(action, status, details) {
    actionDiagnostics.unshift({
      time: new Date().toISOString().slice(11, 19),
      action,
      status,
      details: details ? String(details).slice(0, 500) : '',
    });
    actionDiagnostics.splice(12);
    if (settingsPanel.classList.contains('open')) refreshDiag();
  }

  function fieldTypeSummary(fields) {
    return Object.entries(fields).map(([colId, value]) => {
      let type;
      if (Array.isArray(value))
        type = `encoded:${String(value[0] || 'array')}`;
      else if (value === null)
        type = 'null';
      else
        type = typeof value;
      return `${colId}=${type}`;
    }).join(', ');
  }

  function normalizeTypedCell(value) {
    if (!Array.isArray(value) || typeof value[0] !== 'string') return value;
    switch (value[0]) {
      case 'R': return value[2]; // Ref → row ID
      case 'r': return ['L', ...(Array.isArray(value[2]) ? value[2] : [])]; // RefList
      case 'D': // DateTime → epoch seconds
      case 'd': return value[1]; // Date → epoch seconds
      case 'l': return normalizeTypedCell(value[1]); // Lookup → underlying value
      default:  return value;
    }
  }

  function validRecordId(idStr) {
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0)
      throw new Error(`Invalid record id: ${idStr}`);
    return id;
  }

  async function getWritableColumnIds() {
    if (writableColumnIdsPromise) return writableColumnIdsPromise;
    writableColumnIdsPromise = (async () => {
      const tableId = await grist.selectedTable.getTableId();
      selectedTableId = tableId;
      const tables = await grist.docApi.fetchTable('_grist_Tables');
      const tableIndex = (tables.tableId || []).indexOf(tableId);
      if (tableIndex < 0) throw new Error(`Table metadata not found for ${tableId}`);
      const tableRef = tables.id[tableIndex];
      const columns = await grist.docApi.fetchTable('_grist_Tables_column');
      const result = new Set();
      const typeMap = {};
      for (let i = 0; i < (columns.id || []).length; i++) {
        const colId = columns.colId[i];
        if (columns.parentId[i] !== tableRef || columns.isFormula[i]) continue;
        if (!colId || colId === 'manualSort' || colId.startsWith('gristHelper_')) continue;
        result.add(colId);
        typeMap[colId] = columns.type && columns.type[i] ? columns.type[i] : '';
      }
      writableColumnIds = [...result];
      writableColumnTypes = typeMap;
      recordActionDiagnostic('Metadata', 'ok',
        `table=${tableId} · writable=${writableColumnIds.join(', ')}`
        + ` · text=${writableColumnIds.filter(col => isTextColumnType(typeMap[col])).join(', ')}`);
      return result;
    })();
    try {
      return await writableColumnIdsPromise;
    } catch (err) {
      writableColumnIdsPromise = null;
      throw err;
    }
  }

  async function duplicateRecordById(idStr) {
    const recordId = validRecordId(idStr);
    recordActionDiagnostic('Duplicate', 'start', `record=${recordId}`);
    const raw = await grist.viewApi.fetchSelectedRecord(recordId, {
      cellFormat: 'typed',
      expandRefs: false,
      includeColumns: 'all',
    });
    if (!raw) throw new Error(`Record ${recordId} is no longer available`);
    const writable = await getWritableColumnIds();
    const typedFields = {};
    const fields = {};
    for (const colId of writable) {
      if (Object.prototype.hasOwnProperty.call(raw, colId)) {
        typedFields[colId] = raw[colId];
        fields[colId] = normalizeTypedCell(raw[colId]);
      }
    }
    // Keep the duplicate beside its source in Grist's underlying row order.
    // manualSort is a special writable column, so it is fetched separately
    // from the normal writable-column list and copied only when numeric.
    if (typeof raw.manualSort === 'number' && Number.isFinite(raw.manualSort)) {
      typedFields.manualSort = raw.manualSort;
      fields.manualSort = raw.manualSort;
    }
    recordActionDiagnostic('Duplicate payload', 'ok',
      `record=${recordId} · typed: ${fieldTypeSummary(typedFields)} · normalized: ${fieldTypeSummary(fields)}`);
    const created = await grist.selectedTable.create({ fields }, { parseStrings: false });
    const createdId = created && created.id != null ? created.id : 'unknown';
    recordActionDiagnostic('Duplicate', 'ok',
      `source=${recordId} · created=${createdId}`);
  }

  async function deleteRecordsByIds(idStrings) {
    const recordIds = idStrings.map(validRecordId);
    if (recordIds.length === 0) return;
    recordActionDiagnostic('Delete', 'start', `records=${recordIds.join(', ')}`);
    // Pass an array even for one record. This avoids older TableOperations
    // implementations rejecting the single-record response after deletion.
    await grist.selectedTable.destroy(recordIds);
    recordActionDiagnostic('Delete', 'ok', `records=${recordIds.join(', ')}`);
  }

  function disarmDelete(btn, idStr) {
    clearTimeout(armedDeletes.get(idStr));
    armedDeletes.delete(idStr);
    if (btn && btn.isConnected) {
      btn.classList.remove('armed');
      btn.textContent = '✕';
      btn.title = T.delRecord;
      btn.setAttribute('aria-label', T.delRecord);
    }
  }

  async function onDuplicate(btn, idStr) {
    const rec = allRecords.find(r => String(r.id) === idStr);
    if (!rec) return;
    btn.disabled = true;
    try {
      await duplicateRecordById(idStr);
      // No local mutation: Grist will send onRecords → re-render.
    } catch (err) {
      showToast(actionErrorMessage('Duplicate', err));
    } finally {
      // Re-enabled if the DOM was not rebuilt in the meantime.
      if (btn.isConnected) btn.disabled = false;
    }
  }

  async function onDelete(btn, idStr) {
    // First click: arm (two-step confirmation, auto-disarm ~4 s).
    if (!armedDeletes.has(idStr)) {
      btn.classList.add('armed');
      btn.textContent = '?';
      btn.title = T.confirmDel;
      btn.setAttribute('aria-label', T.confirmDel);
      armedDeletes.set(idStr, setTimeout(() => disarmDelete(btn, idStr), 4000));
      return;
    }
    // Second click: execute.
    clearTimeout(armedDeletes.get(idStr));
    armedDeletes.delete(idStr);
    btn.disabled = true;
    try {
      await deleteRecordsByIds([idStr]);
      // No local mutation: Grist will send onRecords → re-render.
    } catch (err) {
      showToast(actionErrorMessage('Delete', err));
      disarmDelete(btn, idStr);
    } finally {
      if (btn.isConnected) btn.disabled = false;
    }
  }

  content.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (btn && content.contains(btn) && !btn.disabled) {
      const idStr = btn.dataset.id;
      if (btn.dataset.act === 'dup') onDuplicate(btn, idStr);
      else if (btn.dataset.act === 'del') onDelete(btn, idStr);
      return;
    }
    const editBtn = e.target.closest('button[data-edit-id][data-edit-col]');
    if (editBtn && content.contains(editBtn) && !editBtn.disabled)
      openTextEditor(editBtn.dataset.editId, editBtn.dataset.editCol);
  });

  cellEditorText.addEventListener('input', updateEditorCharacterCount);
  cellEditorText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveTextEditor();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeTextEditor();
    }
  });
  btnEditorClose.addEventListener('click', closeTextEditor);
  btnEditorCancel.addEventListener('click', closeTextEditor);
  btnEditorSave.addEventListener('click', saveTextEditor);

  function renderCell(val, col) {
    if (val == null || val === '')
      return `<span class="cell-null" aria-label="${T.cellEmpty}">—</span>`;
    if (val === true || val === false) {
      const fmt = BOOL_FORMATS.find(f => f.key === boolFmtKey) || BOOL_FORMATS[0];
      return val ? fmt.t : fmt.f;
    }
    if (typeof val === 'number') {
      const isYearLike = Number.isInteger(val) && val >= 1000 && val <= 9999;
      if (isYearLike) return `<span class="cell-num">${val}</span>`;
      // Grist Date and DateTime columns both arrive as epoch seconds. Format
      // every value in a detected date column, not only midnight-aligned dates.
      if (col && isDateLikeColumn(col))
        return `<span class="cell-num">${formatUtcDateSec(val)}</span>`;
      return `<span class="cell-num">${String(val)}</span>`;
    }
    if (Array.isArray(val)) return esc(val.join(', '));
    // Grist can expose ISO values as primitive strings or object wrappers.
    // The strict parser prevents ordinary objects/text from being reformatted.
    const sec = parseDateValueSec(val);
    if (sec != null)
      return `<span class="cell-num">${formatUtcDateSec(sec)}</span>`;
    return esc(String(val));
  }
