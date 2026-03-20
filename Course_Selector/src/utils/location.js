// Utility for geolocation and distance sorting
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
};

// Haversine formula (km)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const sortUniversitiesByDistance = (universitiesList, userCoords) => {
  if (!userCoords) return universitiesList;
  const lat = userCoords.latitude || userCoords.lat;
  const lon = userCoords.longitude || userCoords.lng || userCoords.lon;
  return universitiesList
    .map((u) => {
      const distance = u.lat && u.lon ? getDistanceKm(lat, lon, u.lat, u.lon) : null;
      return { ...u, distance };
    })
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
};

// Minimal proxy call to server geocode endpoint
export const geocodeViaProxy = async (query) => {
  if (!query) return null;

  const baseUrl = import.meta.env.VITE_GEO_PROXY_URL || 'http://localhost:5174';
  const endpoint = `${baseUrl}/api/geocode?q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.error('Geocode proxy responded with', resp.status);
      return null;
    }
    const data = await resp.json();
    // LocationIQ returns an array of matches
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), raw: data[0] };
    }
    return null;
  } catch (err) {
    console.error('Geocode proxy error', err);
    return null;
  }
};

export const getRoadDistanceViaProxy = async ({ fromLat, fromLon, toLat, toLon }) => {
  if ([fromLat, fromLon, toLat, toLon].some((v) => v == null)) return null;

  const baseUrl = import.meta.env.VITE_GEO_PROXY_URL || 'http://localhost:5174';
  const params = new URLSearchParams({
    fromLat: String(fromLat),
    fromLon: String(fromLon),
    toLat: String(toLat),
    toLon: String(toLon),
  });
  const endpoint = `${baseUrl}/api/route-distance?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.error('Route-distance proxy responded with', resp.status);
      return null;
    }

    const data = await resp.json();
    if (typeof data?.distanceKm !== 'number') return null;

    return {
      distanceKm: data.distanceKm,
      durationMin: typeof data?.durationMin === 'number' ? data.durationMin : null,
      raw: data?.raw,
    };
  } catch (err) {
    console.error('Route-distance proxy error', err);
    return null;
  }
};
