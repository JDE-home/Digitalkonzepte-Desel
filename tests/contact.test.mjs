import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, _resetRateLimit } from '../api/contact.js';

let ipCounter = 0;
// Jede Anfrage bekommt standardmäßig eine eigene IP, damit das Limit pro IP die Tests nicht stört.
const post = (body, ip = `203.0.113.${(ipCounter = (ipCounter % 250) + 1)}`) =>
  POST(new Request('https://example.test/api/contact', { method: 'POST', headers: { 'x-forwarded-for': ip }, body: typeof body === 'string' ? body : JSON.stringify(body) }));

const valid = { name: 'Erika Muster', mail: 'erika@example.com', tel: '', firma: 'Muster GmbH', topic: 'Websites und KI', msg: 'Hallo\nZeile 2', consent: true, website: '', elapsed: 6500 };

function setup({ status = 200 } = {}) {
  _resetRateLimit();
  const calls = [];
  process.env.RESEND_API_KEY = 're_test';
  process.env.CONTACT_TO = 'empfang@example.org';
  delete process.env.CONTACT_FROM;
  delete process.env.CONTACT_CONFIRM;
  globalThis.fetch = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return new Response(status === 200 ? '{"id":"1"}' : '{"name":"validation_error","message":"x","statusCode":422}', { status }); };
  return calls;
}

test('Anfrage wird an CONTACT_TO versendet, Antworten gehen an den Absender', async () => {
  const calls = setup();
  const r = await post(valid);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(calls.length, 1);
  const c = calls[0];
  assert.equal(c.url, 'https://api.resend.com/emails');
  assert.equal(new Headers(c.init.headers).get('authorization'), 'Bearer re_test');
  assert.deepEqual(c.body.to, ['empfang@example.org']);
  assert.equal(c.body.reply_to, 'erika@example.com');
  assert.equal(c.body.from, 'Digitalkonzepte Desel <kontakt@digitalkonzepte-desel.de>');
  assert.equal(c.body.subject, 'Neue Anfrage über die Website: Websites und KI – Erika Muster');
  assert.match(c.body.text, /Unternehmen: Muster GmbH/);
  assert.match(c.body.text, /Thema: Websites und KI/);
  assert.match(c.body.text, /Hallo\nZeile 2/);
  assert.match(c.body.html, /<table/);
});

test('ohne CONTACT_TO oder API-Key: 503, nichts wird gesendet', async () => {
  const calls = setup();
  delete process.env.CONTACT_TO;
  assert.equal((await post(valid)).status, 503);
  process.env.CONTACT_TO = 'empfang@example.org'; delete process.env.RESEND_API_KEY;
  assert.equal((await post(valid)).status, 503);
  assert.equal(calls.length, 0);
});

test('Honeypot und Zeitfalle verwerfen still (Antwort ok, kein Versand)', async () => {
  const calls = setup();
  assert.deepEqual(await (await post({ ...valid, website: 'http://spam' })).json(), { ok: true });
  assert.deepEqual(await (await post({ ...valid, elapsed: 800 })).json(), { ok: true });
  const { elapsed, ...ohne } = valid;
  assert.deepEqual(await (await post(ohne)).json(), { ok: true });
  assert.equal(calls.length, 0);
});

test('ungültige Eingaben werden abgelehnt, nichts wird gesendet', async () => {
  const calls = setup();
  for (const [patch, field] of [[{ name: '  ' }, 'name'], [{ mail: 'kein-mail' }, 'mail'], [{ mail: 'a@b.de\nBcc: x@y.de' }, 'mail'], [{ consent: false }, 'consent']]) {
    const r = await post({ ...valid, ...patch });
    assert.equal(r.status, 400, JSON.stringify(patch));
    assert.equal((await r.json()).field, field);
  }
  assert.equal((await post('{kaputt')).status, 400);
  assert.equal(calls.length, 0);
});

test('Zeilenumbrüche im Namen können keinen Betreff-Header einschleusen', async () => {
  const calls = setup();
  await post({ ...valid, name: 'Max\r\nBcc: boese@example.com' });
  assert.ok(!/[\r\n]/.test(calls[0].body.subject));
});

test('HTML in Eingaben wird in der HTML-Mail maskiert', async () => {
  const calls = setup();
  await post({ ...valid, msg: '<script>alert(1)</script>' });
  assert.ok(!calls[0].body.html.includes('<script>'));
  assert.match(calls[0].body.html, /&lt;script&gt;/);
});

test('Rate-Limit: höchstens 5 Anfragen je IP, danach 429', async () => {
  setup();
  const ip = '198.51.100.7';
  for (let i = 0; i < 5; i++) assert.equal((await post(valid, ip)).status, 200);
  const r = await post(valid, ip);
  assert.equal(r.status, 429);
  assert.ok(r.headers.get('retry-after'));
});

test('Eingangsbestätigung nur mit CONTACT_CONFIRM=1, in Sie-Form', async () => {
  let calls = setup();
  await post(valid);
  assert.equal(calls.length, 1);
  calls = setup();
  process.env.CONTACT_CONFIRM = '1';
  await post(valid);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body.to, ['erika@example.com']);
  assert.match(calls[1].body.text, /Guten Tag Erika Muster/);
  assert.match(calls[1].body.text, /Ihre Nachricht/);
  assert.ok(!/\b(Du|Dir|Dein)\b/.test(calls[1].body.text));
});

test('Fehler von Resend ergibt 502', async () => {
  setup({ status: 422 });
  const r = await post(valid);
  assert.equal(r.status, 502);
});
