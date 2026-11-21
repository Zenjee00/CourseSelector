export function readCoordinates(query) {
  const bounds = { fromLat: 90, fromLon: 180, toLat: 90, toLon: 180 };
  const coordinates = {};
  for (const [key, bound] of Object.entries(bounds)) {
    const value = query[key];
    if (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value)) return null;
    const number = Number(value);
    if (!Number.isFinite(number) || Math.abs(number) > bound) return null;
    coordinates[key] = number;
  }
  return coordinates;
}

export function readSearch(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length >= 2 && text.length <= 200 && ![...text].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ? text : null;
}
