  // ── 7. Settings panel — button ─────────────────────────
  btnSettings.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active', isOpen);
    btnSettings.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) { refreshColorGrid(); refreshBoolSection(); refreshAggSection(); refreshDiag(); }
  });

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

  // ── 9. Color grid ─────────────────────────────────
  function refreshColorGrid() {
    colorGrid.innerHTML = '';
    const groups = getGroups();
    if (groups.length === 0) {
      const msg = document.createElement('p');
      msg.style.cssText = 'font-size:11px;color:var(--muted);font-style:italic';
      msg.textContent = T.noGroups;
      colorGrid.appendChild(msg);
      return;
    }
    groups.forEach((group, i) => {
      const isEmpty = group.key === '\x00__empty__';
      const label   = isEmpty ? T.emptyGroup : String(group.label);
      const color   = colColors[group.key] || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];

      const row   = document.createElement('div');
      row.className = 'color-row';

      const wrap   = document.createElement('div');
      wrap.className = 'color-input-wrap';

      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.background = color;
      swatch.setAttribute('aria-hidden', 'true');

      const input = document.createElement('input');
      input.type  = 'color';
      input.value = color;
      input.setAttribute('aria-label', T.colorLabel + ' ' + label);
      input.addEventListener('input',  () => { swatch.style.background = input.value; });
      input.addEventListener('change', () => {
        colColors[group.key] = input.value;
        swatch.style.background = input.value;
        saveColors(); render();
      });

      wrap.appendChild(swatch);
      wrap.appendChild(input);

      const lbl = document.createElement('span');
      lbl.className   = 'color-row-label' + (isEmpty ? ' is-empty' : '');
      lbl.textContent = label;

      const resetBtn = document.createElement('button');
      resetBtn.type      = 'button';
      resetBtn.className = 'btn-reset-color';
      resetBtn.textContent = T.reset;
      resetBtn.setAttribute('aria-label', T.resetColorLabel + ' ' + label);
      resetBtn.addEventListener('click', () => {
        const def = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
        colColors[group.key] = def;
        input.value = def;
        swatch.style.background = def;
        saveColors(); render();
      });

      row.appendChild(wrap);
      row.appendChild(lbl);
      row.appendChild(resetBtn);
      colorGrid.appendChild(row);
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
  // Full access required: row actions (duplicate / delete)
  // write to the table via grist.selectedTable.create / destroy.
  grist.ready({ requiredAccess: 'full' });

  grist.onOptions((opts) => {
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
      if (opts.colColors) {
        try { colColors = JSON.parse(opts.colColors); } catch(e) { colColors = {}; }
      }
      if (opts.aggregates) {
        try {
          const arr = JSON.parse(opts.aggregates);
          if (Array.isArray(arr)) aggregates = arr.filter(isValidAggRule);
        } catch(e) { aggregates = []; }
      }
    }
    buildBoolButtons();
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
    render();
    if (settingsPanel.classList.contains('open')) refreshColorGrid();
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
    groups.forEach((g, i) => {
      if (!colColors[g.key]) colColors[g.key] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
    });
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

    groups.forEach(group => {
      const isCollapsed = collapsed.has(group.key);
      const isEmpty     = group.key === '\x00__empty__';
      const dotColor    = colColors[group.key] || '#94a3b8';
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
      + `${cols.map(c => `<td>${renderCell(rec[c], c)}</td>`).join('')}`
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
      const fields = { ...rec };
      delete fields.id;
      delete fields.manualSort;
      await grist.selectedTable.create({ fields });
      // No local mutation: Grist will send onRecords → re-render.
    } catch (err) {
      showToast(T.actionFailed);
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
      await grist.selectedTable.destroy(Number(idStr));
      // No local mutation: Grist will send onRecords → re-render.
    } catch (err) {
      showToast(T.actionFailed);
      disarmDelete(btn, idStr);
    } finally {
      if (btn.isConnected) btn.disabled = false;
    }
  }

  content.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !content.contains(btn) || btn.disabled) return;
    const idStr = btn.dataset.id;
    if (btn.dataset.act === 'dup') onDuplicate(btn, idStr);
    else if (btn.dataset.act === 'del') onDelete(btn, idStr);
  });

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
    // ISO 8601 string detected per value → "YYYY-MM-DD" (midnight UTC)
    // or "YYYY-MM-DD HH:mm" otherwise. parseIsoDateSec is strict (regex +
    // 1980–2100 range), so no risk of reformatting ordinary text.
    if (typeof val === 'string') {
      const sec = parseIsoDateSec(val);
      if (sec != null) {
        return `<span class="cell-num">${formatUtcDateSec(sec)}</span>`;
      }
    }
    return esc(String(val));
  }
