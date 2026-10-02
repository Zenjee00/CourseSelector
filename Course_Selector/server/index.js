/* global process */

import 'dotenv/config';

import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const geocodeCache = new Map();
const routeCache = new Map();
const inFlightRequests = new Map();

if (!LOCATIONIQ_KEY) {
  console.warn('Warning: LOCATIONIQ_KEY is not set. Create a .env file with LOCATIONIQ_KEY=your_key');
}

if (!RECAPTCHA_SECRET_KEY) {
  console.warn('Warning: RECAPTCHA_SECRET_KEY is not set. Create a .env file with RECAPTCHA_SECRET_KEY=your_key');
}

const getCached = (cache, key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

const setCached = (cache, key, value) => {
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
};

const shareRequest = (key, request) => {
  const existing = inFlightRequests.get(key);
  if (existing) return existing;

  const pending = request().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, pending);
  return pending;
};

app.post('/api/verify-recaptcha', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  if (!RECAPTCHA_SECRET_KEY) return res.status(503).json({ error: 'reCAPTCHA is not configured on the server' });

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token }),
    });
    const result = await response.json();

    if (!response.ok || result.success !== true) {
      return res.status(403).json({ error: 'reCAPTCHA verification failed' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('reCAPTCHA verification error', err);
    return res.status(502).json({ error: 'reCAPTCHA service unavailable' });
  }
});

// Simple proxy to LocationIQ forward geocoding
app.get('/api/geocode', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query param q' });
  if (!LOCATIONIQ_KEY) return res.status(403).json({ error: 'LOCATIONIQ_KEY not configured on server' });

  const cacheKey = String(q).trim().toLowerCase();
  const cached = getCached(geocodeCache, cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await shareRequest(`geocode:${cacheKey}`, async () => {
      const url = `https://us1.locationiq.com/v1/search.php?key=${encodeURIComponent(LOCATIONIQ_KEY)}&q=${encodeURIComponent(q)}&format=json&limit=1`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Upstream error: ${r.status}`);
      return r.json();
    });
    setCached(geocodeCache, cacheKey, data);
    return res.json(data);
  } catch (err) {
    console.error('Geocode proxy error', err);
    return res.status(502).json({ error: 'Location service unavailable' });
  }
});

// Route distance proxy (driving) from current user location to a school.
app.get('/api/route-distance', async (req, res) => {
  const { fromLat, fromLon, toLat, toLon } = req.query;
  if ([fromLat, fromLon, toLat, toLon].some((value) => value == null || value === '')) {
    return res.status(400).json({ error: 'Missing query params: fromLat, fromLon, toLat, toLon' });
  }
  if (!LOCATIONIQ_KEY) {
    return res.status(403).json({ error: 'LOCATIONIQ_KEY not configured on server' });
  }

  const routeKey = [fromLat, fromLon, toLat, toLon]
    .map((value) => Number(value).toFixed(4))
    .join(',');
  const cached = getCached(routeCache, routeKey);
  if (cached) return res.json(cached);

  try {
    const response = await shareRequest(`route:${routeKey}`, async () => {
      const start = `${fromLon},${fromLat}`;
      const end = `${toLon},${toLat}`;
      const url = `https://us1.locationiq.com/v1/directions/driving/${start};${end}?key=${encodeURIComponent(LOCATIONIQ_KEY)}&overview=false&steps=false&alternatives=false`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Upstream error: ${r.status}`);

      const data = await r.json();
      const route = data?.routes?.[0];
      if (!route || typeof route.distance !== 'number') throw new Error('No route found');

      return {
        distanceKm: route.distance / 1000,
        durationMin: typeof route.duration === 'number' ? route.duration / 60 : null,
      };
    });
    setCached(routeCache, routeKey, response);
    return res.json(response);
  } catch (err) {
    console.error('Route proxy error', err);
    return res.status(502).json({ error: 'Route service unavailable' });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`LocationIQ proxy running on http://localhost:${PORT}`);
});
