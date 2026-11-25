/* Allgemein: Design-Umschalter, mobiles Menü, Einblenden beim Scrollen. */
(function () {
  'use strict';
  var root = document.documentElement;

  // Hell/Dunkel. Gespeichert wird nur nach einem Klick (Datenschutzerklärung: lokale Speicherung).
  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* ignorieren */ }
  });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('theme')) root.dataset.theme = e.matches ? 'dark' : 'light';
    });
  } catch (e) { /* ältere Browser */ }

  // Mobiles Menü
  var header = document.querySelector('[data-header]');
  var burger = document.querySelector('[data-menu-toggle]');
  function setMenu(open, focusBtn) {
    if (!header || !burger) return;
    if (open) header.setAttribute('data-open', ''); else header.removeAttribute('data-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    if (!open && focusBtn) burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!header.hasAttribute('data-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.hasAttribute('data-open')) setMenu(false, true); });
    header.querySelectorAll('[data-nav] a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    matchMedia('(min-width: 901px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  // Einblenden beim Scrollen
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();
