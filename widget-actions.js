  // ── 15. Sélection multiple — barre d'actions groupées ──
  // Chargé après widget-app.js : partage les liaisons top-level
  // (allRecords, selectedIds, content, grist, T, esc, showToast…).
  // NE PAS redéclarer ces noms. NB : `app` n'existait pas en top-level
  // (seulement une variable locale dans applyMaxGroupH), on la crée ici.
  const app          = document.getElementById('app');
  const selBar       = document.getElementById('sel-bar');
  const selCountTxt  = document.getElementById('sel-count-txt');
  const btnSelDup    = document.getElementById('btn-sel-dup');
  const btnSelDel    = document.getElementById('btn-sel-del');
  const btnSelClear  = document.getElementById('btn-sel-clear');

  // Affiche / masque la barre selon l'état de la sélection.
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

  // Synchronise la case « tout sélectionner » de chaque tableau :
  // cochée si toutes les lignes le sont, indéterminée si une partie.
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

  // Délégation des changements de cases à cocher sur #content.
  content.addEventListener('change', (e) => {
    const cb = e.target;
    if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;

    if (cb.classList.contains('sel-cb-row')) {
      // Case d'une ligne : maj du Set + surlignage de la ligne
      const id = cb.dataset.id;
      if (cb.checked) selectedIds.add(id);
      else            selectedIds.delete(id);
      const tr = cb.closest('tr');
      if (tr) tr.classList.toggle('row-selected', cb.checked);
      refreshHeaderCbs();
      updateSelBar();
    } else if (cb.classList.contains('sel-cb-all')) {
      // Case d'en-tête : (dé)cocher toutes les lignes de CE tableau
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

  // Active / désactive les boutons de la barre pendant une action groupée.
  function setSelBarDisabled(disabled) {
    [btnSelDup, btnSelDel, btnSelClear].forEach(b => { b.disabled = disabled; });
  }

  // ── Duplication groupée ──
  // Séquentiel (await en boucle) pour préserver l'ordre et simplifier
  // la gestion d'erreur. Grist renverra onRecords → re-render.
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

  // ── Suppression groupée (confirmation en 2 temps, comme onDelete) ──
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
    // Premier clic : armer (auto-désarmement après ~4 s).
    if (!btnSelDel.classList.contains('armed')) {
      btnSelDel.classList.add('armed');
      btnSelDel.textContent = '?';
      btnSelDel.title = T.confirmDelSel;
      btnSelDel.setAttribute('aria-label', T.confirmDelSel);
      selDelArmTimer = setTimeout(disarmSelDelete, 4000);
      return;
    }
    // Deuxième clic : exécuter.
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

  // ── Effacer la sélection ──
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
