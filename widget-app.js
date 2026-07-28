  // ── 7. Panneau de réglages — bouton ─────────────────────────
  btnSettings.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active', isOpen);
    btnSettings.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) { refreshColorGrid(); refreshBoolSection(); refreshAggSection(); }
  });

  // ── 8. Formats booléens ────────────────────────────────────
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

  // ── 9. Grille de couleurs ─────────────────────────────────
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

  // ── 10. Hauteur max par groupe (case à cocher + curseur) ──
  // Case décochée (défaut) : hauteur illimitée, pas de défilement interne.
  // Case cochée : le curseur est actif et plafonne la hauteur du groupe.
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

  // ── 10b. Agrégats ─────────────────────────────────────────
  // Une colonne est éligible aux fonctions numériques si toutes ses
  // valeurs non vides sont des nombres (types Grist Numeric/Int).
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
    if (fn === 'avg') v = Math.round(v * 100) / 100;   // ≤ 2 décimales
    return String(v);   // pas de séparateur de milliers (-1425, jamais -1,425)
  }

  // Puces affichées dans l'en-tête après le badge du nombre d'enregistrements
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

  // Colonnes proposées selon la fonction choisie (numériques seulement
  // pour sum/avg/min/max, toutes pour count)
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
    // Liste des règles existantes
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

  function initAggSection() {
    // Liste déroulante des fonctions (libellés localisés)
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
  // Accès complet requis : les actions de ligne (dupliquer / supprimer)
  // écrivent dans la table via grist.selectedTable.create / destroy.
  grist.ready({ requiredAccess: 'full' });

  grist.onOptions((opts) => {
    if (opts) {
      if (opts.groupBy)  { groupBy  = opts.groupBy;  groupSelect.value = groupBy;  }
      if (opts.sortMode) { sortMode = opts.sortMode; sortSelect.value  = sortMode; }
      if (opts.boolFmtKey && BOOL_FORMATS.find(f => f.key === opts.boolFmtKey))
        boolFmtKey = opts.boolFmtKey;
      if (opts.maxGroupH) maxGroupH = parseInt(opts.maxGroupH) || 200;
      // Rétrocompat : un maxGroupH enregistré sans limitMaxH → illimité (décoché).
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
    render();
  });

  grist.onRecords((records) => {
    allRecords = records || [];
    // Élaguer la sélection : retirer les ids absents des nouveaux enregistrements
    if (selectedIds.size > 0) {
      const present = new Set(allRecords.map(r => String(r.id)));
      selectedIds.forEach(id => { if (!present.has(id)) selectedIds.delete(id); });
    }
    // updateSelBar vit dans widget-actions.js (chargé après) — garde typeof
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
    // Toujours reconstruire : les colonnes déjà connues restent proposées
    // même quand le filtre courant ne renvoie aucun enregistrement.
    rebuildColumnSelect();
    if (settingsPanel.classList.contains('open')) refreshAggSection();
    render();
  });

  buildBoolButtons();
  initMaxHSlider();
  initAggSection();

  // ── 12. Sélecteur de colonne ──────────────────────────────
  function rebuildColumnSelect() {
    const prev = groupSelect.value;
    groupSelect.innerHTML = `<option value="">${T.chooseCol}</option>`;
    allColumns.forEach(col => {
      const opt = document.createElement('option');
      opt.value = col; opt.textContent = col;
      groupSelect.appendChild(opt);
      // Colonnes date-like : granularités jour / mois / année en plus
      // (knownDateCols persiste même quand le fetch courant est vide)
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

  // ── 13. Groupement ────────────────────────────────────────
  function getGroups() {
    if (!groupBy) return [];
    const { col, granularity } = parseGroupBy(groupBy);
    // Granularité active seulement si la colonne est toujours date-like
    const dateMode = !!granularity && allColumns.includes(col) && isDateLikeColumn(col);
    const map = new Map();
    allRecords.forEach(rec => {
      const raw = rec[col];
      let key, label, sortKey;
      if (raw == null || raw === '') {
        key = '\x00__empty__'; label = raw; sortKey = null;
      } else if (dateMode) {
        // raw = epoch (nombre) ou chaîne ISO → secondes epoch
        const sec = toEpochSec(raw);
        if (sec == null) {
          key = '\x00__empty__'; label = raw; sortKey = null;
        } else {
          const ms = bucketStartMs(sec, granularity);
          key     = String(ms);               // la clé porte l'epoch du bucket
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
      // Tri chronologique (epoch du bucket) quand le groupement est par date
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

  // ── 14. Rendu ─────────────────────────────────────────────
  function render() {
    Array.from(content.children).forEach(c => {
      if (c.id !== 'empty-state' && c.id !== 'toast') c.remove();
    });

    if (!groupBy || allRecords.length === 0) {
      emptyState.style.display = '';
      // Aucune colonne connue (jamais vu de données) : message dédié.
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
    // Colonne de sélection multiple en premier, colonne d'actions en dernier
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

  // Cellule d'actions par ligne : dupliquer ⧉ / supprimer ✕
  // (toujours visible, atténuée au repos ; pleine opacité au survol / focus).
  function rowActionsHtml(rec) {
    const id = esc(String(rec.id));
    return `<button type="button" class="row-act act-dup" data-act="dup" data-id="${id}"`
         + ` title="${esc(T.dupRecord)}" aria-label="${esc(T.dupRecord)}">⧉</button>`
         + `<button type="button" class="row-act act-del" data-act="del" data-id="${id}"`
         + ` title="${esc(T.delRecord)}" aria-label="${esc(T.delRecord)}">✕</button>`;
  }

  // ── 14b. Actions de ligne : délégation sur #content ───────
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
      // Pas de mutation locale : Grist renverra onRecords → re-render.
    } catch (err) {
      showToast(T.actionFailed);
    } finally {
      // Réactivé si le DOM n'a pas été reconstruit entre-temps.
      if (btn.isConnected) btn.disabled = false;
    }
  }

  async function onDelete(btn, idStr) {
    // Premier clic : armer (confirmation en 2 temps, auto-désarmement ~4 s).
    if (!armedDeletes.has(idStr)) {
      btn.classList.add('armed');
      btn.textContent = '?';
      btn.title = T.confirmDel;
      btn.setAttribute('aria-label', T.confirmDel);
      armedDeletes.set(idStr, setTimeout(() => disarmDelete(btn, idStr), 4000));
      return;
    }
    // Deuxième clic : exécuter.
    clearTimeout(armedDeletes.get(idStr));
    armedDeletes.delete(idStr);
    btn.disabled = true;
    try {
      await grist.selectedTable.destroy(Number(idStr));
      // Pas de mutation locale : Grist renverra onRecords → re-render.
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
      // Entier aligné sur le jour (minuit UTC) dans une colonne date-like
      // → affichage YYYY-MM-DD plutôt qu'un epoch brut.
      if (col && Number.isInteger(val) && val % 86400 === 0 && isDateLikeColumn(col))
        return `<span class="cell-num">${new Date(val * 1000).toISOString().slice(0, 10)}</span>`;
      return `<span class="cell-num">${String(val)}</span>`;
    }
    if (Array.isArray(val)) return esc(val.join(', '));
    // Chaîne ISO 8601 détectée valeur par valeur → "YYYY-MM-DD" (minuit UTC)
    // ou "YYYY-MM-DD HH:mm" sinon. parseIsoDateSec est strict (regex + plage
    // 1980–2100), donc aucun risque de reformater du texte ordinaire.
    if (typeof val === 'string') {
      const sec = parseIsoDateSec(val);
      if (sec != null) {
        const d    = new Date(sec * 1000);
        const date = d.toISOString().slice(0, 10);
        const hh = d.getUTCHours(), mm = d.getUTCMinutes(), ss = d.getUTCSeconds();
        const txt  = (hh === 0 && mm === 0 && ss === 0)
          ? date
          : `${date} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        return `<span class="cell-num">${txt}</span>`;
      }
    }
    return esc(String(val));
  }
