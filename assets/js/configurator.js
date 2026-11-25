/* Paket-Konfigurator: rechnet die Auswahl in eine Monatssumme um. Preise stehen als data-Attribute im HTML. */
(function () {
  'use strict';
  var form = document.querySelector('[data-config]');
  if (!form) return;
  var eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var outMonat = form.querySelector('[data-sum-monat]');
  var outEinmal = form.querySelector('[data-sum-einmal]');
  var chosen = form.querySelector('[data-chosen]');
  var cta = form.querySelector('[data-config-cta]');
  var last = { m: null, e: null };

  function swap(el, text) {
    if (el.textContent === text) return;
    el.classList.add('swap');
    setTimeout(function () { el.textContent = text; el.classList.remove('swap'); }, 90);
  }
  function update() {
    var monat = 0, einmal = 0, labels = [], keys = [];
    form.querySelectorAll('input:checked').forEach(function (i) {
      if (i.dataset.monat) monat += Number(i.dataset.monat);
      if (i.dataset.einmal) einmal += Number(i.dataset.einmal);
      if (i.value !== 'ohne') { labels.push(i.dataset.label); keys.push(i.value); }
    });
    var m = eur.format(monat), e = eur.format(einmal);
    if (last.m === null) { outMonat.textContent = m; outEinmal.textContent = e; } else { swap(outMonat, m); swap(outEinmal, e); }
    last.m = m; last.e = e;
    chosen.innerHTML = '';
    (labels.length ? labels : ['Noch nichts ausgewählt']).forEach(function (l) { var li = document.createElement('li'); li.textContent = l; chosen.appendChild(li); });
    cta.href = '/kontakt' + (keys.length ? '?paket=' + encodeURIComponent(keys.join(',')) : '');
  }
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  update();
})();
