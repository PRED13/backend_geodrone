const geo = require('../utils/geo');

class MeasurementError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MeasurementError';
    this.status = 400;
  }
}

const MIN_POINTS = { distance: 2, height: 2, perimeter: 3, area: 3 };
const round = (n, d = 3) => Number(n.toFixed(d));

/** Valida el arreglo de puntos y devuelve puntos normalizados {lat, lng, alt}. */
function normalizePoints(points, type) {
  if (!Array.isArray(points)) throw new MeasurementError('points debe ser un arreglo');
  const min = MIN_POINTS[type];
  if (points.length < min) {
    throw new MeasurementError(`La medición "${type}" requiere al menos ${min} puntos`);
  }
  return points.map((p, i) => {
    const lat = Number(p?.lat);
    const lng = Number(p?.lng);
    if (!geo.isValidLat(lat)) throw new MeasurementError(`Punto ${i + 1}: lat inválida (−90 a 90)`);
    if (!geo.isValidLng(lng)) throw new MeasurementError(`Punto ${i + 1}: lng inválida (−180 a 180)`);
    const alt = p.alt === undefined || p.alt === null ? null : Number(p.alt);
    if (alt !== null && !Number.isFinite(alt)) throw new MeasurementError(`Punto ${i + 1}: alt inválida`);
    return { lat, lng, alt };
  });
}

/**
 * Calcula una medición. Devuelve { type, value, unit, details, points }.
 */
function calculate(type, rawPoints) {
  if (!MIN_POINTS[type]) throw new MeasurementError(`Tipo de medición no soportado: ${type}`);
  const points = normalizePoints(rawPoints, type);

  switch (type) {
    case 'distance': {
      const value = geo.pathLength(points, false);
      return { type, value: round(value), unit: 'm', points, details: { km: round(value / 1000, 6) } };
    }
    case 'perimeter': {
      const value = geo.pathLength(points, true);
      return { type, value: round(value), unit: 'm', points, details: { km: round(value / 1000, 6) } };
    }
    case 'area': {
      const value = geo.polygonArea(points);
      return {
        type, value: round(value), unit: 'm2', points,
        details: { hectares: round(value / 10000, 6), km2: round(value / 1e6, 8) },
      };
    }
    case 'height': {
      const alts = points.map((p) => p.alt).filter((a) => a !== null);
      if (alts.length < 2) throw new MeasurementError('La altura requiere "alt" en al menos 2 puntos');
      const max = Math.max(...alts);
      const min = Math.min(...alts);
      return { type, value: round(max - min), unit: 'm', points, details: { min_alt: min, max_alt: max } };
    }
    default:
      throw new MeasurementError(`Tipo de medición no soportado: ${type}`);
  }
}

module.exports = { calculate, MeasurementError, MIN_POINTS };