/**
 * Utilidades geodésicas sin dependencias externas.
 * Entradas: puntos {lat, lng, alt} en grados decimales y metros.
 */
const EARTH_RADIUS_M = 6371008.8; // radio medio terrestre (IUGG)
const toRad = (deg) => (deg * Math.PI) / 180;

function isValidLat(lat) {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng) {
  return typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

/** Distancia horizontal entre dos puntos (Haversine), en metros. */
function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Longitud de una polilínea; si closed=true suma el segmento final al inicio. */
function pathLength(points, closed = false) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
  if (closed && points.length > 2) total += haversine(points[points.length - 1], points[0]);
  return total;
}

/**
 * Proyecta los puntos a un plano local en metros (x = este, y = norte)
 * centrado en el centroide. Precisa para parcelas de hasta varios km.
 */
function projectLocal(points) {
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng0 = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const cosLat0 = Math.cos(toRad(lat0));
  return points.map((p) => ({
    x: toRad(p.lng - lng0) * cosLat0 * EARTH_RADIUS_M,
    y: toRad(p.lat - lat0) * EARTH_RADIUS_M,
  }));
}

/** Área de un polígono (fórmula del topógrafo / shoelace) en m². */
function polygonArea(points) {
  const xy = projectLocal(points);
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    sum += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(sum) / 2;
}

/** Caja envolvente {minLat, maxLat, minLng, maxLng} o null si no hay puntos. */
function boundingBox(points) {
  if (!points.length) return null;
  return points.reduce(
    (b, p) => ({
      minLat: Math.min(b.minLat, p.lat),
      maxLat: Math.max(b.maxLat, p.lat),
      minLng: Math.min(b.minLng, p.lng),
      maxLng: Math.max(b.maxLng, p.lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );
}

/** Área aproximada de una caja envolvente, en m². */
function boxArea(b) {
  if (!b) return 0;
  const corners = [
    { lat: b.minLat, lng: b.minLng },
    { lat: b.minLat, lng: b.maxLng },
    { lat: b.maxLat, lng: b.maxLng },
    { lat: b.maxLat, lng: b.minLng },
  ];
  return polygonArea(corners);
}


/**
 * Polígono convexo que envuelve los puntos (algoritmo de Andrew).
 * Devuelve los vértices en orden; si hay menos de 3 puntos distintos, los devuelve tal cual.
 */
function convexHull(points) {
  const sorted = points
    .map((p) => ({ lat: p.lat, lng: p.lng }))
    .sort((a, b) => a.lng - b.lng || a.lat - b.lat);
  const uniq = sorted.filter(
    (p, i) => i === 0 || p.lng !== sorted[i - 1].lng || p.lat !== sorted[i - 1].lat
  );
  if (uniq.length < 3) return uniq;

  const cross = (o, a, b) =>
    (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Promedio simple de las coordenadas. */
function centroid(points) {
  if (!points.length) return null;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

module.exports = {
  isValidLat, isValidLng, haversine, pathLength, polygonArea, boundingBox, boxArea,
  convexHull, centroid,
};