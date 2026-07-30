  // в”Ђв”Ђ 7. Settings panel вЂ” button в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  btnSettings.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active', isOpen);
    btnSettings.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) { refreshColorGrid(); refreshBoolSection(); refreshAggSection(); refreshDiag(); }
  });

  // в”Ђв”Ђ 8. Boolean formats в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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

  // в”Ђв”Ђ 9. Color grid в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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

  // в”Ђв”Ђ 10. Max height per group (checkbox + slider) в”Ђв”Ђ
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

  // в”Ђв”Ђ 10b. Aggregates в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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
    if (fn === 'avg') v = Math.round(v * 100) / 100;   // в‰¤ 2 decimals
    return String(v);   // no thousand separators (-1425, never -1,425)
  }

  // Chips shown in the header after the record-count badge
  function buildAggChips(records) {
    if (!aggregates.length) return '';
    const chips = aggregates
      .filter(rule => AGG_FNS[rule.fn] && allColumns.includes(rule.column))
      .map(rule => {
        const v   = computeAggregate(records, rule);
        const txt = v == null ? 'вЂ”' : formatAggValue(v, rule.fn);
        const meta = AGG_FNS[rule.fn];
        return `<span class="agg-chip" title="${esc(meta.label)} вЂ” ${esc(rule.column)}"`
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
                    + `${esc(rule.column)} В· ${esc(meta.label)}`;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-reset-color';
      del.textContent = 'вњ•';
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
    head.textContent = `v${WIDGET_VERSION} В· ${allRecords.length} records В· ${allColumns.length} columns`;
    list.appendChild(head);
    allColumns.forEach(col => {
      const first = allRecords.map(r => r[col]).find(v => v != null && v !== '');
      const row = document.createElement('div');
      row.className = 'diag-row';
      const raw = first === undefined ? '(empty)' : JSON.stringify(first)
        .replace(/[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g,
          c => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0'));
      row.textContent = `${col} В· ${typeof first} В· date-like: ${isDateLikeColumn(col) ? 'yes' : 'no'} В· first: ${raw.length > 80 ? raw.slice(0, 80) + 'вЂ¦' : raw}`;
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

  // в”Ђв”Ђ 11. Grist в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  // Full access required: row actions (duplicate / delete)
  // write to the table via grist.selectedTable.create / destroy.
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
      // Backward compat: a saved maxGroupH without limitMaxH в†’ unlimited (unchecked).
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
    // updateSelBar lives in widget-actions.js (loaded later) вЂ” keep the typeof guard
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

  // в”Ђв”Ђ 12. Column selector в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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
          o.textContent = `${col} вЂ” ${T[GRAN_I18N_KEY[g]]}`;
          groupSelect.appendChild(o);
   г«h‘йм¶»§q«^u€
\™Щ]	‰€[Y\Лљ[ЫY\К\™Щ]
JHЬ›Э\Щ[XЭќ[YHH\™Щ]В€B‚€Ь›Э\Щ[XЭY]™[ќ\Э[™\Љ	ШЪ[™ЩIЛ

HO€В€Ь›Э\ћHHЬ›Э\Щ[XЭќ[YNВ€ЫЫ\ЩYЫX\Љ
NВ€Ьљ\ЭњЩ]Ь[ЫЉ	ЩЬ›Э\ћIЛЬ›Э\ћJNВ€™[™\Љ
NВ€Y€
Щ][™ЬФ[™[Ы\ЬУ\ЭЫЫќZ[њК	ЫЬ[‰КJH™Yњ™\ЪЫЫЬ‘ЬљY

NВ€JNВ‚€ЫЬќЩ[XЭY]™[ќ\Э[™\Љ	ШЪ[™ЩIЛ

HO€В€ЫЬќ[ЩHHЫЬќЩ[XЭќ[YNВ€Ьљ\ЭњЩ]Ь[ЫЉ	ЬЫЬќ[ЩIЛЫЬќ[ЩJNВ€™[™\Љ
NВ€JNВ‚€ШЭ[Y[ќ™Щ][[Y[ќћRY
	Шќ‹Y^[™	КKY]™[ќ\Э[™\Љ	ШЫXЪЙЛ

HO€В€ЫЫ\ЩYЫX\Љ
NВ€ШЭ[Y[ќњ]Y\ћTЩ[XЭЬђ[
	Л™Ь›Э\ЫЫ\ЩY	КK™›Ь‘XXЪ
[O€В€[Ы\ЬУ\Эњ™[[Э™J	ШЫЫ\ЩY	КNВ€[њ]Y\ћTЩ[XЭЬЉ	Л™Ь›Э\ZXY\‰КKњЩ]]љXќ]J	Ш\љXKY^[™Y	Л	ЭќYIКNВ€JNВ€JNВ‚€ШЭ[Y[ќ™Щ][[Y[ќћRY
	Шќ‹XЫЫ\ЩIКKY]™[ќ\Э[™\Љ	ШЫXЪЙЛ

HO€В€Щ]Ь›Э\К
K™›Ь‘XXЪ
ИO€ЫЫ\ЩYY
ЛљЩ^JJNВ€ШЭ[Y[ќњ]Y\ћTЩ[XЭЬђ[
	Л™Ь›Э\››Э
ЫЫ\ЩY
IКK™›Ь‘XXЪ
[O€В€[Ы\ЬУ\ЭY
	ШЫЫ\ЩY	КNВ€[њ]Y\ћTЩ[XЭЬЉ	Л™Ь›Э\ZXY\‰КKњЩ]]љXќ]J	Ш\љXKY^[™Y	Л	Щ[ЩIКNВ€JNВ€JNВ‚€ЛИ8Ґ 8Ґ LЛ€Ь›Э\[™И8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ €ќ[Э[Ы€Щ]Ь›Э\К
HВ€Y€
YЬ›Э\ћJH™]\›€ЧNВ€ЫЫњЭИЫЫЬ[ќ[\љ]HHH\њЩQЬ›Э\ћJЬ›Э\ћJNВ€ЛИЬ[ќ[\љ]HXЭ]™HЫ›HY€HЫЫ[[€\ИЭ[]K[ZЩB€ЫЫњЭ]S[ЩHHHYЬ[ќ[\љ]H	‰€[ЫЫ[[њЛљ[ЫY\КЫЫ
H	‰€\С]SZЩPЫЫ[[ЉЫЫ
NВ€ЫЫњЭX\H™]ИX\

NВ€[™XЫЬ™Л™›Ь‘XXЪ
™XИO€В€ЫЫњЭ]ИH™XЦШЫЫNВ€]Щ^KX™[ЫЬќЩ^NВ€Y€
]ИOHќ[]ИOOH	ЙКHВ€Щ^HH	ЧЧЩ[\WЧЙОИX™[H]ОИЫЬќЩ^HHќ[В€H[ЩHY€
]S[ЩJHВ€ЛИ]ИH\ШЪ
ќ[X™\ЉHЬ€TУИЭљ[™И8Ў¤€\ШЪЩXЫЫ™В€ЫЫњЭЩXИHС\ШЪЩXК]КNВ€Y€
ЩXИOHќ[
HВ€Щ^HH	ЧЧЩ[\WЧЙОИX™[H]ОИЫЬќЩ^HHќ[В€H[ЩHВ€ЫЫњЭ\ИHќXЪЩ]Э\ќ\КЩXЛЬ[ќ[\љ]JNВ€Щ^HHЭљ[™К\КNИЛИHЩ^HШ\њљY\ИHќXЪЩ]\ШЪ€X™[HќXЪЩ]X™[
\ЛЬ[ќ[\љ]JNВ€ЫЬќЩ^HH\ОВ€B€H[ЩHВ€Щ^HHЭљ[™К]КNИX™[H]ОИЫЬќЩ^HHќ[В€B€Y€
[X\љ\КЩ^JJHX\њЩ]
Щ^KИЩ^KX™[ЫЬќЩ^K™XЫЬ™О€ЧHJNВ€X\™Щ]
Щ^JKњ™XЫЬ™Лњ\Ъ
™XКNВ€JNВ€ЫЫњЭЬ›Э\ИH\њ^K™њ›ЫJX\ќ[Y\К
JNВ€Ь›Э\Л™›Ь‘XXЪ

ЛJHO€В€Y€
XЫЫЫЫЬњЦЩЛљЩ^WJHЫЫЫЫЬњЦЩЛљЩ^WHHQђUSФSUVЪH	HQђUSФSUK›[™ЭNВ€JNВ€Ь›Э\ЛњЫЬќ

KЉHO€В€Y€
KљЩ^HOOH	ЧЧЩ[\WЧЙКH™]\›€NВ€Y€
‹љЩ^HOOH	ЧЧЩ[\WЧЙКH™]\›€LNВ€ЛИЪ›Ы›ЫЩЪXШ[ЫЬќ
ќXЪЩ]\ШЪ
HЪ[€Ь›Э\[™ИћH]B€Y€
ЫЬќ[ЩHOOH	Ш[KX\ШЙКH™]\›€]S[ЩB€ИKњЫЬќЩ^HH‹њЫЬќЩ^B€€Эљ[™КK›X™[
K›ШШ[PЫЫ\\™JЭљ[™К‹›X™[
K	Щњ‰КNВ€Y€
ЫЬќ[ЩHOOH	Ш[KY\ШЙКH™]\›€]S[ЩB€И‹њЫЬќЩ^HHKњЫЬќЩ^B€€Эљ[™К‹›X™[
K›ШШ[PЫЫ\\™JЭљ[™КK›X™[
K	Щњ‰КNВ€Y€
ЫЬќ[ЩHOOH	ШЫЭ[ќY\ШЙКH™]\›€‹њ™XЫЬ™Л›[™ЭHKњ™XЫЬ™Л›[™ЭВ€Y€
ЫЬќ[ЩHOOH	ШЫЭ[ќX\ШЙКH™]\›€Kњ™XЫЬ™Л›[™ЭH‹њ™XЫЬ™Л›[™ЭВ€™]\›€В€JNВ€™]\›€Ь›Э\ОВ€B‚€ЛИ8Ґ 8Ґ M€™[™\љ[™И8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ €ќ[Э[Ы€™[™\Љ
HВ€\њ^K™њ›ЫJЫЫќ[ќЪ[™[ЉK™›Ь‘XXЪ
ИO€В€Y€
ЛљYOOH	Щ[\K\Э]IИ	‰€ЛљYOOH	ЭШ\Э	КHЛњ™[[Э™J
NВ€JNВ‚€Y€
YЬ›Э\ћH[™XЫЬ™Л›[™ЭOOH
HВ€[\TЭ]KњЭ[K™\Ь^HH	ЙОВ€ЛИ›ИЫ›ЭЫ€ЫЫ[[€
™]™\€Ш]И]JN€YXШ]YY\ЬШYЩK‚€ЫЫњЭ›С]HHYЬ›Э\ћH	‰€[ЫЫ[[њЛ›[™ЭOOHВ€[\TЭ]Kњ]Y\ћTЩ[XЭЬЉ	Л™[\K]]IКKќ^ЫЫќ[ќB€›С]HИ™[\S›С]U]B€€
YЬ›Э\ћHИ™[\U]H€™[\U]S›Ф™XКNВ€[\TЭ]Kњ]Y\ћTЩ[XЭЬЉ	Л™[\K\ЭX‰КKљ[›™\’SB€›С]HИ™[\S›С]TЭX‚€€
YЬ›Э\ћHИ™[\TЭX€€™[\TЭX“›Ф™XКNВ€Э]Ш\‹Ы\ЬУ\Эњ™[[Э™J	Эљ\ЪX›IКNВ€™]\›ЋВ€B‚€[\TЭ]KњЭ[K™\Ь^HH	Ы›Ы™IОВ€ЫЫњЭЬ›Э\ИHЩ]Ь›Э\К
NВ€ЫЫњЭЬ›Э\ЫЫH\њЩQЬ›Э\ћJЬ›Э\ћJKЫЫВ€ЫЫњЭ\Ь^PЫЫИH[ЫЫ[[њЛ™љ[\ЉИO€ИOOHЬ›Э\ЫЫ
NВ‚€Э]Ш\‹Ы\ЬУ\ЭY
	Эљ\ЪX›IКNВ€Э]Ь›Э\Лќ^ЫЫќ[ќHЬ›Э\Л›[™ЭВ€Э]™XЫЬ™Лќ^ЫЫќ[ќH[™XЫЬ™Л›[™ЭВ‚€Ь›Э\Л™›Ь‘XXЪ
Ь›Э\O€В€ЫЫњЭ\РЫЫ\ЩYHЫЫ\ЩYљ\КЬ›Э\љЩ^JNВ€ЫЫњЭ\С[\HHЬ›Э\љЩ^HOOH	ЧЧЩ[\WЧЙОВ€ЫЫњЭЭЫЫЬ€HЫЫЫЫЬњЦЩЬ›Э\љЩ^WH	ИОMLШЋ	ОВ€ЫЫњЭX™[H\С[\HИ™[\QЬ›Э\€\ШКЭљ[™КЬ›Э\›X™[
JNВ€ЫЫњЭX™[ЫИH\С[\HИ	ЩЬ›Э\[X™[\ЛY[\IИ€	ЩЬ›Э\[X™[	ОВ€ЫЫњЭ›ЩRYH	ЩЬњIИ
ИќШJ[ЫЩUT’PЫЫ\Ы™[ќ
Ь›Э\љЩ^JJKњ™\XЩJЦЧK^ђKVЊNWKЩЛ	ЙКNВ‚€ЫЫњЭШ\™HШЭ[Y[ќЬ™X]Q[[Y[ќ
	Ш\ќXЫIКNВ€Ш\™Ы\ЬУ[YHH	ЩЬ›Э\	И
И
\РЫЫ\ЩYИ	ИЫЫ\ЩY	И€	ЙКNВ‚€ЫЫњЭXY\€HШЭ[Y[ќЬ™X]Q[[Y[ќ
	Шќ]Ы‰КNВ€XY\‹ќ\HH	Шќ]Ы‰ОВ€XY\‹Ы\ЬУ[YHH	ЩЬ›Э\ZXY\‰ОВ€XY\‹њЩ]]љXќ]J	Ш\љXKY^[™Y	ЛЭљ[™КZ\РЫЫ\ЩY
JNВ€XY\‹њЩ]]љXќ]J	Ш\љXKXЫЫќ›ЫЙЛ›ЩRY
NВ€XY\‹љ[›™\’SH€Э™ИЫ\ЬПHЪ]њ›Ы€€љY]Р›ЮHЊЌЌ€љ[H››Ы™H‚€Э›ЪЩOHЭ\њ™[ќЫЫЬ€€Э›ЪЩK]ЪYHЊ‹ЌH‚€Э›ЪЩK[[™XШ\Hњ›Э[™€Э›ЪЩK[[™Z›Ъ[ЏHњ›Э[™‚€\љXKZY[ЏHќќYH€›ШЭ\ШX›OH™[ЩHЏ‚€Ы[[™HЪ[ќПHЌ€HL€MHNH‹П‚€ЬЭ™П‚€Ь[€Ы\ЬПH™Ь›Э\YЭ€Э[OHXЪЩЬ›Э[™‰ЩЭЫЫЬџH€\љXKZY[ЏHќќYHЏЏЬЬ[Џ‚€Ь[€Ы\ЬПH‰ЫX™[ЫЯHЏ‰ЫX™[OЬЬ[Џ‚€Ь[€Ы\ЬПH™Ь›Э\XYЩH‚€\љXK[X™[H‰ЩЬ›Э\њ™XЫЬ™Л›[™ЭWLL	ЩЬ›Э\њ™XЫЬ™Л›[™Э€HИњ™XЫЬ™И€њ™XЫЬ™H‚€‰ЩЬ›Э\њ™XЫЬ™Л›[™ЭOЬЬ[Џ‰ШќZ[YЩРЪ\КЬ›Э\њ™XЫЬ™К_XВ‚€XY\‹Y]™[ќ\Э[™\Љ	ШЫXЪЙЛ

HO€В€Y€
ЫЫ\ЩYљ\КЬ›Э\љЩ^JJHВ€ЫЫ\ЩY™[]JЬ›Э\љЩ^JNВ€Ш\™Ы\ЬУ\Эњ™[[Э™J	ШЫЫ\ЩY	КNВ€XY\‹њЩ]]љXќ]J	Ш\љXKY^[™Y	Л	ЭќYIКNВ€H[ЩHВ€ЫЫ\ЩYY
Ь›Э\љЩ^JNВ€Ш\™Ы\ЬУ\ЭY
	ШЫЫ\ЩY	КNВ€XY\‹њЩ]]љXќ]J	Ш\љXKY^[™Y	Л	Щ[ЩIКNВ€B€JNВ‚€ЫЫњЭ›ЩHHШЭ[Y[ќЬ™X]Q[[Y[ќ
	Щ]‰КNВ€›ЩKЫ\ЬУ[YHH	ЩЬ›Э\X›ЩIОВ€›ЩKљYH›ЩRYВ€›ЩKњЩ]]љXќ]J	Ь›ЫIЛ	Ь™YЪ[Ы‰КNВ€›ЩKњЩ]]љXќ]J	Ш\љXK[X™[	Л\љXQЬ›Э\™YЪ[Ы€
ИX™[
NВ‚€ЫЫњЭ[›™\€HШЭ[Y[ќЬ™X]Q[[Y[ќ
	Щ]‰КNВ€[›™\‹Ы\ЬУ[YHH	ЩЬ›Э\X›ЩKZ[›™\‰ОВ€[›™\‹љ[›™\’SH\Ь^PЫЫЛ›[™ЭOOH€ИЫ\ЬПH›Ы›KYЬ›Э\XЫЫЏ‰Х››УЭ\ђЫЫOЬ€€ќZ[X›J\Ь^PЫЫЛЬ›Э\њ™XЫЬ™ЛX™[
NВ‚€›ЩK\[™Ъ[
[›™\ЉNВ€Ш\™\[™Ъ[
XY\ЉNВ€Ш\™\[™Ъ[
›ЩJNВ€ЫЫќ[ќ\[™Ъ[
Ш\™
NВ€JNВ€™Yњ™\Ъ›ЫЫЩXЭ[ЫЉ
NВ€B‚€ќ[Э[Ы€ќZ[X›JЫЫЛ™XЫЬ™ЛЬ›Э\X™[
HВ€ЛИ][K\Щ[XЭЫЫ[[€љ\њЭXЭ[ЫњИЫЫ[[€\Э€ЫЫњЭXYH	ПЫ\ЬПHЫЫ\Щ[ЏЏ[њ]\OHЪXЪШ›Ю€Ы\ЬПHњЩ[XШ€Щ[XШ‹X[‰В€
И\љXK[X™[H‰Щ\ШКњЩ[[
_HЏЏЭ€
ИЫЫЛ›X\
ИO‚€ШЫЬOHЫЫ€]OH‰Щ\ШКК_HЏ‰Щ\ШКК_OЭ€
Kљ›Ъ[Љ	ЙКH
И	ПЫ\ЬПHЫЫXXЭ[ЫњИ€\љXKZY[ЏHќќYHЏЏЭ‰ОВ€ЫЫњЭ›ЩHH™XЫЬ™Л›X\
™XИO€В€ЫЫњЭYЭ€HЭљ[™К™XЛљY
NВ€ЫЫњЭЩ[HЩ[XЭYYЛљ\КYЭЉNВ€™]\›€‰ЬЩ[И	ИЫ\ЬПHњ›ЭЛ\Щ[XЭY‰И€	ЙЯO€
ИЫ\ЬПHњ›ЭЛ\Щ[ЏЏ[њ]\OHЪXЪШ›Ю€Ы\ЬПHњЩ[XШ€Щ[XШ‹\›ЭИ€
И]KZYH‰Щ\ШКYЭЉ_H‰ЬЩ[И	ИЪXЪЩY	И€	ЙЯX€
И\љXK[X™[H‰Щ\ШКњЩ[[
_HЏЏЭ€
И	ШЫЫЛ›X\
ИO€‰Ь™[™\ђЩ[
™XЦШЧKК_OЭ
Kљ›Ъ[Љ	ЙК_X€
ИЫ\ЬПHњ›ЭЛXXЭ[ЫњИЏ‰Ь›ЭРXЭ[ЫњТ[
™XК_OЭЏЭЏВ€JKљ›Ъ[Љ	ЙКNВ€™]\›€]€Ы\ЬПHњШЬ›ЫZ[›™\€ЏЏX›HЫ\ЬПHњ™XЛ]X›HЏ‚€Ш\[ЫЏ‰Х™Ь›Э\Ш\[ЫџH	Щ\ШКЬ›Э\X™[
_OШШ\[ЫЏ‚€XYЏЏ‰ЭXYOЭЏЏЭXY‚€›ЩO‰Э›Щ_OЭ›ЩO‚€ЭX›OЏЩ]ЏВ€B‚€ЛИ\‹\›ЭИXЭ[ЫњИЩ[€\XШ]H8©вHИ[]H8§%B€ЛИ
[Ш^\Иљ\ЪX›K[[YY]™\ЭИќ[ЬXЪ]HЫ€Э™\€И›ШЭ\КK‚€ќ[Э[Ы€›ЭРXЭ[ЫњТ[
™XКHВ€ЫЫњЭYH\ШКЭљ[™К™XЛљY
JNВ€™]\›€ќ]Ы€\OHќ]Ы€€Ы\ЬПHњ›ЭЛXXЭXЭY\€]KXXЭH™\€]KZYH‰ЪYH€
И]OH‰Щ\ШК™\™XЫЬ™
_H€\љXK[X™[H‰Щ\ШК™\™XЫЬ™
_HЏё©вOШќ]ЫЏ€
Иќ]Ы€\OHќ]Ы€€Ы\ЬПHњ›ЭЛXXЭXЭY[€]KXXЭH™[€]KZYH‰ЪYH€
И]OH‰Щ\ШК™[™XЫЬ™
_H€\љXK[X™[H‰Щ\ШК™[™XЫЬ™
_HЏё§%OШќ]ЫЏВ€B‚€ЛИ8Ґ 8Ґ M‹€›ЭИXЭ[ЫњО€[YШ][Ы€Ы€ШЫЫќ[ќ8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ 8Ґ €]Ш\Э[Y\€Hќ[В€ќ[Э[Ы€ЪЭХШ\Э
\ЩКHВ€]Ш\ЭHШЭ[Y[ќ™Щ][[Y[ќћRY
	ЭШ\Э	КNВ€Y€
]Ш\Э
HВ€Ш\ЭHШЭ[Y[ќЬ™X]Q[[Y[ќ
	Щ]‰КNВ€Ш\ЭљYH	ЭШ\Э	ОВ€Ш\ЭЫ\ЬУ[YHH	ЭШ\Э	ОВ€Ш\ЭњЩ]]љXќ]J	Ь›ЫIЛ	Ш[\ќ	КNВ€ЫЫќ[ќњ™\[™
Ш\Э
NВ€B€Ш\Эќ^ЫЫќ[ќH\ЩОВ€Ш\ЭЫ\ЬУ\ЭY
	Эљ\ЪX›IКNВ€ЫX\•[Y[Э]
Ш\Э[Y\ЉNВ€Ш\Э[Y\€HЩ][Y[Э]


HO€Ш\ЭЫ\ЬУ\Эњ™[[Э™J	Эљ\ЪX›IКK
NВ€B‚€ќ[Э[Ы€XЭ[Ы‘\њ›Ь“Y\ЬШYЩJXЭ[Ы‹\њЉHВ€ЫЫњЫЫK™\њ›ЬЉЬљ\Э	ШXЭ[ЫџHZ[Y\њЉNВ€ЫЫњЭ]Z[H\њ€	‰€\њ‹›Y\ЬШYЩHИ\њ‹›Y\ЬШYЩH€Эљ[™К\њ€	Х[љЫ›ЭЫ€\њ›Ь‰КNВ€ЫЫњЭXШЩ\ЬТ[ќHЬ[ќYXШЩ\ЬУ]™[OOH	Щќ[	В€И
Ь[ќYXШЩ\ЬО€	ЩЬ[ќYXШЩ\ЬУ]™[JX€€	ЙОВ€™]\›€	ШXЭ[ЫџHZ[Y	ШXШЩ\ЬТ[ќN€	Щ]Z[XњЫXЩJЌ
NВ€B‚€ќ[Э[Ы€[Y™XЫЬ™Y
YЭЉHВ€ЫЫњЭYHќ[X™\ЉYЭЉNВ€Y€
Sќ[X™\‹љ\Т[ќYЩ\ЉY
HYH
B€›ЭИ™]И\њ›ЬЉ[ќ[Y™XЫЬ™Y€	ЪYЭџX
NВ€™]\›€YВ€B‚€\Ю[Иќ[Э[Ы€Щ]Ьљ]X›PЫЫ[[’YК
HВ€Y€
Ьљ]X›PЫЫ[[’YФ›ЫZ\ЩJH™]\›€Ьљ]X›PЫЫ[[’YФ›ЫZ\ЩNВ€Ьљ]X›PЫЫ[[’YФ›ЫZ\ЩHH
\Ю[И

HO€В€ЫЫњЭX›RYH]ШZ]Ьљ\ЭњЩ[XЭYX›K™Щ]X›RY

NВ€ЫЫњЭX›\ИH]ШZ]Ьљ\Э™ШР\K™™]ЪX›J	ЧЩЬљ\ЭХX›\ЙКNВ€ЫЫњЭX›R[™^H
X›\ЛќX›RYЧJKљ[™^ЩЉX›RY
NВ€Y€
X›R[™^
H›ЭИ™]И\њ›ЬЉX›HY]Y]H›Э›Э[™›Ь€	ЭX›RYX
NВ€ЫЫњЭX›T™Y€HX›\ЛљYЭX›R[™^NВ€ЫЫњЭЫЫ[[њИH]ШZ]Ьљ\Э™ШР\K™™]ЪX›J	ЧЩЬљ\ЭХX›\ЧШЫЫ[[‰КNВ€ЫЫњЭ™\Э[H™]ИЩ]

NВ€›Ь€
]HHИH
ЫЫ[[њЛљYЧJK›[™ЭИJККHВ€ЫЫњЭЫЫYHЫЫ[[њЛЫЫYЪWNВ€Y€
ЫЫ[[њЛњ\™[ќYЪWHOOHX›T™Y€ЫЫ[[њЛљ\С›Ь›][VЪWJHЫЫќ[ќYNВ€Y€
XЫЫYЫЫYOOH	ЫX[ќX[ЫЬќ	ИЫЫYњЭ\ќХЪ]
	ЩЬљ\Э[\—ЙКJHЫЫќ[ќYNВ€™\Э[Y
ЫЫY
NВ€B€™]\›€™\Э[В€JJ
NВ€ћHВ€™]\›€]ШZ]Ьљ]X›PЫЫ[[’YФ›ЫZ\ЩNВ€HШ]Ъ
\њЉHВ€Ьљ]X›PЫЫ[[’YФ›ЫZ\ЩHHќ[В€›ЭИ\њЋВ€B€B‚€\Ю[Иќ[Э[Ы€\XШ]T™XЫЬ™ћRY
YЭЉHВ€ЫЫњЭ™XЫЬ™YH[Y™XЫЬ™Y
YЭЉNВ€ЫЫњЭ]ИH]ШZ]Ьљ\ЭќљY]Р\K™™]ЪЩ[XЭY™XЫЬ™
™XЫЬ™YВ€ЩY\[ЫЩY€ќYK€^[™™YњО€[ЩK€[ЫYPЫЫ[[њО€	Ы›Ь›X[	Л€JNВ€Y€
\]КH›ЭИ™]И\њ›ЬЉ™XЫЬ™	Ь™XЫЬ™YH\И›ИЫ™Щ\€]Z[X›X
NВ€ЫЫњЭЬљ]X›HH]ШZ]Щ]Ьљ]X›PЫЫ[[’YК
NВ€ЫЫњЭљY[ИHЯNВ€›Ь€
ЫЫњЭЫЫYЩ€Ьљ]X›JHВ€Y€
Шљ™XЭњ›ЭЭ\Kљ\УЭЫ”›Ь\ќKШ[
]ЛЫЫY
JB€љY[ЦШЫЫYHH]ЦШЫЫYNВ€B€]ШZ]Ьљ\ЭњЩ[XЭYX›KЬ™X]JИљY[ИKИ\њЩTЭљ[™ЬО€[ЩHJNВ€B‚€\Ю[Иќ[Э[Ы€[]T™XЫЬ™РћRYКYЭљ[™ЬКHВ€ЫЫњЭ™XЫЬ™YИHYЭљ[™ЬЛ›X\
[Y™XЫЬ™Y
NВ€Y€
™XЫЬ™YЛ›[™ЭOOH
H™]\›ЋВ€ЛИ\ЬИ[€\њ^H]™[€›Ь€Ы™H™XЫЬ™€\И]›ЪYИЫ\€X›SЬ\][ЫњВ€ЛИ[\[Y[ќ][ЫњИ™Z™XЭ[™ИHЪ[™ЫK\™XЫЬ™™\ЬЫњЩHYќ\€[][Ы‹‚€]ШZ]Ьљ\ЭњЩ[XЭYX›K™\Э›ЮJ™XЫЬ™YКNВ€B‚€ќ[Э[Ы€\Ш\›Q[]Jќ‹YЭЉHВ€ЫX\•[Y[Э]
\›YY[]\Л™Щ]
YЭЉJNВ€\›YY[]\Л™[]JYЭЉNВ€Y€
ќ€	‰€ќ‹љ\РЫЫ›™XЭY
HВ€ќ‹Ы\ЬУ\Эњ™[[Э™J	Ш\›YY	КNВ€ќ‹ќ^ЫЫќ[ќH	ш§%IОВ€ќ‹ќ]HH™[™XЫЬ™В€ќ‹њЩ]]љXќ]J	Ш\љXK[X™[	Л™[™XЫЬ™
NВ€B€B‚€\Ю[Иќ[Э[Ы€Ы‘\XШ]Jќ‹YЭЉHВ€ЫЫњЭ™XИH[™XЫЬ™Л™љ[™
€O€Эљ[™К‹љY
HOOHYЭЉNВ€Y€
\™XКH™]\›ЋВ€ќ‹™\ШX›YHќYNВ€ћHВ€]ШZ]\XШ]T™XЫЬ™ћRY
YЭЉNВ€ЛИ›ИШШ[]]][ЫЋ€Ьљ\ЭЪ[Щ[™Ы”™XЫЬ™И8Ў¤€™K\™[™\‹‚€HШ]Ъ
\њЉHВ€ЪЭХШ\Э
XЭ[Ы‘\њ›Ь“Y\ЬШYЩJ	С\XШ]IЛ\њЉJNВ€Hљ[[HВ€ЛИ™KY[X›YY€HУHШ\И›Э™XќZ[[€HYX[ќ[YK‚€Y€
ќ‹љ\РЫЫ›™XЭY
Hќ‹™\ШX›YH[ЩNВ€B€B‚€\Ю[Иќ[Э[Ы€Ы‘[]Jќ‹YЭЉHВ€ЛИљ\њЭЫXЪО€\›H
ЫЛ\Э\ЫЫ™љ\›X][Ы‹]]ЛY\Ш\›HЌКK‚€Y€
X\›YY[]\Лљ\КYЭЉJHВ€ќ‹Ы\ЬУ\ЭY
	Ш\›YY	КNВ€ќ‹ќ^ЫЫќ[ќH	ПЙОВ€ќ‹ќ]HHЫЫ™љ\›Q[В€ќ‹њЩ]]љXќ]J	Ш\љXK[X™[	ЛЫЫ™љ\›Q[
NВ€\›YY[]\ЛњЩ]
YЭ‹Щ][Y[Э]


HO€\Ш\›Q[]Jќ‹YЭЉK
JNВ€™]\›ЋВ€B€ЛИЩXЫЫ™ЫXЪО€^XЭ]K‚€ЫX\•[Y[Э]
\›YY[]\Л™Щ]
YЭЉJNВ€\›YY[]\Л™[]JYЭЉNВ€ќ‹™\ШX›YHќYNВ€ћHВ€]ШZ][]T™XЫЬ™РћRYКЪYЭ—JNВ€ЛИ›ИШШ[]]][ЫЋ€Ьљ\ЭЪ[Щ[™Ы”™XЫЬ™И8Ў¤€™K\™[™\‹‚€HШ]Ъ
\њЉHВ€ЪЭХШ\Э
XЭ[Ы‘\њ›Ь“Y\ЬШYЩJ	С[]IЛ\њЉJNВ€\Ш\›Q[]Jќ‹YЭЉNВ€Hљ[[HВ€Y€
ќ‹љ\РЫЫ›™XЭY
Hќ‹™\ШX›YH[ЩNВ€B€B‚€ЫЫќ[ќY]™[ќ\Э[™\Љ	ШЫXЪЙЛ
JHO€В€ЫЫњЭќ€HKќ\™Щ]ЫЬЩ\Э
	Шќ]Ы–Щ]KXXЭIКNВ€Y€
Xќ€XЫЫќ[ќЫЫќZ[њКќЉHќ‹™\ШX›Y
H™]\›ЋВ€ЫЫњЭYЭ€Hќ‹™]\Щ]љYВ€Y€
ќ‹™]\Щ]XЭOOH	Щ\	КHЫ‘\XШ]Jќ‹YЭЉNВ€[ЩHY€
ќ‹™]\Щ]XЭOOH	Щ[	КHЫ‘[]Jќ‹YЭЉNВ€JNВ‚€ќ[Э[Ы€™[™\ђЩ[
[ЫЫ
HВ€Y€
[OHќ[[OOH	ЙКB€™]\›€Ь[€Ы\ЬПHЩ[[ќ[€\љXK[X™[H‰ХЩ[[\_HЏё %ЬЬ[ЏВ€Y€
[OOHќYH[OOH[ЩJHВ€ЫЫњЭ›]H“УУС“Ф“PUЛ™љ[™
€O€‹љЩ^HOOH›ЫЫ›]Щ^JH“УУС“Ф“PUЦМNВ€™]\›€[И›]ќ€›]™ЋВ€B€Y€
\[Щ€[OOH	Ыќ[X™\‰КHВ€ЫЫњЭ\ЦYX\“ZЩHHќ[X™\‹љ\Т[ќYЩ\Љ[
H	‰€[ЏHL	‰€[HNNNNВ€Y€
\ЦYX\“ZЩJH™]\›€Ь[€Ы\ЬПHЩ[[ќ[HЏ‰Э[OЬЬ[ЏВ€ЛИЬљ\Э]H[™]U[YHЫЫ[[њИ›Э\њљ]™H\И\ШЪЩXЫЫ™Л€›Ь›X]€ЛИ]™\ћH[YH[€H]XЭY]HЫЫ[[‹›ЭЫ›HZYљYЪX[YЫ™Y]\Л‚€Y€
ЫЫ	‰€\С]SZЩPЫЫ[[ЉЫЫ
JB€™]\›€Ь[€Ы\ЬПHЩ[[ќ[HЏ‰Щ›Ь›X]]С]TЩXК[
_OЬЬ[ЏВ€™]\›€Ь[€Ы\ЬПHЩ[[ќ[HЏ‰ФЭљ[™К[
_OЬЬ[ЏВ€B€Y€
\њ^Kљ\Р\њ^J[
JH™]\›€\ШК[љ›Ъ[Љ	Л	КJNВ€ЛИЬљ\ЭШ[€^ЬЩHTУИ[Y\И\Иљ[Z]]™HЭљ[™ЬИЬ€Шљ™XЭЬ\\њЛ‚€ЛИHЭљXЭ\њЩ\€™]™[ќИЬ™[\ћHШљ™XЭЛЭ^њ›ЫH™Z[™И™Y›Ь›X]Y‚€ЫЫњЭЩXИH\њЩQ]U[YTЩXК[
NВ€Y€
ЩXИOHќ[
B€™]\›€Ь[€Ы\ЬПHЩ[[ќ[HЏ‰Щ›Ь›X]]С]TЩXКЩXК_OЬЬ[ЏВ€™]\›€\ШКЭљ[™К[
JNВ€B