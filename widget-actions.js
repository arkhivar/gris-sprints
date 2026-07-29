  // ── 15. Multi-select — bulk action bar ──
  // Loaded after widget-app.js: shares the top-level bindings
  // (allRecords, selectedIds, content, grist, T, esc, showToast…).
  // DO NOT redeclare these names. NB: `app` did not exist at top level
  // (only a local variable in applyMaxGroupH), so it is created here.
  const app          = document.getElementById('app');
  const selBar       = document.getElementById('sel-bar');
  const selCountTxt  = document.getElementById('sel-count-txt');
  const btnSelDup    = document.getElementById('btn-sel-dup');
  const btnSelDel    = document.getElementById('btn-sel-del');
  const btnSelClear  = document.getElementById('btn-sel-clear');

  // Show / hide the bar based on the selection state.
  function updateSelBar() {
    if (selectedIds.size === 0) {
      selBar.classList.remove('visible');
      app.classList.remove('has-sel');
    } else {
      selBar.classList.add('visible');
      app.classList.add('has-sel');
      selCountTxt.textContent = T.selCount.replace('{n}', String(selectedIds.size));
    }
  }

  // Sync each table's "select all" checkbox:
  // checked if all rows are, indeterminate if only some.
  function refreshHeaderCbs() {
    content.querySelectorAll('.rec-table').forEach(table => {
      const head = table.querySelector('.sel-cb-all');
      if (!head) return;
      const rows = Array.from(table.querySelectorAll('tbody .sel-cb-row'));
      const nbChecked = rows.filter(cb => cb.checked).length;
      head.checked       = rows.length > 0 && nbChecked === rows.length;
      head.indeterminate = nbChecked > 0 && nbChecked < rows.length;
    });
  }

  // Delegate checkbox changes on #content.
  content.addEventListener('change', (e) => {
    const cb = e.target;
    if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;

    if (cb.classList.contains('sel-cb-row')) {
      // Row checkbox: update the Set + highlight the row
      const id = cb.dataset.id;
      if (cb.checked) selectedIds.add(id);
      else            selectedIds.delete(id);
      const tr = cb.closest('tr');
      if (tr) tr.classList.toggle('row-selected', cb.checked);
      refreshHeaderCbs();
      updateSelBar();
    } else if (cb.classList.contains('sel-cb-all')) {
      // Header checkbox: (un)check all rows of THIS table
      const table = cb.closest('table');
      if (!table) return;
      table.querySelectorAll('tbody .sel-cb-row').forEach(rowCb => {
        rowCb.checked = cb.checked;
        if (cb.checked) selectedIds.add(rowCb.dataset.id);
        else            selectedIds.delete(rowCb.dataset.id);
        const tr = rowCb.closest('tr');
        if (tr) tr.classList.toggle('row-selected', cb.checked);
      });
      refreshHeaderCbs();
      updateSelBar();
    }
  });

  // Enable / disable the bar buttons during a bulk action.
  function setSelBarDisabled(disabled) {
    [btnSelDup, btnSelDel, btnSelClear].forEach(b => { b.disabled = disabled; });
  }

  // ── Bulk duplicate ──
  // Sequential (await in a loop) to preserve order and simplify
  // error handling. Grist will send onRecords → re-render.
  btnSelDup.addEventListener('click', async () => {
    if (selectedIds.size === 0) return;
    setSelBarDisabled(true);
    try {
      for (const idStr of [...selectedIds]) {
        const rec = allRecords.find(r => String(r.id) === idStr);
        if (!rec) continue;
        const fields = { ...rec };
        delete fields.id;
        delete fields.manualSort;
        await grist.selectedTable.create({ fields });
      }
      selectedIds.clear();
      updateSelBar();
    } catch (err) {
      showToast(T.actionFailed);
    } finally {
      setSelBarDisabled(false);
    }
  });

  // ── Bulk delete (two-step confirmation, like onDelete) ──
  let selDelArmTimer = null;

  function disarmSelDelete() {
    clearTimeout(selDelArmTimer);
    selDelArmTimer = null;
    btnSelDel.classList.remove('armed');
    btnSelDel.textContent = T.selDel;
    btnSelDel.title = T.selDel;
    btnSelDel.setAttribute('aria-label', T.selDel);
  }

  btnSelDel.addEventListener('click', async () => {
    if (selectedIds.size === 0) return;
    // First click: arm (auto-disarm after ~4 s).
    if (!btnSelDel.classList.contains('armed')) {
      btnSelDel.classList.add('armed');
      btnSelDel.textContent = '?';
      btnSelDel.title = T.confirmDelSel;
      btnSelDel.setAttribute('aria-label', T.confirmDelSel);
      selDelArmTimer = setTimeout(disarmSelDelete, 4000);
      return;
    }
    // Second click: execute.
    disarmSelDelete();
    setSelBarDisabled(true);
    try {
      for (const idStr of [...selectedIds]) {
        await grist.selectedTable.destroy(Number(idStr));
      }
    } catch (err) {
      showToast(T.actionFailed);
    } finally {
      selectedIds.clear();
      updateSelBar();
      setSelBarDisabled(false);
    }
  });

  // ── Clear the selection ──
  btnSelClear.addEventListener('click', () => {
    selectedIds.clear();
    content.querySelectorAll('.sel-cb').forEach(cb => {
      cb.checked = false;
      cb.indeterminate = false;
    });
    content.querySelectorAll('.row-selected').forEach(tr =>
      tr.classList.remove('row-selected'));
    disarmSelDelete();
    updateSelBar();
  });
