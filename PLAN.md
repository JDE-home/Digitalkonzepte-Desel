# Plan: Website „Digitalkonzepte Desel“

Stand: **freigegeben** (alle acht Empfehlungen aus Abschnitt 10 angenommen). Farbwelt: **Finanzkonzepte** (nicht die Logo-Farben).
Umgesetzt: Phase 0 bis 4 (Skills, Fundament, alle Seiten, Formular, Rechtsentwürfe, SEO, Tests). Gewählt: Hero A (Raster), Chat-Demo als Abschnitt auf „Leistungen“, Richtung „präzise-technisch“, Paket-Konfigurator. Offen: Phase 5 (Vercel, Domain, Resend) und die `[TODO]`-Inhalte.

**Änderung nach Rückmeldung:** Startseite als Auswahl Websites (links) / KI (rechts) mit eigenen Unterseiten `/websites` und `/ki`. Der Konfigurator entfällt, Preise nur als Richtwerte und Vorschläge. KI-Angebote sind unabhängig von der Website (Workshops, Chat-Agents, Schulung). Dazu ein Passwortschutz über der gesamten Seite (`SITE_PASSWORD`).

---

## 1. Befund: Was „desel-finanzkonzepte“ technisch ist

Gelesen aus dem Repo `JDE-home/Desel-Finanzkonzepte` (privat) und der Vercel-Projektliste (Team `JDE`, Projekt `desel-finanzkonzepte` existiert).

| Bereich | Finanzkonzepte heute |
| --- | --- |
| Framework | **keins**. Statisches HTML, CSS inline im `<style>` der `index.html` (1018 Zeilen), kein Build-Schritt |
| Backend | Vercel Functions (ESM): `api/contact.js` mit `resend` + `zod` |
| Formular | Honeypot, Zeitfalle (3 s), Rate-Limit pro IP (best effort), serverseitige Validierung, Versand via Resend, optionale Eingangsbestätigung |
| Schutz | `middleware.js` + `auth.js` + `api/login.js` (Passwort-Gate), `X-Robots-Tag: noindex` in `vercel.json` |
| Vercel | `cleanUrls: true`, Region `fra1`, Sicherheitsheader minimal |
| Schriften | Fraunces (500/600) + Inter (400/500/600), lokal als woff2 (`assets/fonts`), `font-display: swap`, OFL-Lizenzen liegen bei |
| Farben | CSS-Variablen, Hell- und Dunkelmodus (`data-theme`), Kontraste dokumentiert |
| Sprache | Deutsch + Englisch-Umschalter (`assets/i18n.js`, Tests) |
| Tests | `node --test` (Formular-API, i18n/Du-Form) |
| Logo | Freistellskript `tools/freistellen.py`, im Dunkelmodus weiße Unterlage |

**Folgerung:** Der „gleiche Stack“ ist bewusst schlank. Wir bleiben dabei (HTML/CSS/Vanilla-JS, Vercel Functions, Resend, zod, lokale Schriften). Es kommt höchstens ein winziges, abhängigkeitsfreies Include-Skript dazu (siehe 6.1).

---

## 2. Logo und Farben

> **Entscheidung:** Die Website nutzt die **Farbwelt der Finanzkonzepte-Seite** (Tannengrün `#1E3D34`, Graugrün `#8AA399`, Stein `#F2F0EB`, Kupfer `#B5835A`, Text `#3F5A4E`). Das Logo bleibt unverändert und behält seine eigenen Farben (wie bei Finanzkonzepte). Die Tokens liegen in `assets/css/tokens.css`. Die folgende Messung der Logo-Farben bleibt als Referenz stehen.

Das Logo (vier Flächen als „D“ + Schriftzug „Digitalkonzepte **Desel**“) liegt vor. Das ersetzt die geplante Platzhalter-Wortmarke. Die Datei ist eine WebP mit weißem Hintergrund (1774 × 887 px) und muss noch freigestellt bzw. als SVG nachgebaut werden.

### Farbcodes aus dem Logo (Pixel gemessen, Mittelwert flächiger Bereiche)

| Rolle | Hex | RGB |
| --- | --- | --- |
| Dunkelgrün (Fläche unten links **und** Schrift) | `#003F2C` | 0 / 63 / 44 |
| Salbei (oben links) | `#84A38F` | 132 / 163 / 143 |
| Kupfer/Terrakotta (oben rechts) | `#BF8155` | 191 / 129 / 85 |
| Sand/Taupe (unten rechts) | `#B4A89A` | 180 / 168 / 154 |

