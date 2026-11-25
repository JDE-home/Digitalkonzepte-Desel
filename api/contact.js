// Nimmt das Kontaktformular entgegen und schickt es per E-Mail (Resend) an das Postfach.
// Resend wird nur zum Senden genutzt.
//
// Umgebungsvariablen (Vercel -> Settings -> Environment Variables, lokal in .env.local):
//   RESEND_API_KEY   API-Key von resend.com (Pflicht). Nie ins Repo oder in den Client-Code schreiben.
//   CONTACT_TO       Empfänger (Pflicht). Steht bewusst nicht im Code, weil das Repository öffentlich sein kann.
//   CONTACT_FROM     Absender (optional). Standard: "Digitalkonzepte Desel <kontakt@digitalkonzepte-desel.de>".
//                    Die Domain muss in Resend verifiziert sein.
//   CONTACT_CONFIRM  "1" schickt dem Absender zusätzlich eine kurze Eingangsbestätigung (optional, Standard: aus).
//
// Erwartete Felder: name, mail, tel, firma, topic, pakete, msg, consent.
// Zusätzlich: elapsed (ms seit Laden der Seite), website (Honeypot, muss leer sein).

import { Resend } from 'resend';
import { z } from 'zod';

const DEFAULT_FROM = 'Digitalkonzepte Desel <kontakt@digitalkonzepte-desel.de>';

// Spamschutz zusätzlich zum Honeypot:
// 1) Zeitfalle: schneller als MIN_FILL_MS (oder ohne Angabe) ist kein Mensch, stillschweigend verwerfen.
// 2) Limit pro IP im Funktionsspeicher (best effort, je Funktionsinstanz). Für ein hartes Limit
//    zusätzlich eine Rate-Limit-Regel in der Vercel Firewall anlegen (siehe README).
const MIN_FILL_MS = 3000;
const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

export function _resetRateLimit() { hits.clear(); } // nur für Tests

function clientIp(request) {
  const h = request.headers;
  const raw = h.get('x-forwarded-for') || h.get('x-real-ip') || '';
  return raw.split(',')[0].trim().slice(0, 64) || 'unknown';
}

function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k);
    if (hits.size > 5000) hits.clear();
  }
  return false;
}

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- Validierung (zod) ----------
// Einzeilig und begrenzt (verhindert Header-Injection über Betreff/Reply-To und überlange Eingaben)
const oneLine = (max) => z.preprocess((v) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max), z.string());
const multiLine = (max) => z.preprocess((v) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max), z.string());
const required = (max, message) => oneLine(max).pipe(z.string().min(1, message));
const email = (message) => oneLine(200).pipe(z.string().regex(/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/, message));
const tick = (message) => z.preprocess((v) => v === true || v === 'on' || v === 'true' || v === '1', z.literal(true, { error: message }));

export const TOPICS = ['Website', 'KI-Beratung', 'Website und KI', 'Noch unsicher'];

const SCHEMA = z.object({
  name: required(120, 'Bitte geben Sie Ihren Namen an.'),
  mail: email('Bitte geben Sie eine gültige E-Mail-Adresse an.'),
  tel: oneLine(60),
  firma: oneLine(120),
  topic: oneLine(80),
  pakete: oneLine(300),
  msg: multiLine(5000),
  consent: tick('Bitte stimmen Sie der Datenschutzerklärung zu.'),
});

// Liefert { subject, replyTo, rows, confirmTo, confirmName } oder { error: 'invalid', field, message }
function build(input) {
  const parsed = SCHEMA.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: 'invalid', field: String(issue.path[0] ?? ''), message: issue.message };
  }
  const d = parsed.data;
  const topic = TOPICS.includes(d.topic) ? d.topic : d.topic || '–';
  return {
    subject: `Neue Anfrage über die Website: ${topic} – ${d.name}`,
    replyTo: d.mail,
    confirmTo: d.mail,
    confirmName: d.name,
    rows: [
      ['Name', d.name],
      ['E-Mail', d.mail],
      ['Unternehmen', d.firma || '–'],
      ['Telefon', d.tel || '–'],
      ['Thema', topic],
      ['Paketauswahl', d.pakete || '–'],
      ['Nachricht', d.msg || '–'],
    ],
  };
}

function render(rows) {
  const text = rows.map(([k, v]) => (v.includes('\n') ? `${k}:\n${v}` : `${k}: ${v}`)).join('\n\n');
  const html =
    '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
    rows.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;vertical-align:top;color:#555"><b>${esc(k)}</b></td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join('') +
    '</table>';
  return { text, html };
}

function confirmation(mail) {
  const hello = `Guten Tag ${mail.confirmName},`;
  const body = 'vielen Dank für Ihre Nachricht. Sie ist bei mir angekommen, ich melde mich so schnell wie möglich bei Ihnen.';
  const bye = 'Freundliche Grüße\nJannik Desel\nDigitalkonzepte Desel';
  const note = 'Dies ist eine automatische Bestätigung. Falls Sie keine Nachricht gesendet haben, können Sie diese E-Mail ignorieren.';
  return {
    subject: 'Ihre Nachricht an Digitalkonzepte Desel',
    text: `${hello}\n\n${body}\n\n${bye}\n\n${note}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><p>${esc(hello)}</p><p>${esc(body)}</p><p>${esc(bye).replace(/\n/g, '<br>')}</p><p style="color:#777;font-size:12px">${esc(note)}</p></div>`,
  };
}

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || DEFAULT_FROM;
  if (!apiKey || !to) return json({ error: 'not_configured' }, 503);

  let input;
  try {
    input = await request.json();
    if (!input || typeof input !== 'object') throw new Error('shape');
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  // Honeypot: Bots füllen das versteckte Feld aus. Wir tun so, als wäre alles gut gegangen.
  if (String(input.website ?? '').trim()) return json({ ok: true });

  // Zeitfalle: zu schnell oder ohne Zeitangabe = Bot. Ebenfalls stillschweigend verwerfen.
  const elapsed = Number(input.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return json({ ok: true });

  if (rateLimited(clientIp(request))) {
    return Response.json({ error: 'rate_limited' }, { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(RATE_WINDOW_MS / 1000) } });
  }

  const mail = build(input);
  if (mail.error) return json({ error: mail.error, field: mail.field, message: mail.message }, 400);

  const resend = new Resend(apiKey);
  const { text, html } = render(mail.rows);

  let result;
  try {
    result = await resend.emails.send({ from, to: [to], replyTo: mail.replyTo, subject: mail.subject, text, html });
  } catch {
    return json({ error: 'send_failed' }, 502);
  }
  if (result.error) {
    // Ursache nur ins Server-Log (kein API-Key, keine Nutzerdaten). Bei "domain is not verified"
    // im Resend-Dashboard unter Domains den Status der DNS-Prüfung ansehen.
    console.error('contact: Resend-Fehler', result.error.statusCode, result.error.name, String(result.error.message).slice(0, 200));
    return json({ error: 'send_failed' }, 502);
  }

  // Optionale Eingangsbestätigung. Ein Fehler hier darf die Anfrage nicht scheitern lassen.
  if (process.env.CONTACT_CONFIRM === '1') {
    const c = confirmation(mail);
    try {
      const r = await resend.emails.send({ from, to: [mail.confirmTo], replyTo: to, subject: c.subject, text: c.text, html: c.html });
      if (r.error) console.error('contact: Bestätigung nicht gesendet', r.error.statusCode, r.error.name);
    } catch {
      console.error('contact: Bestätigung nicht gesendet');
    }
  }
  return json({ ok: true });
}
