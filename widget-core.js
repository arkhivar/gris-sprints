  // ── 1. Internationalisation (en premier — tout dépend de T) ──
  const LANG = navigator.language.startsWith('fr') ? 'fr' : 'en';

  const I18N = {
    fr: {
      groupBy:         'Grouper par',
      sortBy:          'Tri',
      expandAll:       'Tout déplier',
      collapseAll:     'Tout plier',
      settingsLabel:   'Réglages d’affichage',
      chooseCol:       '— choisir —',
      sortAlphaAsc:    'A → Z',
      sortAlphaDesc:   'Z → A',
      sortCountDesc:   'Nb ↓',
      sortCountAsc:    'Nb ↑',
      sectionColors:   'Couleurs des groupes',
      sectionMaxH:     'Hauteur max par groupe',
      sectionBool:     'Affichage vrai / faux',
      reset:           'Réinitialiser',
      noGroups:        'Aucun groupe — choisis une colonne de groupement.',
      emptyTitle:      'Aucune colonne sélectionnée',
      emptySub:        'Choisis une colonne dans la barre ci-dessus<br>pour grouper les enregistrements.',
      emptyTitleNoRec: 'Aucun enregistrement',
      emptySubNoRec:   'La table sélectionnée ne contient aucun enregistrement.',
      emptyNoDataTitle: 'Aucun enregistrement pour lire les colonnes',
      emptyNoDataSub:   'La table ou le filtre actuel ne renvoie aucune ligne.<br>Ouvre une vue non filtrée ou choisis une autre ligne liée, puis choisis une colonne de groupement.',
      groups:          'groupes',
      records:         'enregistrements',
      record:          'enregistrement',
      noOtherCol:      'Aucune autre colonne à afficher.',
      groupCaption:    'Groupe :',
      emptyGroup:      '(vide)',
      colorLabel:      'Couleur du groupe',
      resetColorLabel: 'Réinitialiser la couleur du groupe',
      resetMaxH:       'Réinitialiser la hauteur maximale',
      boolFormatLabel: 'Format booléen :',
      ariaToolbar:     'Options de groupement',
      ariaSettings:    'Réglages d’affichage',
      ariaContent:     'Groupes d’enregistrements',
      ariaGroupRegion: 'Enregistrements — ',
      cellEmpty:       'valeur vide',
      sectionAggregates: 'Agrégats',
      aggAdd:          '+ Ajouter',
      aggFnCount:      'Nombre de valeurs',
      aggFnSum:        'Somme',
      aggFnAvg:        'Moyenne',
      aggFnMin:        'Minimum',
      aggFnMax:        'Maximum',
      aggFnLabel:      'Fonction d’agrégation',
      aggColLabel:     'Colonne de l’agrégat',
      aggRemove:       'Supprimer l’agrégat',
      aggNoRules:      'Aucun agrégat configuré.',
      byDay:           'par jour',
      byMonth:         'par mois',
      byYear:          'par année',
      limitMaxH:       'Limiter la hauteur des groupes',
      dupRecord:       'Dupliquer l’enregistrement',
      delRecord:       'Supprimer l’enregistrement',
      confirmDel:      'Confirmer la suppression ?',
      actionFailed:    'Échec de l’action — le widget nécessite l’accès « Full access »',
      selCount:        '{n} sélectionné(s)',
      selDup:          'Dupliquer la sélection',
      selDel:          'Supprimer la sélection',
      selClear:        'Effacer',
      selAll:          'Tout sélectionner',
      confirmDelSel:   'Confirmer la suppression de la sélection ?',
      boolTrue:  ['✓ vrai',  'Oui',  'True',  'vrai', '1'],
      boolFalse: ['✗ faux',  'Non',  'False', 'faux', '0'],
      boolLabels: ['✓ / ✗', 'Oui / Non', 'True / False', '● badge', '1 / 0'],
    },
    en: {
      groupBy:         'Group by',
      sortBy:          'Sort',
      expandAll:       'Expand all',
      collapseAll:     'Collapse all',
      settingsLabel:   'Display settings',
      chooseCol:       '— choose —',
      sortAlphaAsc:    'A → Z',
      sortAlphaDesc:   'Z → A',
      sortCountDesc:   'Count ↓',
      sortCountAsc:    'Count ↑',
      sectionColors:   'Group colors',
      sectionMaxH:     'Max height per group',
      sectionBool:     'True / false display',
      reset:           'Reset',
      noGroups:        'No groups — choose a grouping column.',
      emptyTitle:      'No column selected',
      emptySub:        'Choose a column in the toolbar above<br>to group records.',
      emptyTitleNoRec: 'No records',
      emptySubNoRec:   'The selected table contains no records.',
      emptyNoDataTitle: 'No records to read columns from',
      emptyNoDataSub:   'The current table or filter returned zero rows.<br>Open an unfiltered view or pick another linked row, then choose a grouping column.',
      groups:          'groups',
      records:         'records',
      record:          'record',
      noOtherCol:      'No other column to display.',
      groupCaption:    'Group:',
      emptyGroup:      '(empty)',
      colorLabel:      'Color of group',
      resetColorLabel: 'Reset color of group',
      resetMaxH:       'Reset maximum height',
      boolFormatLabel: 'Boolean format:',
      ariaToolbar:     'Grouping options',
      ariaSettings:    'Display settings',
      ariaContent:     'Record groups',
      ariaGroupRegion: 'Records — ',
      cellEmpty:       'empty value',
      sectionAggregates: 'Aggregates',
      aggAdd:          '+ Add',
      aggFnCount:      'Value count',
      aggFnSum:        'Sum',
      aggFnAvg:        'Average',
      aggFnMin:        'Minimum',
      aggFnMax:        'Maximum',
      aggFnLabel:      'Aggregate function',
      aggColLabel:     'Aggregate column',
      aggRemove:       'Remove aggregate',
      aggNoRules:      'No aggregate configured.',
      byDay:           'by day',
      byMonth:         'by month',
      byYear:          'by year',
      limitMaxH:       'Limit group height',
      dupRecord:       'Duplicate record',
      delRecord:       'Delete record',
      confirmDel:      'Confirm delete?',
      actionFailed:    'Action failed — the widget needs Full access',
      selCount:        '{n} selected',
      selDup:          'Duplicate selected',
      selDel:          'Delete selected',
      selClear:        'Clear',
      selAll:          'Select all',
      confirmDelSel:   'Confirm deleting the selection?',
      boolTrue:  ['✓ true',  'Yes',   'True',  'true',  '1'],
      boolFalse: ['✗ false', 'No',    'False', 'false', '0'],
      boolLabels: ['✓ / ✗', 'Yes / No', 'True / False', '● badge', '1 / 0'],
    }
  };
  const T = I18N[LANG];
  const LOCALE = LANG === 'fr' ? 'fr-FR' : 'en-US';

  // ── Dates : Grist transmet Date/DateTime en secondes epoch (UTC) ──
  const DATE_EPOCH_MIN = 315532800;    // 1980-01-01T00:00:00Z
  const DATE_EPOCH_MAX = 4102444800;   // 2100-01-01T00:00:00Z
  const DATE_GRANULARITIES = ['day', 'month', 'year'];
  const GRAN_I18N_KEY = { day: 'byDay', month: 'byMonth', year: 'byYear' };

  // ── 2. Constantes (utilisent T) ──────────────────────────
  const DEFAULT_PALETTE = [
    '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
    '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1',
  ];

  function makeBoolFormats() {
    return [
      { key: 'check', label: T.boolLabels[0],
        t: `<span style="color:#16a34a;font-weight:500">${T.boolTrue[0]}</span>`,
        f: `<span style="color:#dc2626">${T.boolFalse[0]}</span>` },
      { key: 'oui',   label: T.boolLabels[1],
        t: `<span style="color:#16a34a;font-weight:500">${T.boolTrue[1]}</span>`,
        f: `<span style="color:#dc2626">${T.boolFalse[1]}</span>` },
      { key: 'tf',    label: T.boolLabels[2],
        t: `<span style="color:#16a34a;font-weight:500">${T.boolTrue[2]}</span>`,
        f: `<span style="color:#dc2626">${T.boolFalse[2]}</span>` },
      { key: 'badge', label: T.boolLabels[3],
        t: `<span style="display:inline-block;padding:1px 7px;border-radius:9px;background:#dcfce7;color:#166534;font-size:10px;font-weight:600">${T.boolTrue[3]}</span>`,
        f: `<span style="display:inline-block;padding:1px 7px;border-radius:9px;background:#fee2e2;color:#991b1b;font-size:10px;font-weight:600">${T.boolFalse[3]}</span>` },
      { key: 'num',   label: T.boolLabels[4],
        t: '<span class="cell-num">1</span>',
        f: '<span class="cell-num cell-null">0</span>' },
    ];
  }
  const BOOL_FORMATS = makeBoolFormats();

  // Fonctions d'agrégation : symbole d'en-tête + restriction numérique
  const AGG_FNS = {
    count: { symbol: '#', label: T.aggFnCount, numericOnly: false },
    sum:   { symbol: 'Σ', label: T.aggFnSum,   numericOnly: true },
    avg:   { symbol: 'x̄', label: T.aggFnAvg,   numericOnly: true },
    min:   { symbol: '↓', label: T.aggFnMin,   numericOnly: true },
    max:   { symbol: '↑', label: T.aggFnMax,   numericOnly: true },
  };

  // ── 3. État ───────────────────────────────────────────────
  let allRecords = [];
  let allColumns = [];
  let knownDateCols = new Set();   // colonnes date-like déjà observées (persiste sur fetch vide)
  let groupBy    = '';
  let sortMode   = 'alpha-asc';
  let collapsed  = new Set();
  let colColors  = {};
  let aggregates = [];
  let boolFmtKey = 'check';
  let maxGroupH  = 200;
  let limitMaxH  = false;          // false = hauteur illimitée (défaut)
  let dateLikeCache = new Map();   // col → bool, invalidé à chaque onRecords
  const armedDeletes = new Map();  // id (string) → timeoutId, confirmation en 2 temps
  const selectedIds = new Set();   // ids (string) des enregistrements cochés

  // ── 4. Refs DOM ───────────────────────────────────────────
  const groupSelect   = document.getElementById('group-select');
  const sortSelect    = document.getElementById('sort-select');
  const content       = document.getElementById('content');
  const statsbar      = document.getElementById('statsbar');
  const emptyState    = document.getElementById('empty-state');
  const settingsPanel = document.getElementById('settings-panel');
  const btnSettings   = document.getElementById('btn-settings');
  const colorGrid     = document.getElementById('color-grid');
  const boolRow       = document.getElementById('bool-row');
  const aggList       = document.getElementById('agg-list');
  const aggFnSelect   = document.getElementById('agg-fn-select');
  const aggColSelect  = document.getElementById('agg-col-select');
  const btnAddAgg     = document.getElementById('btn-add-agg');
  let   statGroups    = document.getElementById('stat-groups');
  let   statRecords   = document.getElementById('stat-records');

  // ── 5. Appliquer i18n au DOM statique ─────────────────────
  function applyI18nToDOM() {
    document.querySelector('label[for="group-select"]').textContent = T.groupBy;
    document.querySelector('label[for="sort-select"]').textContent  = T.sortBy;
    document.getElementById('btn-expand').textContent               = T.expandAll;
    document.getElementById('btn-collapse').textContent             = T.collapseAll;
    document.getElementById('btn-settings').setAttribute('aria-label', T.settingsLabel);
    document.querySelector('#group-select option').textContent      = T.chooseCol;
    const sortOpts = document.querySelectorAll('#sort-select option');
    sortOpts[0].textContent = T.sortAlphaAsc;
    sortOpts[1].textContent = T.sortAlphaDesc;
    sortOpts[2].textContent = T.sortCountDesc;
    sortOpts[3].textContent = T.sortCountAsc;
    document.getElementById('lbl-colors').textContent            = T.sectionColors;
    document.getElementById('lbl-limitmaxh-txt').textContent     = T.limitMaxH;
    document.getElementById('maxh-range').setAttribute('aria-label', T.sectionMaxH);
    document.getElementById('lbl-bool').textContent              = T.sectionBool;
    document.getElementById('lbl-aggregates').textContent        = T.sectionAggregates;
    document.getElementById('btn-add-agg').textContent           = T.aggAdd;
    document.getElementById('agg-fn-select').setAttribute('aria-label', T.aggFnLabel);
    document.getElementById('agg-col-select').setAttribute('aria-label', T.aggColLabel);
    document.documentElement.lang = LANG;
    document.getElementById('btn-reset-maxh').textContent        = T.reset;
    document.getElementById('btn-reset-maxh').setAttribute('aria-label', T.resetMaxH);
    document.querySelector('.toolbar').setAttribute('aria-label', T.ariaToolbar);
    document.getElementById('settings-panel').setAttribute('aria-label', T.ariaSettings);
    document.getElementById('content').setAttribute('aria-label', T.ariaContent);
    // Réécriture des spans de stats (preserve les ids)
    const statSpans = document.getElementById('statsbar').querySelectorAll(':scope > span');
    statSpans[0].innerHTML = '<span class="stat-val" id="stat-groups">0</span> ' + T.groups;
    statSpans[2].innerHTML = '<span class="stat-val" id="stat-records">0</span> ' + T.records;
    document.querySelector('.empty-title').textContent = T.emptyTitle;
    document.querySelector('.empty-sub').innerHTML     = T.emptySub;
    // Barre d'actions de sélection multiple (bas de fenêtre)
    document.getElementById('sel-count-txt').textContent = T.selCount.replace('{n}', '0');
    document.getElementById('btn-sel-dup').textContent   = T.selDup;
    document.getElementById('btn-sel-del').textContent   = T.selDel;
    document.getElementById('btn-sel-clear').textContent = T.selClear;
  }
  applyI18nToDOM();
  statGroups  = document.getElementById('stat-groups');
  statRecords = document.getElementById('stat-records');

  // ── 6. Utilitaires ────────────────────────────────────────
  function hasBoolCol() {
    const groupCol = parseGroupBy(groupBy).col;
    return allColumns.filter(c => c !== groupCol)
      .some(c => allRecords.some(r => typeof r[c] === 'boolean'));
  }

  function refreshBoolSection() {
    const s = document.getElementById('bool-section');
    if (s) s.style.display = hasBoolCol() ? '' : 'none';
  }

  function applyMaxGroupH() {
    const app = document.getElementById('app');
    app.style.setProperty('--max-group-h', maxGroupH + 'px');
    app.classList.toggle('limit-maxh', limitMaxH);
  }

  function updateStickyTop() {
    // No-op (layout is now fixed, kept for compatibility)
  }

  function saveColors() {
    grist.setOption('colColors', JSON.stringify(colColors));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── 6b. Dates : détection, encodage, bucketing ─────────────
  // Une colonne est « date-like » si elle a ≥ 1 valeur non vide et que
  // toutes ses valeurs non vides sont :
  //  - des nombres dans la plage epoch [1980-01-01, 2100-01-01] UTC
  //    (Grist envoie Date/DateTime en secondes), ou
  //  - des chaînes ISO 8601 (YYYY-MM-DD avec heure/offset optionnels)
  //    qui se parsent dans la même plage. Les chaînes sans désignateur
  //    de fuseau sont interprétées en UTC.
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(\s*(Z|[+-]\d{2}:?\d{2}))?)?$/i;

  // Chaîne ISO → secondes epoch UTC, ou null si invalide / hors plage.
  function parseIsoDateSec(v) {
    if (typeof v !== 'string') return null;
    let s = v.trim();
    if (!ISO_DATE_RE.test(s)) return null;
    s = s.replace(' ', 'T');                       // "YYYY-MM-DD HH:mm" → ISO strict
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += 'Z'; // sans fuseau → UTC
    const ms = Date.parse(s);
    if (isNaN(ms)) return null;
    const sec = ms / 1000;
    if (sec < DATE_EPOCH_MIN || sec > DATE_EPOCH_MAX) return null;
    return sec;
  }

  // Valeur date-like (nombre epoch ou chaîne ISO) → secondes epoch.
  function toEpochSec(v) {
    return typeof v === 'number' ? v : parseIsoDateSec(v);
  }

  function isDateLikeColumn(col) {
    if (dateLikeCache.has(col)) return dateLikeCache.get(col);
    let has = false;
    for (const r of allRecords) {
      const v = r[col];
      if (v == null || v === '') continue;
      if (typeof v === 'number') {
        if (v < DATE_EPOCH_MIN || v > DATE_EPOCH_MAX) {
          dateLikeCache.set(col, false);
          return false;
        }
      } else if (typeof v === 'string') {
        if (parseIsoDateSec(v) == null) {
          dateLikeCache.set(col, false);
          return false;
        }
      } else {
        dateLikeCache.set(col, false);
        return false;
      }
      has = true;
    }
    dateLikeCache.set(col, has);
    return has;
  }

  // Décodage de la sélection : "col::day|month|year" ou simple "col".
  function parseGroupBy(val) {
    const m = /^(.*)::(day|month|year)$/.exec(val || '');
    return m ? { col: m[1], granularity: m[2] }
             : { col: val, granularity: null };
  }

  // Début de bucket UTC en millisecondes (jour / mois / année).
  function bucketStartMs(epochSec, granularity) {
    const d = new Date(epochSec * 1000);
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    if (granularity === 'year')  return Date.UTC(y, 0, 1);
    if (granularity === 'month') return Date.UTC(y, m, 1);
    return Date.UTC(y, m, day);
  }

  // Libellé localisé du bucket (toujours en UTC).
  function bucketLabel(ms, granularity) {
    const d = new Date(ms);
    if (granularity === 'year') return String(d.getUTCFullYear());
    if (granularity === 'month')
      return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
