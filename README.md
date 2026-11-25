# Digitalkonzepte Desel – Website

Websites und KI-Einstieg für kleine Unternehmen (Jannik Desel, Oelde). Zwei getrennte Wege: **Websites** (Aufbau, Hosting, Pflege im Monatsabo)
und **KI im Betrieb** (Potenziale erkennen, Chat-Agents aufbauen, Team schulen). Mehrseitige, statische Website ohne Framework,
Hosting auf Vercel, Kontaktformular über Resend, Passwortschutz über Vercel-Middleware. Gleicher Stack und gleiche Farbwelt wie die Schwesterseite „Finanzkonzepte Desel“.

- Ansprache der Besucher: **Sie**, Ich-Form. Texte sind ein erster Entwurf, offene Stellen stehen als `[TODO]` (im Browser gelb-gestrichelt markiert).
- Keine Werbe-Cookies, kein Tracking, keine Fremdhosts (Schriften lokal). Gespeichert wird die Hell/Dunkel-Wahl nach Klick (`localStorage`) und, solange der Passwortschutz aktiv ist, das technisch notwendige Login-Cookie `dk_auth` (7 Tage).
- Impressum und Datenschutz sind **Entwürfe** und müssen rechtlich geprüft werden.

## Aufbau

```
src/            Seiten (nur der <main>-Inhalt), partials/ (layout, header, footer, cta-band), pages.json, site.json
assets/         css/ (tokens, base, components, fonts), js/, img/, fonts/
api/contact.js  Formular (Resend + zod, Honeypot, Zeitfalle, Rate-Limit)
api/login.js    Passwortprüfung, setzt das Login-Cookie
middleware.js   Passwortschutz für alle Seiten (auth.js: Token-Hilfen)
tools/          build.mjs, og-image.mjs, shoot.mjs, logo-freistellen.py
tests/          contact, auth, seo, a11y (axe-core), runtime (Interaktionen unter echter CSP)
design/         Hero-Entwürfe und Screenshots (nicht Teil der Website)
PRODUCT.md      Produktbeschreibung für die Design-Skills
```

`node tools/build.mjs` baut nach `public/` (Vercel macht das über `buildCommand`). Der Build setzt Kopf/Fuß in jede Seite, erzeugt
`sitemap.xml`, `robots.txt` und strukturierte Daten (LocalBusiness, Breadcrumbs) aus `src/pages.json` und bricht bei toten internen Links ab.

```
npm install
npm test                 # baut und führt alle Tests aus
npx vercel dev           # lokal mit Formular-Funktion (braucht .env.local)
node tools/og-image.mjs  # Vorschaubilder (assets/img/og-*.png) neu erzeugen
```

## Inhalte pflegen

- **Offene Stellen finden:** `grep -rn 'class="todo"' src`
- **Preise:** Richtwerte und Vorschläge, bewusst ohne feste Preise. Websites: Richtwerte in `src/pakete-preise.html` (Abschnitt „Websites im Monatsabo“) und als Satz in `src/websites.html`. KI: die vier Angebote samt Preisvorschlägen in `src/pakete-preise.html` (Abschnitt „KI im Betrieb: Angebote“), als Vorschlag markiert.
- **Seiten und Menü:** `src/pages.json` (Menüpunkte = Einträge mit `nav`).
- **Titel und Beschreibungen:** `src/pages.json`. Neue Seite: Datei in `src/` anlegen und in `pages.json` eintragen.
- **Foto:** Platzhalter in `src/ueber-mich.html`. Eine Referenzseite gibt es derzeit nicht (bewusst entfernt, bei Bedarf wieder anlegen und in `src/pages.json` eintragen).
- **Startseite:** Auswahl Websites/KI in `src/index.html` (zwei Flächen, die zusammen das „D“ des Logos bilden). Beide Flächen sind komplett klickbar und per Tastatur erreichbar.
- **Terminbuchung:** Link in `src/kontakt.html` (Abschnitt „Termin direkt buchen“) eintragen. Nur verlinken, nicht einbetten (sonst Fremdverbindung ohne Einwilligung).

## Farben und Schriften

