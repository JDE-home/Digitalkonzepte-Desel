/* Start-Hero: Lichtkegel folgt dem Mauszeiger über den Kacheln. Nur mit Maus und ohne reduzierte Bewegung. */
(function () {
  'use strict';
  var wrap = document.querySelector('.tiles');
  if (!wrap || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tiles = Array.prototype.slice.call(wrap.querySelectorAll('.tile'));
  var frame = 0, px = 0, py = 0;
  function paint() {
    frame = 0;
    tiles.forEach(function (t) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (px - r.left) + 'px');
      t.style.setProperty('--my', (py - r.top) + 'px');
    });
  }
  wrap.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!frame) frame = requestAnimationFrame(paint); });
})();