Hinweis: Gemessen aus einer verlustbehafteten WebP, Abweichung ±1–2 pro Kanal möglich. Bitte gegen die Originaldatei oder Ihre Markenvorgabe bestätigen.
Die Werte liegen sehr nah an der Finanzkonzepte-Familie (dort Tannengrün `#1E3D34`, Salbei `#8AA399`, Kupfer `#B5835A`). Das neue Dunkelgrün ist etwas satter und dunkler. Genau das ist die „erkennbar zusammengehörig, leicht abgewandelt“-Linie.

### Kontraste (WCAG, berechnet)

| Kombination | Verhältnis | Folge |
| --- | --- | --- |
| Dunkelgrün auf Weiß / Stein | 12,0 : 1 / ≈10,7 : 1 | Fließtext und Überschriften, AAA |
| Kupfer `#BF8155` auf Weiß / Stein | 3,24 : 1 / 2,87 : 1 | **nie als Text**, nur Flächen, Linien, Deko |
| Dunkelgrün **auf** Kupfer | 3,71 : 1 | reicht **nicht** für normalen Buttontext. Buttontext auf Kupfer bekommt ein fast schwarzes Grün (Zielwert ≥ 4,5 : 1, im Test geprüft) |
| Kupfer-Text auf hellem Grund | `#8F5A33` = 5,07 : 1 | für Eyebrows, Links, Preise |
| Salbei auf Weiß | 2,76 : 1 | nur dekorativ |
| Kupfer hell `#D9A67B` auf Dunkelgrün | 5,55 : 1 | Akzenttext auf dunklen Flächen |
| Sand `#B4A89A` auf Dunkelgrün | 5,16 : 1 | Sekundärtext auf dunklen Flächen |

Token-Vorschlag (Details beim Bau): `--green #003F2C`, `--sage #84A38F`, `--copper #BF8155`, `--sand #B4A89A`, `--page #F2F0EB` (gleich wie Finanzkonzepte), `--copper-text #8F5A33`, dazu abgeleiteter Dunkelmodus.

---

## 3. Skills: Recherche und Einbindung

### 3.1 Ihre drei Wunschkandidaten

