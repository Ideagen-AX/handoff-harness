// Search page toolbar — isolated interaction layer.
// Ported verbatim from the "Responsive Search" project's script.js (the BEFORE
// state), trimmed to just the toolbar + Options panel. Behaviour is unchanged;
// the only adaptations are (1) the Options panel anchors to the toolbar instead
// of the app content region, and (2) results-grid side effects are stubbed out.
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function bind(selector, event, handler) {
    document.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target) handler(e, target);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =================================================================
  // STATE + DATA (mirrors the source project)
  // =================================================================
  let displayMode = 'list'; // list | table | card | calendar | hierarchy | chart
  let chartType   = 'SingleMetric';
  let agingFormat = 'column';
  let tableShowAs = 'nested';
  let sortBy      = 'Last Updated';
  let optionsTab  = 'display';

  const DISPLAY_MODES = [
    { value: 'list',      label: 'List',      icon: 'list' },
    { value: 'table',     label: 'Table',     icon: 'table' },
    { value: 'card',      label: 'Cards',     icon: 'cards_stack' },
    { value: 'calendar',  label: 'Calendar',  icon: 'event' },
    { value: 'hierarchy', label: 'Hierarchy', icon: 'account_tree' },
    { value: 'chart',     label: 'Chart',     icon: 'insert_chart' },
  ];
  const SORT_OPTIONS = ['Last Updated', 'Date Due', 'Priority', 'Identifier'];
  const SHOW_AS = [
    { value: 'nested', label: 'Nested', icon: 'account_tree' },
    { value: 'flat',   label: 'Flat',   icon: 'table_rows' },
  ];
  const AGING_FORMATS = [
    { value: 'column', label: 'Column', icon: 'bar_chart' },
    { value: 'bar',    label: 'Bar',    icon: 'align_horizontal_left' },
    { value: 'pie',    label: 'Pie',    icon: 'pie_chart' },
  ];
  const COLUMNS = [
    { id: 'id',         label: 'Identifier',       defaultVisible: true  },
    { id: 'title',      label: 'Title',            defaultVisible: true  },
    { id: 'assignee',   label: 'Current Assignee', defaultVisible: true  },
    { id: 'task',       label: 'Current Task',     defaultVisible: true  },
    { id: 'status',     label: 'Status',           defaultVisible: true  },
    { id: 'actionType', label: 'Action Type',      defaultVisible: false },
    { id: 'department', label: 'Department',       defaultVisible: false },
    { id: 'site',       label: 'Site',             defaultVisible: true  },
    { id: 'priority',   label: 'Priority',         defaultVisible: false },
    { id: 'due',        label: 'Date Due',         defaultVisible: true  },
    { id: 'created',    label: 'Created On',       defaultVisible: false },
    { id: 'createdBy',  label: 'Created By',       defaultVisible: false },
    { id: 'updated',    label: 'Last Updated',     defaultVisible: false },
    { id: 'read',       label: 'Read Status',      defaultVisible: false },
  ];
  const columnState = {};
  COLUMNS.forEach(c => { columnState[c.id] = c.defaultVisible; });

  // Results grid does not exist in isolation — these are no-ops here.
  function renderResults() {}
  function openChartPicker() {}
  function setDisplayMode(mode) {
    displayMode = mode;
    document.body.dataset.displayMode = mode;
    renderResults();
  }

  // =================================================================
  // FADE-OUT HELPERS (overflow menus)
  // =================================================================
  const closingTimers = new Map();
  function fadeOutThenHide(el, ms = 120) {
    if (!el || el.hidden || el.hasAttribute('data-closing')) return;
    el.setAttribute('data-closing', '');
    closingTimers.set(el, setTimeout(() => {
      el.removeAttribute('data-closing'); el.hidden = true; closingTimers.delete(el);
    }, ms));
  }
  function cancelFadeOut(el) {
    if (!el) return;
    const t = closingTimers.get(el);
    if (t) { clearTimeout(t); closingTimers.delete(el); }
    el.removeAttribute('data-closing');
  }

  // =================================================================
  // TOOLBAR OVERFLOW MENU (Tools) — mobile only
  // =================================================================
  function anchorMenuTo(menu, trigger) {
    const rect = trigger.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    const isRight = rect.left + rect.width / 2 > window.innerWidth / 2;
    if (isRight) {
      menu.style.right = `${window.innerWidth - rect.right}px`;
      menu.style.left = 'auto';
    } else {
      menu.style.left = `${rect.left}px`;
      menu.style.right = 'auto';
    }
  }
  function toggleOverflowMenu(menuSelector, trigger) {
    const menu = $(menuSelector);
    if (!menu) return;
    $$('.overflow-menu').forEach(m => { if (m !== menu) fadeOutThenHide(m); });
    if (menu.hidden || menu.hasAttribute('data-closing')) {
      anchorMenuTo(menu, trigger);
      cancelFadeOut(menu);
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    } else {
      fadeOutThenHide(menu);
      trigger.setAttribute('aria-expanded', 'false');
    }
  }
  bind('[data-action="toggle-tools-menu"]', 'click', (e, btn) => {
    e.stopPropagation();
    toggleOverflowMenu('[data-tools-menu]', btn);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.overflow-menu') &&
        !e.target.closest('[data-action="toggle-tools-menu"]')) {
      $$('.overflow-menu').forEach(m => fadeOutThenHide(m));
      $$('[data-action="toggle-tools-menu"]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });

  // =================================================================
  // DISPLAY MODE — view-mode toggle in the toolbar
  // =================================================================
  bind('.ehsq-toolbar__mode', 'click', (e, btn) => {
    $$('.ehsq-toolbar__mode').forEach(b => {
      b.classList.remove('ehsq-toolbar__mode--active');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('ehsq-toolbar__mode--active');
    btn.setAttribute('aria-checked', 'true');
    const mode = btn.dataset.mode || 'list';
    setDisplayMode(mode);
    if (mode === 'chart') openChartPicker();
  });

  // =================================================================
  // OPTIONS PANEL — Display / Fields / Groupings
  // =================================================================
  function ddHtml(id, icon, label, items, opensPicker) {
    const trigger = `
      <button class="opt-dd__btn" type="button" aria-haspopup="listbox" aria-expanded="false"
              data-action="${opensPicker ? 'open-chart-picker' : 'toggle-opt-dd'}" data-dd="${id}">
        ${icon ? `<span class="material-symbols-rounded">${icon}</span>` : ''}
        <span class="opt-dd__label">${escapeHtml(label)}</span>
        <span class="material-symbols-rounded opt-dd__chev">${opensPicker ? 'unfold_more' : 'expand_more'}</span>
      </button>`;
    const menu = opensPicker ? '' : `
      <ul class="opt-dd__menu" role="listbox" data-dd-menu="${id}" hidden>
        ${items.map(it => `<li role="option"><button class="opt-dd__item${it.active ? ' is-active' : ''}" type="button" data-dd="${id}" data-dd-val="${it.value}">
          ${it.icon ? `<span class="material-symbols-rounded">${it.icon}</span>` : ''}<span class="opt-dd__item-label">${escapeHtml(it.label)}</span>
          ${it.active ? '<span class="material-symbols-rounded opt-dd__check">check</span>' : ''}</button></li>`).join('')}
      </ul>`;
    return `<div class="opt-dd" data-dd-wrap="${id}">${trigger}${menu}</div>`;
  }
  function optRow(label, control) {
    return `<div class="opt-row"><span class="opt-row__label">${escapeHtml(label)}</span><div class="opt-row__control">${control}</div></div>`;
  }

  function displayTabHtml() {
    // When the toolbar is expanded it still shows the display-mode switch, so the
    // panel omits "Display as" to avoid duplicating it. It carries what the
    // toolbar can't. Threshold matches the showcase collapse breakpoint (1200px).
    const toolbarHasModes = window.matchMedia('(min-width: 1200px)').matches;
    let html = '';
    if (!toolbarHasModes) {
      const m = DISPLAY_MODES.find(d => d.value === displayMode) || DISPLAY_MODES[0];
      html += optRow('Display as:', ddHtml('mode', m.icon, m.label, DISPLAY_MODES.map(d => ({ ...d, active: d.value === displayMode }))));
    }
    if (displayMode === 'table') {
      const sa = SHOW_AS.find(s => s.value === tableShowAs);
      html += optRow('Show as:', ddHtml('showas', sa.icon, sa.label, SHOW_AS.map(s => ({ ...s, active: s.value === tableShowAs }))));
    }
    if (displayMode === 'chart') {
      if (chartType === 'Aging') {
        const f = AGING_FORMATS.find(a => a.value === agingFormat);
        html += optRow('Format:', ddHtml('aging', f.icon, f.label, AGING_FORMATS.map(a => ({ ...a, active: a.value === agingFormat }))));
      }
    } else {
      html += optRow('Sort by:', ddHtml('sort', 'swap_vert', sortBy, SORT_OPTIONS.map(s => ({ value: s, label: s, active: s === sortBy }))));
    }
    if (!html) html = `<p class="opt-empty">This visualization has no additional display options. Use the toolbar to switch views.</p>`;
    return html;
  }
  function fieldsTabHtml() {
    if (displayMode === 'chart') {
      return `<p class="opt-empty">Field selection applies to list, table and card views. Chart facets are configured per visualization.</p>`;
    }
    return `<p class="opt-hint">Choose which columns appear:</p>
      <div class="opt-fields">${COLUMNS.map(c => `
        <label class="opt-field"><input type="checkbox" data-opt-col="${c.id}" ${columnState[c.id] ? 'checked' : ''}><span>${escapeHtml(c.label)}</span></label>`).join('')}</div>`;
  }
  function groupingsTabHtml() {
    return `<p class="opt-empty">Grouping options will appear here for views that support grouping — e.g. group table rows by Site or Department.</p>`;
  }

  function renderOptionsPanel() {
    const body = $('[data-options-body]'); if (!body) return;
    const tableMode = displayMode === 'table';
    const ft = $('[data-options-tab="fields"]'), gt = $('[data-options-tab="groupings"]');
    if (ft) ft.hidden = !tableMode;
    if (gt) gt.hidden = !tableMode;
    if (!tableMode && optionsTab !== 'display') optionsTab = 'display';
    body.innerHTML = optionsTab === 'display' ? displayTabHtml()
                   : optionsTab === 'fields'  ? fieldsTabHtml()
                   : groupingsTabHtml();
    $$('.options-tab').forEach(t => {
      const on = t.dataset.optionsTab === optionsTab;
      t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // Pin the panel to the toolbar (drops down from the toolbar's bottom edge).
  function positionOptionsPanel() {
    const panel = $('[data-options-panel]'), scrim = $('[data-options-scrim]');
    const toolbar = $('.ehsq-toolbar');
    if (!panel || !toolbar) return;
    const r = toolbar.getBoundingClientRect();
    panel.style.top = r.bottom + 'px';
    panel.style.left = r.left + 'px';
    panel.style.width = r.width + 'px';
    // Full-viewport scrim behind the panel.
    if (scrim) {
      scrim.style.top = '0'; scrim.style.left = '0';
      scrim.style.width = '100%'; scrim.style.height = '100%';
    }
  }
  function optionsPanelOpen() { const p = $('[data-options-panel]'); return p && !p.hidden; }
  function openOptionsPanel() {
    optionsTab = 'display';
    renderOptionsPanel();
    positionOptionsPanel();
    const panel = $('[data-options-panel]'), scrim = $('[data-options-scrim]');
    scrim.hidden = false; panel.hidden = false;
    requestAnimationFrame(() => { scrim.setAttribute('data-open', ''); panel.setAttribute('data-open', ''); });
    $$('[data-action="open-options-panel"]').forEach(b => b.setAttribute('aria-expanded', 'true'));
  }
  function closeOptionsPanel() {
    const panel = $('[data-options-panel]'), scrim = $('[data-options-scrim]');
    if (!panel) return;
    panel.removeAttribute('data-open'); scrim.removeAttribute('data-open');
    $$('.opt-dd__menu').forEach(m => m.hidden = true);
    setTimeout(() => { panel.hidden = true; scrim.hidden = true; }, 200);
    $$('[data-action="open-options-panel"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  bind('[data-action="open-options-panel"]', 'click', (e) => { e.stopPropagation(); openOptionsPanel(); });
  bind('[data-action="close-options-panel"]', 'click', closeOptionsPanel);
  bind('[data-options-scrim]', 'click', closeOptionsPanel);
  window.addEventListener('resize', () => { if (optionsPanelOpen()) { renderOptionsPanel(); positionOptionsPanel(); } });

  // Tabs
  bind('[data-options-tab]', 'click', (e, btn) => { optionsTab = btn.dataset.optionsTab; renderOptionsPanel(); });

  // Open/close a dropdown menu inside the panel
  bind('[data-action="toggle-opt-dd"]', 'click', (e, btn) => {
    e.stopPropagation();
    const id = btn.dataset.dd;
    const menu = $(`[data-dd-menu="${id}"]`);
    const isOpen = menu && !menu.hidden;
    $$('.opt-dd__menu').forEach(m => m.hidden = true);
    $$('.opt-dd__btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (menu && !isOpen) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.opt-dd')) $$('.opt-dd__menu').forEach(m => m.hidden = true);
  });

  // Dropdown selection
  bind('[data-dd-val]', 'click', (e, btn) => {
    e.stopPropagation();
    const id = btn.dataset.dd, val = btn.dataset.ddVal;
    $$('.opt-dd__menu').forEach(m => m.hidden = true);
    if (id === 'mode') {
      $$('.ehsq-toolbar__mode').forEach(b => {
        const on = b.dataset.mode === val;
        b.classList.toggle('ehsq-toolbar__mode--active', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      setDisplayMode(val);
      if (val === 'chart') openChartPicker();
    } else if (id === 'showas') {
      tableShowAs = val;
    } else if (id === 'aging') {
      agingFormat = val; if (displayMode === 'chart') renderResults();
    } else if (id === 'sort') {
      sortBy = val;
      const lbl = $('.ehsq-toolbar__sort-dropdown span'); if (lbl) lbl.textContent = val;
    }
    renderOptionsPanel();
  });

  // Fields tab → column visibility
  bind('[data-opt-col]', 'change', (e, input) => {
    columnState[input.dataset.optCol] = input.checked;
    if (displayMode === 'table') renderResults();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && optionsPanelOpen()) closeOptionsPanel();
  });

  // Initial state
  document.body.dataset.displayMode = displayMode;
})();
