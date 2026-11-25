# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Statisches HTML/CSS mit Vanilla-JS, Vercel (Region Frankfurt) und Vercel Functions für das Kontaktformular (Resend, zod). Kein Framework. Ein kleines abhängigkeitsfreies Include-Skript setzt gemeinsame Teile (Kopf, Fuß) in die Seiten ein. Gleicher Stack wie die Schwesterseite „desel-finanzkonzepte“. Vom Betreiber vorgegeben.

## Users

Inhaberinnen und Inhaber kleiner Unternehmen (Handwerk, Dienstleistung, lokaler Handel, Praxen, Vereine), meist ohne IT-Abteilung und ohne Zeit für Technikthemen. Sie brauchen eine verlässliche Website und wollen verstehen, ob und wie künstliche Intelligenz ihnen im Alltag Arbeit abnimmt. Sie suchen eine Person, die erklärt statt verkauft. Schwerpunkt Oelde und Münsterland, Ansprache aber überregional. [Zielgruppe aus dem Briefing abgeleitet, noch nicht mit dem Betreiber bestätigt]

## Product Purpose

Digitalkonzepte Desel ist ein Nebengewerbe von Jannik Desel (Einzelunternehmer, Oelde). Zwei getrennte Leistungen, die auf der Startseite als gleichwertige Wege angeboten werden. Besucher wählen, wohin sie möchten:

1. **Websites:** Workshops (immer 1 bis 3) zur Bedarfsklärung, Aufbau, Hosting und laufende Pflege im Monatsabo. Monatliche Gebühr ab etwa 75 bis 100 Euro, eine einfache statische Website mit Kontaktformular eher bei etwa 150 Euro, dazu einmaliger Aufwand fürs Aufsetzen. Der Preis hängt von Unternehmensgröße, Funktionen und Häufigkeit der Aktualisierungen ab, deshalb gibt es bewusst keine festen Preise.
2. **KI im Betrieb:** nicht an die Website gekoppelt. Für kleine Unternehmen, die KI bisher kaum nutzen: Potenziale erkennen, Chat-Agents für das Team aufbauen (Einführung bewährter Plattformen, zum Beispiel Langdock), Mitarbeitende einbinden und schulen, Mehrwert schaffen. Low-Level-Einstieg. KI-Funktionen für die eigene Website sind nur eine Option am Rande.

Die Website soll Vertrauen aufbauen und zum Erstgespräch führen. Erfolg: Anfragen über Formular oder Terminlink. Bis zum Livegang liegt die Website hinter einem Passwort.

## Positioning

Ein persönlicher Ansprechpartner für alles Digitale statt Agentur-Hotline: Website und KI-Einstieg bei derselben Person, mit Workshops, die den Bedarf klären, und transparenten Preisen, ohne Fachchinesisch. Die Seite selbst ist der Beweis für die Qualität der Arbeit.

## Operating Context

- Standort Oelde (Kreis Warendorf). Beratung online und vor Ort. Die Website soll regional bei Google auffindbar sein (lokale Landingpage) und zugleich überregional ansprechen.
- Hosting auf Vercel, Domain `digitalkonzepte-desel.de` (INWX, noch zu kaufen), weitere Domains leiten später darauf weiter.
- Kontaktformular über Resend mit Absender der eigenen Domain.
- Schwesterseite „Finanzkonzepte Desel“ (Versicherungsmakler, gleicher Inhaber) bildet die Markenfamilie. Die Angebote treten getrennt auf, kein Querverweis ohne Abstimmung.

## Capabilities and Constraints

- Ansprache der Besuchenden mit **Sie**, Ich-Form (ein Ansprechpartner, kein Team).
- Preise: Richtwerte, keine festen Preise (Websites) und Vorschläge (KI-Angebote, vom Betreiber zu prüfen). Hinweis „keine Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung)“. Wortlaut rechtlich prüfen lassen.
- Kein Tracking, keine einwilligungspflichtigen Cookies (nur das technisch notwendige Login-Cookie), Schriften lokal, keine Fremdinhalte. Passwortschutz über `SITE_PASSWORD`. Terminbuchung nur als Link.
- Impressum und Datenschutzerklärung nur als Entwurf, rechtliche Prüfung steht aus.
- Texte sind erster Entwurf, offene Stellen stehen als `[TODO]` im Text.
- Offen: echte Preise, Foto und Werdegang, Referenzen, Terminbuchungstool, E-Mail-Adresse und Telefon, Postfach der neuen Domain, ob der Betreiber Partner von Langdock ist.

## Brand Commitments

- Name: „Digitalkonzepte Desel“ (Schriftzug im Logo: „Digitalkonzepte“ leicht, „Desel“ fett).
- Logo: vier Flächen als „D“ (Salbei, Kupfer, Dunkelgrün, Taupe) mit Wortmarke. Wird unverändert verwendet. Quelle `tools/logo-quelle.webp`.
- Farbwelt und Schriften der Schwesterseite Finanzkonzepte Desel: Tannengrün `#1E3D34`, Graugrün `#8AA399`, Stein `#F2F0EB`, Kupfer `#B5835A`, Fraunces und Inter. Verbindlich vom Betreiber.
- Modern, ruhig, seriös. Mobile first. Barrierearm: Kontraste, Alt-Texte, Tastaturbedienung.

## Evidence on Hand

Keine Kundenstimmen, keine Referenzprojekte, kein Foto, keine echten Preise. Nichts davon erfinden. Referenzen und Foto bleiben markierte Platzhalter. Die Chat-Demo auf der KI-Seite ist eine **statische Beispiel-Unterhaltung** (interner Betriebs-Assistent) und wird als „Demo“ gekennzeichnet.

## Product Principles

1. Verstehen vor Verkaufen: erklären, was etwas bringt und was es kostet, ohne Druck.
2. Ein Ansprechpartner: eine Person, ein Konzept, ein Preis im Abo.
3. Pragmatisch statt Hype: KI nur dort, wo sie nachweislich Zeit spart.
4. Die Seite lebt vor, was sie verspricht: schnell, barrierearm, ohne Tracking.
5. Ehrlich bleiben: keine erfundenen Zahlen, Logos oder Zitate.

## Accessibility & Inclusion

Ziel WCAG 2.2 AA: Text mindestens 4,5 : 1, sichtbarer Tastaturfokus, vollständige Tastaturbedienung, Alt-Texte, `prefers-reduced-motion` respektieren, Zielgrößen mindestens 44 px, lesbare Zeilenlängen.
