// Search page toolbar — isolated interaction layer (AFTER / groom lake).
// Ported from the groom lake search-page.html view switcher, trimmed to the
// toolbar. Result views live in the full page, so here setView only drives the
// view-switch selection state. Sort + Export are visual buttons in the source
// (no popup) and are preserved as such.
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ============================ VIEW SWITCHER ============================
  function setView(view) {
    $$('.viewswitch__btn').forEach(b => {
      const on = b.dataset.view === view;
      b.classList.toggle('viewswitch__btn--active', on);
      // Expose the selected view to assistive tech (toggle-button group).
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  $$('.viewswitch__btn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  setView('table'); // Table is the default active view (matches the source)

  // Theme deep-link — the source supports #theme=dark; keep it so both the light
  // and dark Praxis surfaces can be previewed from the same URL.
  (function () {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('theme') === 'dark') document.body.dataset.theme = 'dark';
    if (p.get('theme') === 'light') document.body.dataset.theme = 'light';
  })();
  window.addEventListener('hashchange', () => {
    const p = new URLSearchParams(location.hash.slice(1));
    const t = p.get('theme');
    if (t === 'dark' || t === 'light') document.body.dataset.theme = t;
  });
})();
