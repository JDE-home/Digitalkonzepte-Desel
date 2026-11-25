/* Kontaktformular: Themen-Vorauswahl über den Link, Prüfung im Browser, Versand an /api/contact. */
(function () {
  'use strict';
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var loaded = Date.now();
  var status = form.querySelector('[data-status]');
  var button = form.querySelector('button[type="submit"]');
  // Vorauswahl über den Link (?thema=websites | ki | beides)
  var THEMEN = { websites: 'Websites', ki: 'KI', beides: 'Websites und KI' };
  var thema = THEMEN[new URLSearchParams(location.search).get('thema')];
  if (thema) form.elements.topic.value = thema;

  function fieldError(name, msg) {
    var el = form.elements[name], err = document.getElementById(name + '-error');
    if (!el || !err) return;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', name + '-error'); else el.removeAttribute('aria-describedby');
    err.textContent = msg || '';
  }
  function validate() {
    var bad = [];
    var name = form.elements.name.value.trim();
    var mail = form.elements.mail.value.trim();
    fieldError('name', name ? '' : 'Bitte geben Sie Ihren Namen an.'); if (!name) bad.push('name');
    var okMail = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(mail);
    fieldError('mail', okMail ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.'); if (!okMail) bad.push('mail');
    var ok = form.elements.consent.checked;
    fieldError('consent', ok ? '' : 'Bitte stimmen Sie der Datenschutzerklärung zu.'); if (!ok) bad.push('consent');
    return bad;
  }
  function say(state, text) { status.dataset.state = state; status.textContent = text; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('', '');
    var bad = validate();
    if (bad.length) { say('error', 'Bitte prüfen Sie die markierten Felder.'); form.elements[bad[0]].focus(); return; }
    var label = button.textContent;
    button.disabled = true; button.textContent = 'Wird gesendet …';
    var wait = Math.max(0, 3200 - (Date.now() - loaded)); // Zeitfalle: der Server verwirft Absendungen unter 3 Sekunden
    setTimeout(function () {
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      data.elapsed = Date.now() - loaded;
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (r.ok) { say('ok', 'Vielen Dank für Ihre Nachricht. Ich melde mich so schnell wie möglich bei Ihnen.'); form.reset(); loaded = Date.now(); return; }
          if (r.status === 429) return say('error', 'Es wurden zu viele Anfragen gesendet. Bitte versuchen Sie es später noch einmal.');
          if (r.status === 503) return say('error', 'Das Formular ist derzeit nicht verfügbar. Bitte schreiben Sie mir direkt per E-Mail.');
          say('error', 'Das Senden hat leider nicht geklappt. Bitte versuchen Sie es erneut oder schreiben Sie mir direkt per E-Mail.');
        })
        .catch(function () { say('error', 'Keine Verbindung. Bitte prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.'); })
        .then(function () { button.disabled = false; button.textContent = label; });
    }, wait);
  });
})();
