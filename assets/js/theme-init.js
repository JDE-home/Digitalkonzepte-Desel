/* Läuft synchron im <head>: setzt Design (hell/dunkel) und die Klasse "js", bevor die Seite gezeichnet wird. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    d.dataset.theme = t;
  } catch (e) { /* ohne Speicher gilt das Systemdesign per CSS-Standard (hell) */ }
})();
