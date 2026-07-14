// Search page toolbar — isolated interaction layer (AFTER / groom lake).
// Ported from the groom lake search-page.html view switcher, plus a responsive
// collapse adopted from the "before" toolbar: at mobile widths the tool buttons
// collapse into a Tools menu and Sort + the view switch collapse into an Options
// menu. Result views live in the full page, so setView only drives selection.
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ============================ VIEW SWITCHER ============================
  function setView(view) {
    // Desktop segmented control
    $$('.viewswitch__btn').forEach(b => {
      const on = b.dataset.view === view;
      b.classList.toggle('viewswitch__btn--active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // Mobile Options menu — keep the "Display As" list in sync
    $$('[data-options-menu] [data-view]').forEach(b =>
      b.setAttribute('aria-checked', b.dataset.view === view ? 'true' : 'false'));
  }
  $$('.viewswitch__btn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  // ============================ SORT ============================
  function setSort(val) {
    const sv = $('#sortValue');
    if (sv) sv.textContent = val;                    // desktop sort button label
    $$('[data-options-menu] [data-sort]').forEach(b =>
      b.setAttribute('aria-checked', b.dataset.sort === val ? 'true' : 'false'));
  }

  // ============================ COLLAPSE MENUS (Tools / Options) ============================
  // position:fixed menus, anchored to their trigger (mirrors the before toolbar).
  function anchorMenuTo(menu, trigger) {
    const r = trigger.getBoundingClientRect();
    menu.style.top = (r.bottom + 6) + 'px';
    const onRight = r.left + r.width / 2 > window.innerWidth / 2;
    if (onRight) {
      menu.style.right = (window.innerWidth - r.right) + 'px';
      menu.style.left = 'auto';
    } else {
      menu.style.left = r.left + 'px';
      menu.style.right = 'auto';
    }
  }
  function closeMenus() {
    $$('.toolbar__menu').forEach(m => { m.hidden = true; });
    $$('[data-action="toggle-tools"], [data-action="toggle-options"]')
      .forEach(t => t.setAttribute('aria-expanded', 'false'));
  }
  function toggleMenu(menuSel, trigger) {
    const menu = $(menuSel);
    if (!menu) return;
    const willOpen = menu.hidden;
    closeMenus();
    if (willOpen) {
      anchorMenuTo(menu, trigger);
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
  }
  $$('[data-action="toggle-tools"]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); toggleMenu('[data-tools-menu]', b); }));
  $$('[data-action="toggle-options"]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); toggleMenu('[data-options-menu]', b); }));

  // Options-menu selections drive the same state as the desktop controls
  $$('[data-options-menu] [data-sort]').forEach(b =>
    b.addEventListener('click', () => { setSort(b.dataset.sort); closeMenus(); }));
  $$('[data-options-menu] [data-view]').forEach(b =>
    b.addEventListener('click', () => { setView(b.dataset.view); closeMenus(); }));
  // Tools-menu items mirror the inline tool buttons (inert in isolation) — just close
  $$('[data-tools-menu] .px-menu__item').forEach(b =>
    b.addEventListener('click', () => closeMenus()));

  // Dismiss: outside click, Escape, or viewport change (avoids stale anchor)
  document.addEventListener('click', e => {
    if (!e.target.closest('.toolbar__menu') &&
        !e.target.closest('[data-action="toggle-tools"]') &&
        !e.target.closest('[data-action="toggle-options"]')) closeMenus();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
  window.addEventListener('resize', closeMenus);
  window.addEventListener('scroll', closeMenus, true);

  // ============================ INIT ============================
  setView('table'); // Table is the default active view (matches the source)
  setSort('Last Updated');

  // Theme deep-link — the source supports #theme=dark; keep it so both the light
  // and dark Praxis surfaces can be previewed from the same URL.
  function applyTheme() {
    const p = new URLSearchParams(location.hash.slice(1));
    const t = p.get('theme');
    if (t === 'dark' || t === 'light') document.body.dataset.theme = t;
  }
  applyTheme();
  window.addEventListener('hashchange', applyTheme);
})();
