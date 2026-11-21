import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { createCache } from './cache.js';

const servers = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve)))); });
async function start(options = {}) {
  const logs = [];
  const app = createApp({ env: { NODE_ENV: 'test', LOCATIONIQ_KEY: 'secret', RECAPTCHA_SECRET_KEY: 'secret' }, logger: { info: value => logs.push(value), error: value => logs.push(value) }, ...options });
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise(resolve => server.once('listening', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, logs };
}

describe('proxy boundaries', () => {
  it('rejects invalid coordinates, duplicate queries, and excessive search text before upstream access', async () => {
    let calls = 0;
    const { url } = await start({ fetchImpl: () => { calls++; throw new Error(); } });
    for (const path of ['/api/route-distance?fromLat=91&fromLon=0&toLat=0&toLon=0', '/api/route-distance?fromLat=NaN&fromLon=0&toLat=0&toLon=0', '/api/geocode?q=one&q=two', `/api/geocode?q=${'a'.repeat(201)}`]) {
      assert.equal((await fetch(url + path)).status, 400);
    }
    assert.equal(calls, 0);
  });
  it('denies unknown browser origins and accepts configured development origins', async () => {
    const { url } = await start();
    assert.equal((await fetch(url + '/healthz', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    const response = await fetch(url + '/healthz', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
    assert.equal(response.headers.get('X-Powered-By'), null);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  });
  it('caches successful geocodes and redacts provider details on failure', async () => {
    let calls = 0;
    const { url, logs } = await start({ fetchImpl: async () => { calls++; return { ok: true, json: async () => [{ lat: '0', lon: '0', display_name: 'School', internal: 'private' }] }; } });
    const first = await (await fetch(url + '/api/geocode?q=School')).json();
    await fetch(url + '/api/geocode?q=school');
    assert.deepEqual(first, [{ lat: '0', lon: '0', display_name: 'School' }]);
    assert.equal(calls, 1);
    assert.ok(logs.every(value => !value.includes('secret')));
  });
  it('returns a recoverable error without upstream URLs or secrets', async () => {
    const { url, logs } = await start({ fetchImpl: async () => { throw new Error('secret https://upstream.example/?key=secret'); } });
    const response = await fetch(url + '/api/geocode?q=School');
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.ok(body.requestId);
    assert.ok(!JSON.stringify({ body, logs }).includes('secret'));
  });
  it('rejects malformed and oversized JSON and throttles verification abuse', async () => {
    const { url } = await start();
    assert.equal((await fetch(url + '/api/verify-recaptcha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(url + '/api/verify-recaptcha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'a'.repeat(9000) }) })).status, 413);
    let response;
    for (let i = 0; i < 11; i++) response = await fetch(url + '/api/verify-recaptcha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 429);
  });
  it('validates reCAPTCHA hostnames and converts route units', async () => {
    const { url } = await start({ env: { RECAPTCHA_SECRET_KEY: 'secret', LOCATIONIQ_KEY: 'secret', RECAPTCHA_ALLOWED_HOSTNAMES: 'trusted.example' }, fetchImpl: async url => ({ ok: true, json: async () => String(url).includes('recaptcha') ? { success: true, hostname: 'other.example' } : { routes: [{ distance: 1000, duration: 120 }] } }) });
    assert.equal((await fetch(url + '/api/verify-recaptcha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"token":"valid"}' })).status, 403);
    const response = await fetch(url + '/api/route-distance?fromLat=0&fromLon=0&toLat=1&toLon=1');
    assert.deepEqual(await response.json(), { distanceKm: 1, durationMin: 2 });
  });
  it('fails production startup without allowed origins and reports missing readiness configuration', async () => {
    assert.throws(() => createApp({ env: { NODE_ENV: 'production' } }), /ALLOWED_ORIGINS/);
    const { url } = await start({ env: {} });
    assert.equal((await fetch(url + '/healthz')).status, 200);
    assert.equal((await fetch(url + '/readyz')).status, 503);
  });
});

it('expires cached entries and evicts the least recently used item', () => {
  let time = 0;
  const cache = createCache({ maxEntries: 2, ttlMs: 10, now: () => time });
  cache.set('a', 1); cache.set('b', 2); cache.get('a'); cache.set('c', 3);
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  time = 11;
  assert.equal(cache.get('a'), undefined);
});
