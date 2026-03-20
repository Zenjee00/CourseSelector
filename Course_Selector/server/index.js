import 'dotenv/config';

import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;

if (!LOCATIONIQ_KEY) {
  console.warn('Warning: LOCATIONIQ_KEY is not set. Create a .env file with LOCATIONIQ_KEY=your_key');
}

// Simple proxy to LocationIQ forward geocoding
app.get('/api/geocode', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query param q' });
  if (!LOCATIONIQ_KEY) return res.status(403).json({ error: 'LOCATIONIQ_KEY not configured on server' });

  const url = `https://us1.locationiq.com/v1/search.php?key=${encodeURIComponent(LOCATIONIQ_KEY)}&q=${encodeURIComponent(q)}&format=json&limit=1`;
  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'Upstream error', status: r.status });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error('Geocode proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route distance proxy (driving) from current user location to a school.
app.get('/api/route-distance', async (req, res) => {
  const { fromLat, fromLon, toLat, toLon } = req.query;
  if (!fromLat || !fromLon || !toLat || !toLon) {
    return res.status(400).json({ error: 'Missing query params: fromLat, fromLon, toLat, toLon' });
  }
  if (!LOCATIONIQ_KEY) {
    return res.status(403).json({ error: 'LOCATIONIQ_KEY not configured on server' });
  }

  const start = `${fromLon},${fromLat}`;
  const end = `${toLon},${toLat}`;
  const url = `https://us1.locationiq.com/v1/directions/driving/${start};${end}?key=${encodeURIComponent(LOCATIONIQ_KEY)}&overview=false&steps=false&alternatives=false`;

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'Upstream error', status: r.status });

    const data = await r.json();
    const route = data?.routes?.[0];
    if (!route?.distance) {
      return res.status(404).json({ error: 'No route found' });
    }

    return res.json({
      distanceKm: route.distance / 1000,
      durationMin: route.duration ? route.duration / 60 : null,
      raw: route,
    });
  } catch (err) {
    console.error('Route proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`LocationIQ proxy running on http://localhost:${PORT}`);
});