Farbwelt der Finanzkonzepte-Seite: Tannengrün `#1E3D34`, Graugrün `#8AA399`, Stein `#F2F0EB`, Kupfer `#B5835A` (Tokens in `assets/css/tokens.css`,
dazu abgeleiteter Dunkelmodus). Kupfer ist nie Textfarbe auf hellem Grund (2,9 : 1): dort gilt `--copper-text` (`#8A5C38`). Das Logo behält seine eigenen Farben
und sitzt im Dunkelmodus auf einer weißen Unterlage. Schriften: Fraunces und Inter (SIL OFL, `assets/fonts`), kein Google-Server.

## Passwortschutz (Login)

Die gesamte Website liegt hinter einem Passwort (`middleware.js`, `api/login.js`, `src/login.html`). Nur `/login`, `/impressum`, `/datenschutz` und `/assets/` sind offen.

1. Vercel → Projekt → **Settings → Environment Variables**
2. Name `SITE_PASSWORD`, Wert: ein langes eigenes Passwort, **Production und Preview** anhaken
3. **Neu deployen** (Änderungen an Variablen wirken erst nach einem neuen Deployment)

Ohne `SITE_PASSWORD` bleibt die Seite gesperrt. Wird das Passwort geändert, müssen sich alle neu anmelden. Das Passwort steht nie im Code.
Lokal testen: `.env.local` aus `.env.example` anlegen und `npx vercel dev` starten.

## Formular (Resend)

Einrichtung einmalig:

1. Bei Resend die Domain `digitalkonzepte-desel.de` verifizieren (DNS bei INWX).
2. API-Key erzeugen und in Vercel unter **Settings → Environment Variables** anlegen (Production und Preview), danach neu deployen.

| Name | Wert |
| --- | --- |
| `SITE_PASSWORD` | Passwort für den geschützten Bereich (**Pflicht**, siehe oben) |
| `RESEND_API_KEY` | API-Key aus Resend (**Pflicht**) |
| `CONTACT_TO` | Empfängeradresse (**Pflicht**, steht bewusst nicht im Code) |
| `CONTACT_FROM` | optional, Standard `Digitalkonzepte Desel <kontakt@digitalkonzepte-desel.de>` |
| `CONTACT_CONFIRM` | optional, `1` schickt dem Absender eine Eingangsbestätigung |

Ohne `RESEND_API_KEY` oder `CONTACT_TO` zeigt die Seite „Das Formular ist derzeit nicht verfügbar“ und sendet nichts.
Das Rate-Limit pro IP gilt nur je Funktionsinstanz. Für ein hartes Limit in Vercel unter **Firewall** eine Regel für `POST /api/contact` mit Rate-Limit anlegen.

## Livegang

1. Alle `[TODO]` abarbeiten (Preise, Texte, Foto, Kontaktdaten, Terminlink), Rechtstexte prüfen lassen und `[TODO]`/Entwurf-Hinweis dort entfernen.
2. `src/site.json`: `"live": true` setzen (entfernt `noindex` und öffnet `robots.txt`).
3. `vercel.json`: den Header `X-Robots-Tag` löschen.
3a. **Passwortschutz abschalten:** `middleware.js`, `auth.js`, `api/login.js`, `src/login.html`, `assets/js/login.js` und den `login`-Eintrag in `src/pages.json` löschen, `@vercel/functions` aus `package.json` entfernen, `tests/auth.test.mjs` löschen, die Variable `SITE_PASSWORD` in Vercel entfernen und in `src/datenschutz.html` den Absatz „Geschützter Bereich“ (Cookie `dk_auth`) streichen. Nur die Variable zu löschen reicht nicht: Solange `middleware.js` existiert, bleibt die Seite ohne `SITE_PASSWORD` gesperrt.
4. Domain `digitalkonzepte-desel.de` als Hauptdomain im Vercel-Projekt setzen, `www` und weitere Domains darauf weiterleiten.
5. Formular mit echter Testmail prüfen, Firewall-Regel anlegen.
6. Nach dem Start: Vorschau mit Sharing-Debugger prüfen, `sitemap.xml` in der Google Search Console einreichen, Google-Unternehmensprofil anlegen.

## Design-Skills im Projekt (`.claude/skills`)

Impeccable (mit Design-Hook, Ausnahmen für die Markenschriften in `.impeccable/config.json`), Emil-Kowalski-Skills (Bewegung, Details) und UI UX Pro Max
(nur als Ideengeber). Rangfolge bei Widersprüchen: Recht, Barrierefreiheit und Datenschutz vor Marke, dann Impeccable, Emil, UI UX Pro Max.
