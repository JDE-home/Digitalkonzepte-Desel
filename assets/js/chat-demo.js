/* Chat-Demo: spielt eine vorgeschriebene Beispiel-Unterhaltung ab, sobald sie sichtbar wird.
   Es findet KEIN echter KI-Aufruf statt und es werden keine Daten gesendet. */
(function () {
  'use strict';
  var demo = document.querySelector('[data-chat-demo]');
  if (!demo) return;
  var log = demo.querySelector('.chat-log');
  var steps = Array.prototype.slice.call(log.querySelectorAll('[data-step]'));
  var replay = demo.querySelector('[data-replay]');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { if (replay) replay.hidden = true; return; }

  var timers = [], typing = null;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function reset() { timers.forEach(clearTimeout); timers = []; if (typing) { typing.remove(); typing = null; } steps.forEach(function (s) { s.hidden = true; }); }
  function showTyping() {
    typing = document.createElement('div');
    typing.className = 'msg in typing'; typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.insertBefore(typing, steps.find(function (s) { return s.hidden; }) || null);
  }
  function play() {
    reset();
    var t = 350;
    steps.forEach(function (s) {
      var isIn = s.classList.contains('in');
      if (isIn) { later(showTyping, t); t += 900; }
      later(function () { if (typing) { typing.remove(); typing = null; } s.hidden = false; }, t);
      t += s.hasAttribute('data-chips') ? 300 : 700;
    });
  }
  steps.forEach(function (s) { s.hidden = true; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.5 });
    io.observe(demo);
  } else { steps.forEach(function (s) { s.hidden = false; }); }
  if (replay) replay.addEventListener('click', play);
})();