| Skill | Was er kann (laut README) | Einbindung | Einsatz bei uns | Vorsicht |
| --- | --- | --- | --- | --- |
| **Impeccable** (`pbakaus/impeccable`, Apache-2.0) | 24 Befehle (`shape`, `typeset`, `layout`, `critique`, `audit`, `polish`, `harden`, `clarify`, `adapt`, `optimize` …), schreibt `PRODUCT.md`/`DESIGN.md`, Detektor mit 62 deterministischen Regeln gegen „KI-Look“ (auch per CLI auf URLs), optionaler Hook prüft jede bearbeitete UI-Datei | `npx impeccable install` (Projekt-Scope, Provider `claude`) oder `/plugin marketplace add pbakaus/impeccable`. Danach `/impeccable init` | **Rückgrat** für Designrichtung, Review und Endschliff | (1) „Live mode“ startet bei „Apply“ ggf. einen Agenten mit ausgeschalteten Berechtigungsprüfungen → **nicht nutzen** bzw. `IMPECCABLE_LIVE_COPY_AGENT=chat`. (2) Markiert **Inter** als überstrapaziert → bewusste Ausnahme mit Begründung oder Schriftwechsel. (3) Skill, Hook und Engine-Binary vor dem ersten Lauf prüfen, Version festschreiben |
| **Emil Kowalski** (`emilkowalski/skills`) | `emil-design-eng` (Animation + Detailregeln), `animate`, `choreograph`, `review-animations`, `find-animation-opportunities`, `remove-animations`, `animation-performance`, `mobile-native`, `break-ui`, `apple-design`, `prototype`, `learn-taste` | `npx skills@latest add emilkowalski/skills` (Projekt-Scope, Claude Code) | Bewegung (Easing, Dauer <300 ms, `prefers-reduced-motion`), Mikro-Details, Touch-Feinschliff, Gegenprobe „was sollten wir **nicht** animieren“ | In dieser Sitzung liegt bereits eine **Drittanbieter-Kopie** (`audit-suite:emil-design-engineering`, `make-interfaces-feel-better`, `web-animation-design`). Wir nutzen sie vorläufig, ersetzen sie aber durch das offizielle Repo des Autors |
| **UI UX Pro Max** (`nextlevelbuilder/ui-ux-pro-max-skill`) | Design-System-Generator: 194 Branchenregeln, 80 UI-Stile, 194 Paletten, 74 Schriftpaarungen, 141 UX-Richtlinien, 22 Stacks (u. a. HTML+Tailwind). Python-3-Suchskript ohne Netzzugriff | Plugin: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`; oder `npx skills add … --skill ui-ux-pro-max --agent claude-code`; Python 3 ist vorhanden | **Nur Ideengeber** in der Startphase (Stilrichtung, Landing-Page-Struktur, UX-Checkliste) | Liefert Schriften als **Google-Fonts-Import** (bei uns verboten, wir hosten lokal). Paletten werden durch die Logo-Farben überstimmt. Es gibt eine kostenpflichtige Premium-Variante, die wir nicht brauchen |

### 3.2 Weitere Skills und Werkzeuge (Empfehlung)

| Kandidat | Nutzen | Empfehlung |
| --- | --- | --- |
| **Vercel `web-design-guidelines`** (hier schon verfügbar) | Prüfung gegen 100+ Web-Interface-Regeln | **ja**, Review-Schritt vor Livegang |
| **`audit-suite:audit-as-a11y-eng`, `audit-as-ux-eng`, `audit-as-design-eng`, `audit-as-perf-eng`, `audit-as-prod-readiness`** (hier schon verfügbar) | Prüfen „aus Sicht von“ Rollen | **ja** für a11y, UX, Design, Prod-Readiness. Die Lenses `backend`/`dx` sind auf Rust/Tauri zugeschnitten und entfallen |
| **`security-review`, `code-review`** (eingebaut) | `api/contact.js` (Header-Injection, Spam, Fehlerbehandlung) | **ja** |
| **Playwright** (Chromium vorinstalliert) | Screenshots mobil/Tablet/Desktop, Hell/Dunkel, reduzierte Bewegung, Tastaturtest | **ja**, wiederholbare Sichtkontrolle |
| **axe-core** (`@axe-core/playwright`) als Dev-Abhängigkeit | automatischer WCAG-Test je Seite im `npm test` | **ja** |
| **Lighthouse** | Performance/SEO/A11y-Messung | **ja**, Ziel ≥ 95 |
| **Anthropic `frontend-design`** (offiziell) | Grundregeln gegen generischen KI-Look | **nein**, Impeccable ist daraus hervorgegangen und deckt es ab |
| **`AgriciDaniel/claude-seo`** (Teilskills `seo-schema`, `seo-local`) | Schema.org und lokales SEO | **optional**, nur gezielt und nach Code-Durchsicht. Das Paket ist groß (19 Teilskills, 12 Agenten). Wir brauchen nur ein JSON-LD und können es selbst sauber schreiben. Ein deutsch-spezifischer SEO-Skill wurde nicht gefunden |
| `vercel-react-best-practices` | React/Next | **nein**, kein React |

Quellen: [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) · [Impeccable](https://github.com/pbakaus/impeccable) · [emilkowalski/skills](https://github.com/emilkowalski/skills) · [Anthropic frontend-design (Verzeichnis)](https://www.skills.sh/anthropics/claude-plugins-official/frontend-design) · [claude-seo](https://github.com/AgriciDaniel/claude-seo)

### 3.3 Rangfolge bei Widersprüchen

1. **Recht, Barrierefreiheit, Datenschutz** (z. B. keine Google-Fonts, kein Tracking, Kontraste)
2. **Marke**: Logo-Farben, Sie-Ansprache, `PRODUCT.md` und `DESIGN.md` dieses Projekts
3. **Impeccable** (Richtung und Review)
4. **Emil Kowalski** (Bewegung und Details)
5. **UI UX Pro Max** (nur Vorschläge)

### 3.4 Wie die Skills ins Repo kommen

- Installation **im Projekt-Scope** nach `.claude/skills/` und committen, damit sie in jeder Cloud-Sitzung da sind.
- Vor dem Commit: `SKILL.md`, Hook-Skripte und mitgelieferte Binaries durchsehen (Drittanbieter-Code).
- Neu installierte Skills erscheinen erst nach Neustart/Fortsetzen der Sitzung.
- Der Impeccable-Detektor läuft zusätzlich als `npx impeccable detect` gegen Quellcode **und** die laufende Seite.

---

## 4. Seitenstruktur

| Route | Seite | Inhalt |
| --- | --- | --- |
| `/` | Startseite | Hero mit Kernbotschaft, Leistungsüberblick (3 Karten), Vorteile (ein Ansprechpartner, persönlich, transparente Preise), Ablauf in 4 Schritten, Referenz-Teaser, CTA Erstgespräch |
| `/leistungen` | Leistungen | A) Websites (Erstellung, Hosting, Pflege im Abo) · B) KI-Beratung (Potenziale, Einführung, Schulung) · C) Brücke: KI-Funktionen für die Website (Chat-Assistent, automatisierte Anfragen) |
| `/pakete-preise` | Pakete & Preise | Website-Abo (Einrichtung + Hosting + Pflege), KI-Einstiegsberatung, Kombi. Preise `[TODO]`. Hinweis § 19 UStG. FAQ |
| `/ueber-mich` | Über mich | Foto-Platzhalter, Werdegang `[TODO]`, Haltung |
| `/referenzen` | Referenzen | Platzhalter-Kacheln |
| `/kontakt` | Kontakt | Formular (Resend), Platzhalter für Terminbuchungslink |
| `/webdesign-ki-beratung-oelde` | Lokale Landingpage | „Webdesign & KI-Beratung in Oelde“, überregional lesbar |
| `/impressum`, `/datenschutz` | Rechtstexte | Als **Entwurf** gekennzeichnet |
| `/404` | Fehlerseite | **Zusatz**, nicht angefragt (kleiner Aufwand, bessere Nutzerführung) |

Alle Texte: Sie-Form, Ich-Form wie bei Finanzkonzepte (ein Ansprechpartner), erster Entwurf, Lücken als `[TODO]` sichtbar markiert.

---

## 5. Komponenten

Skip-Link · Header (Logo, Navigation, CTA, Hell/Dunkel-Schalter, mobiles Menü mit Tastaturbedienung) · Hero · Abschnittskopf (Eyebrow, Titel, Lead) · Leistungskarten · Vorteilsreihe · Ablauf/Zeitstrahl · Paketkarten + Vergleich · FAQ (`<details>`) · **Chat-Demo** (statische, animierte Beispiel-Unterhaltung, **kein** echter KI-Aufruf, daher kein Datenabfluss) · Referenzkachel · Über-mich-Block · CTA-Band · Kontaktformular mit Fehlerzusammenfassung · Terminlink-Box · Breadcrumbs (Lokalseite) · Footer · Rechtstext-Layout · 404.

### Gestaltungsidee („ruhige Präzision“)

- **Signatur-Motiv:** das 2×2-Kachelraster mit der einen Viertelrundung aus dem Logo als Layout- und Illustrationsprinzip (Bento-artige Raster, „Website + KI“ als zusammengesetzte Kacheln).
- Große, ruhige Typografie, viel Weißraum, Kupfer sparsam. Kein Violett, kein Neon-Glow, keine Chrome-Gradienten.
- **Schrift:** Fraunces für Überschriften, Inter für Text, identisch zu Finanzkonzepte (Familienband), alles lokal. Eine Monospace als „Tech“-Kostüm entfällt (Impeccable lehnt das ab, nur für echten Code oder Daten sinnvoll). Der Detektor meldet Inter und Fraunces als häufig. Das ist als Markenschrift bewusst akzeptiert und in `.impeccable/config.json` begründet.
- **Bewusst anders als Finanzkonzepte:** keine Eyebrow-Zeilen über Überschriften, keine gleichförmigen Icon-Kacheln als Seitenstruktur, keine Kennzahlen-Kacheln, keine endlos schwebenden Elemente.
- **Bewegung:** nur CSS, Eintrittsanimationen < 300 ms mit `ease-out`, vollständig abgeschaltet bei `prefers-reduced-motion`, keine Animationsbibliothek.
- Performance-Budget: Lighthouse ≥ 95, kein Layout-Shift, Schriften vorgeladen, Bilder `webp`/`avif` mit Maßen.

---

## 6. Technik und Abweichungen zu Finanzkonzepte

### 6.1 Abweichungen

| Thema | Finanzkonzepte | Digitalkonzepte (Vorschlag) |
| --- | --- | --- |
| Aufbau | Ein-Seiter | **Mehrseitig** (9 Seiten) |
| Ansprache | Du | **Sie** |
| Seitencode | alles in einer `index.html`, CSS inline | gemeinsame `assets/css/*.css` (cachebar), Seiten-HTML; Kopf/Fuß als Partials, die ein abhängigkeitsfreies `tools/build.mjs` einsetzt (Vercel `buildCommand`, Ausgabe `public/`). Alternative: Kopf/Fuß in jede Seite kopieren (kein Build, aber Pflegeaufwand) |
| Passwortschutz | `middleware.js`, `auth.js`, `login` | **entfällt**. Stattdessen `noindex`-Header bis Livegang + Vercel Preview-Schutz |
| Sprache | DE/EN | **nur Deutsch**, `i18n.js` und zugehörige Tests entfallen |
| Farben | `#1E3D34` usw. | Logo-Farben (Abschnitt 2), Dunkelmodus abgeleitet |
| Logo | Finanzkonzepte-Logo | neues Logo, Freistellung + SVG, Dunkelmodus mit heller Unterlage |
| Bildsprache | Landschafts-Illustration, schwebende Karten | Kachel-Motiv, keine endlos „schwebenden“ Elemente |
| Formular | Themenliste Versicherung, Empfehlungsformular | Felder: Name, E-Mail, Telefon, Firma (optional), Anliegen (Website / KI-Beratung / Beides / Unsicher), Nachricht, Einwilligung. Kein Empfehlungsformular. Honeypot, Zeitfalle, Rate-Limit und zod bleiben. Bestätigungsmail in Sie-Form |
| Absender | `kontakt@finanzkonzepte-desel.de` | `kontakt@digitalkonzepte-desel.de` |
| Empfänger | Standard im Code | **nur per Umgebungsvariable** `CONTACT_TO` (Repo ist öffentlich) |
| Strukturierte Daten | `InsuranceAgency` | `ProfessionalService` (LocalBusiness) mit Standort Oelde, `areaServed`, dazu `WebSite` und `BreadcrumbList` |
| Tests | Formular, i18n | Formular, Linkprüfung, **axe-core je Seite**, Sie-Prüfung, Sitemap/Meta-Prüfung |

### 6.2 Dateistruktur (Vorschlag)

```
src/            Seiten (*.html) + partials/
assets/         css/, js/, fonts/, img/, logo
api/contact.js  Formular (Resend + zod)
tools/          build.mjs, og-image.mjs (Playwright), freistellen.py
tests/          contact.test.mjs, a11y.test.mjs, seo.test.mjs
public/         Build-Ausgabe (nicht committet)
vercel.json     cleanUrls, Region fra1, Header (CSP, noindex bis Livegang)
PRODUCT.md, DESIGN.md, README.md
```

### 6.3 Sicherheit und Header

`Content-Security-Policy` ohne Fremdhosts (alles self), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors`. Kein `localStorage` außer der vom Nutzer gewählten Hell/Dunkel-Einstellung (wird in der Datenschutzerklärung erwähnt).

---

## 7. SEO

- Eigener `<title>` und Meta-Description je Seite, Canonical, `lang="de"`.
- Open Graph + Twitter-Card, **OG-Bilder 1200×630** (je Seitentyp, erzeugt per Skript aus HTML via Playwright).
- `sitemap.xml` (mit `lastmod`), `robots.txt` (`Disallow: /api/`), Verweis auf die Sitemap.
- JSON-LD wie oben. **Adresse im Schema:** Vorschlag wie bei Finanzkonzepte nur Ort/PLZ/Gebiet, keine Straße (Wohnadresse). Die Straße steht im Impressum, wie gesetzlich nötig.
- Lokale Landingpage: eigene H1, Region (Oelde, Kreis Warendorf, Münsterland), echte lokale Inhalte statt Textbausteinen, interne Verlinkung, später Google-Unternehmensprofil `[TODO]`.
- Bis zum Livegang `noindex`. Beim Livegang entfernt eine Checkliste (README) diesen Header.

---

## 8. Rechtliches (nur Entwürfe, jeweils mit Hinweisbox „Entwurf, rechtliche Prüfung steht aus“)

- **Impressum** nach § 5 DDG: Jannik Desel, Anschrift in Oelde laut Ihren Angaben. E-Mail und Telefon `[TODO]`. Weitere Angaben (Gewerbeanmeldung, ggf. Berufsbezeichnungen) `[TODO]`.
- **Datenschutz:** Hosting Vercel (Region Frankfurt, Server-Logfiles), Resend (Formularversand), E-Mail-Postfach `[TODO Anbieter]`, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte, Aufsichtsbehörde NRW, Drittlandübermittlung (DPF/SCC) `[TODO prüfen]`. Keine Cookies, kein Tracking, keine eingebundenen Fremdinhalte.
- **Terminbuchung:** nur als **Link** (kein Einbetten), damit keine Fremdverbindung ohne Einwilligung entsteht.
- **Preise:** „§ 19 UStG, keine Umsatzsteuer ausgewiesen“ wie gewünscht. **Hinweis zur Prüfung:** „netto“ und „keine Umsatzsteuer“ zusammen kann missverständlich sein (Kleinunternehmer berechnen Endpreise). Ich übernehme zunächst Ihren Wortlaut und markiere die Stelle mit `[TODO prüfen]`. Denkbar wäre stattdessen: „Alle Preise sind Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“
- Produktnennung „z. B. Langdock“ nur sachlich, ohne Partnerschafts- oder Zertifizierungsbehauptung. `[TODO]` Prüfung, ob Sie Partner sind.

---

## 9. Vorgehen in Phasen mit Freigabe-Punkten

| Phase | Inhalt | Skills | Freigabe |
| --- | --- | --- | --- |
| **0 Setup** | Skills installieren (nach Durchsicht), Grundgerüst, `PRODUCT.md` | Impeccable `init`, `shape` | – |
| **1 Fundament** | Tokens, Schrift lokal, Logo (frei + SVG), Hero-Entwurf in 2–3 Varianten | UI UX Pro Max (Ideen), Impeccable `typeset`/`layout`, Emil `prototype` | **Sie wählen die Hero-Richtung** (Screenshots) |
| **2 Seiten** | alle Seiten mit Entwurfstexten und `[TODO]` | Impeccable `clarify`, Emil `animate`/`choreograph` | Zwischenstand per Screenshot |
| **3 Formular, Recht, SEO** | `api/contact.js` anpassen, Rechtstexte, Meta, OG, Schema | `security-review`, `code-review` | – |
| **4 Qualität** | Playwright (mobil/Tablet/Desktop, Hell/Dunkel, Tastatur), axe, Lighthouse, Detektor | Impeccable `critique`/`audit`/`polish`/`harden`, Emil `review-animations`/`break-ui`/`mobile-native`, `web-design-guidelines`, `audit-as-*` | Bericht mit offenen Punkten |
| **5 Betrieb** | Vercel-Projekt `desel-digitalkonzepte`, Env-Variablen, Domain, Resend | – | **Alles Außenwirksame erst nach Ihrem Okay** |

### Ihre Aufgaben außerhalb des Codes

1. Domain `digitalkonzepte-desel.de` bei INWX kaufen. Weitere Domains später als Weiterleitung.
2. Resend: Domain verifizieren (DNS bei INWX), API-Key erzeugen.
3. Postfach für die neue Domain klären (E-Mail im Impressum und `CONTACT_TO`).
4. Logo-Originaldatei (am besten Vektor) liefern.
5. Foto, Werdegang, Preise, Referenzen, Terminbuchungslink.
6. Rechtstexte prüfen lassen.

---

## 10. Entscheidungen (alle bestätigt)

1. Include-Skript für Kopf/Fuß: **ja**.
2. Dunkelmodus: **ja**, Logo dann auf heller Unterlage.
3. Repo bis zum Livegang **privat** stellen: **ja**. Umstellen kann nur der Repo-Inhaber in den GitHub-Einstellungen (Settings → General → Danger Zone → Change visibility). `CONTACT_TO` steht in jedem Fall nur in der Umgebungsvariable.
4. Hauptdomain **ohne** `www`, `www` leitet um: **ja**.
5. „LangDoc“ = **Langdock**: **ja**.
6. Schema-Adresse nur Ort/PLZ, ohne Straße: **ja**.
7. Postfach für die neue Domain: noch zu klären (E-Mail im Impressum, `CONTACT_TO`).
8. Querverweis zur Finanzkonzepte-Seite im Footer: **nein**, vorerst.

Zusätzlich: **Farbwelt = Finanzkonzepte** (siehe Abschnitt 2).
