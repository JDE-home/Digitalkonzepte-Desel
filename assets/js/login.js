/* Login: schickt das Passwort an /api/login und leitet nach Erfolg weiter. */
(function () {
  'use strict';
  var form = document.getElementById('login-form');
  var pw = document.getElementById('pw');
  var err = document.getElementById('login-err');
  var btn = form.querySelector('button');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true; err.textContent = '';
    fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw.value }) })
      .then(function (r) {
        if (r.ok) {
          var n = new URLSearchParams(location.search).get('next');
          location.replace(n && n.charAt(0) === '/' && n.charAt(1) !== '/' ? n : '/');
          return;
        }
        err.textContent = r.status === 503 ? 'Der Zugang ist noch nicht eingerichtet.' : 'Falsches Passwort. Bitte versuchen Sie es erneut.';
        pw.select();
      })
      .catch(function () { err.textContent = 'Keine Verbindung. Bitte versuchen Sie es erneut.'; })
      .then(function () { btn.disabled = false; });
  });
})();
