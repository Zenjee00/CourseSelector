import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createCache } from './cache.js';
import { readCoordinates, readSearch } from './validation.js';

export function createApp({ env = process.env, fetchImpl = fetch, logger = console } = {}) {
  const app = express();
  const allowedOrigins = (env.ALLOWED_ORIGINS || (env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173'))
    .split(',').map(value => value.trim()).filter(Boolean);
  if (env.NODE_ENV === 'production' && !allowedOrigins.length) {
    throw new Error('ALLOWED_ORIGINS must be configured in production.');
  }
  const geocodeCache = createCache();
  const routeCache = createCache();
  const pending = new Map();
  app.disable('x-powered-by');
  // Set only the exact number of trusted hops when a known reverse proxy is present.
  if (env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(env.TRUST_PROXY_HOPS));
  app.use(helmet());
  app.use((req, res, next) => {
    const started = Date.now();
    req.requestId = randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    res.on('finish', () => logger.info(JSON.stringify({ requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started })));
    next();
  });
  app.use((req, res, next) => {
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return res.status(403).json({ error: 'Origin is not allowed.' });
    next();
  });
  app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'], maxAge: 600 }));
  app.use(express.json({ limit: '8kb', strict: true }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Try again in a minute.' } }));

  async function upstream(url, options = {}) {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('upstream_failure');
    return response.json();
  }
  async function cachedRequest(cache, key, request) {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 200) throw new Error('service_busy');
    const task = request().then(data => { cache.set(key, data); return data; }).finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  }
  function serviceError(req, res, service) {
    // Deliberately exclude URLs, request bodies, tokens, and upstream error objects.
    logger.error(JSON.stringify({ requestId: req.requestId, service, event: 'upstream_failure' }));
    return res.status(502).json({ error: `${service} is temporarily unavailable. Please try again.`, requestId: req.requestId });
  }

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', (_req, res) => {
    const ready = Boolean(env.LOCATIONIQ_KEY && env.RECAPTCHA_SECRET_KEY);
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'configuration_required' });
  });
  app.post('/api/verify-recaptcha', rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many verification attempts. Try again in a minute.' } }), async (req, res) => {
    const token = req.body?.token;
    if (typeof token !== 'string' || !token.trim() || token.length > 4096) return res.status(400).json({ error: 'A valid reCAPTCHA token is required.' });
    if (!env.RECAPTCHA_SECRET_KEY) return res.status(503).json({ error: 'Verification is not configured.' });
    try {
      const result = await upstream('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: env.RECAPTCHA_SECRET_KEY, response: token }),
      });
      const hosts = (env.RECAPTCHA_ALLOWED_HOSTNAMES || '').split(',').map(host => host.trim()).filter(Boolean);
      if (result.success !== true || (hosts.length && !hosts.includes(result.hostname))) return res.status(403).json({ error: 'Verification failed. Please try the challenge again.' });
      return res.json({ success: true });
    } catch { return serviceError(req, res, 'Verification'); }
  });
  app.get('/api/geocode', async (req, res) => {
    const search = readSearch(req.query.q);
    if (!search) return res.status(400).json({ error: 'Enter a search between 2 and 200 characters.' });
    if (!env.LOCATIONIQ_KEY) return res.status(503).json({ error: 'Location lookup is not configured.' });
    try {
      const data = await cachedRequest(geocodeCache, `geocode:${search.toLowerCase()}`, async () => {
        const url = new URL('https://us1.locationiq.com/v1/search.php');
        url.search = new URLSearchParams({ key: env.LOCATIONIQ_KEY, q: search, format: 'json', limit: '1' });
        const matches = await upstream(url);
        if (!Array.isArray(matches)) throw new Error('invalid_geocode');
        return matches.map(match => ({ lat: match.lat, lon: match.lon, display_name: match.display_name }));
      });
      return res.json(data);
    } catch { return serviceError(req, res, 'Location lookup'); }
  });
  app.get('/api/route-distance', async (req, res) => {
    const coords = readCoordinates(req.query);
    if (!coords) return res.status(400).json({ error: 'Provide valid latitude (-90 to 90) and longitude (-180 to 180) values.' });
    if (!env.LOCATIONIQ_KEY) return res.status(503).json({ error: 'Routing is not configured.' });
    try {
      const { fromLat, fromLon, toLat, toLon } = coords;
      const key = `route:${Object.values(coords).map(value => value.toFixed(4)).join(',')}`;
      const data = await cachedRequest(routeCache, key, async () => {
        const url = new URL(`https://us1.locationiq.com/v1/directions/driving/${fromLon},${fromLat};${toLon},${toLat}`);
        url.search = new URLSearchParams({ key: env.LOCATIONIQ_KEY, overview: 'false', steps: 'false', alternatives: 'false' });
        const result = await upstream(url);
        const route = result?.routes?.[0];
        if (!Number.isFinite(route?.distance) || route.distance < 0) throw new Error('invalid_route');
        return { distanceKm: route.distance / 1000, durationMin: Number.isFinite(route.duration) && route.duration >= 0 ? route.duration / 60 : null };
      });
      return res.json(data);
    } catch { return serviceError(req, res, 'Routing'); }
  });
  app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  app.use((error, req, res, _next) => {
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    if (status === 500) logger.error(JSON.stringify({ requestId: req.requestId, event: 'request_failure' }));
    res.status(status).json({ error: status === 413 ? 'Request is too large.' : status === 400 ? 'Invalid JSON body.' : 'Unable to process the request.', requestId: req.requestId });
  });
  return app;
}
