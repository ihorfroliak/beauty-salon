import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import handler from '../api/callback.js';

let sent;
let telegramOk;

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '1';
  sent = [];
  telegramOk = true;
  globalThis.fetch = async (_url, init) => {
    sent.push(JSON.parse(init.body));
    return { json: async () => ({ ok: telegramOk }) };
  };
});

async function post(body, method = 'POST') {
  const result = {};
  const res = {
    setHeader() {},
    status(code) { result.status = code; return this; },
    json(data) { result.data = data; return this; },
  };
  await handler({ method, body }, res);
  return result;
}

for (const [input, expected] of [
  ['0993653335', '+380993653335'],
  ['+38 (099) 365-33-35', '+380993653335'],
  ['993653335', '+380993653335'],
  ['80993653335', '+380993653335'],
  ['00380993653335', '+380993653335'],
  ['+48123456789', '+48123456789'],
]) {
  test(`normalizes phone ${input}`, async () => {
    const { status } = await post({ name: 'Олена', phone: input });
    assert.equal(status, 200);
    assert.match(sent[0].text, new RegExp(`Телефон: \\${expected}`));
  });
}

for (const input of ['', '12345', '9993653335']) {
  test(`rejects phone "${input}"`, async () => {
    const { status } = await post({ name: 'Олена', phone: input });
    assert.equal(status, 400);
    assert.equal(sent.length, 0);
  });
}

test('rejects an empty name', async () => {
  const { status } = await post({ name: ' ', phone: '0993653335' });
  assert.equal(status, 400);
});

test('sends the service and keeps special characters as plain text', async () => {
  await post({ name: 'Оле_на *[x]', phone: '0993653335', service: 'Манікюр' });
  assert.match(sent[0].text, /Послуга: Манікюр/);
  assert.ok(sent[0].text.includes('Оле_на *[x]'));
  assert.equal(sent[0].parse_mode, undefined);
});

test('marks a missing service', async () => {
  await post({ name: 'Олена', phone: '0993653335' });
  assert.match(sent[0].text, /Послуга: не вказано/);
});

test('silently ignores honeypot submissions', async () => {
  const { status, data } = await post({ name: 'Бот', phone: '0993653335', website: 'spam' });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(sent.length, 0);
});

test('accepts a JSON string body', async () => {
  const { status } = await post(JSON.stringify({ name: 'Олена', phone: '0993653335' }));
  assert.equal(status, 200);
});

test('rejects other HTTP methods', async () => {
  const { status } = await post({}, 'GET');
  assert.equal(status, 405);
});

test('reports a missing configuration', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  const { status } = await post({ name: 'Олена', phone: '0993653335' });
  assert.equal(status, 500);
});

test('reports a Telegram failure so the visitor sees the phone number', async () => {
  telegramOk = false;
  const { status, data } = await post({ name: 'Олена', phone: '0993653335' });
  assert.equal(status, 502);
  assert.equal(data.ok, false);
});
