const { Flight, Image, Coordinate, ControlPoint } = require('../models');
const geo = require('../utils/geo');

const RULES = {
  MIN_IMAGES_WITH_GPS: 3,
  RECOMMENDED_GCPS: 5,
  MIN_GCPS: 3,
  MIN_OVERLAP_PERCENT: 60,
  MIN_GCP_COVERAGE: 0.25, // la caja de GCPs debe cubrir ≥25% de la caja de imágenes
};

/**
 * Evalúa un vuelo y devuelve { flight_id, status, summary, issues }.
 * status: 'blocked' (hay errores) | 'warnings' | 'ready'.
 * No modifica el estado del vuelo.
 */
async function validateFlight(flightId) {
  const flight = await Flight.findByPk(flightId);
  if (!flight) return null;

  const [images, gcps] = await Promise.all([
    Image.findAll({ where: { flight_id: flightId }, attributes: ['id', 'filename'] }),
    ControlPoint.findAll({ where: { flight_id: flightId } }),
  ]);
  const imageIds = images.map((i) => i.id);
  const coords = imageIds.length
    ? await Coordinate.findAll({ where: { image_id: imageIds } })
    : [];

  const issues = [];
  const add = (level, code, message) => issues.push({ level, code, message });

  // --- Imágenes ---
  if (images.length === 0) {
    add('error', 'NO_IMAGES', 'El vuelo no tiene imágenes.');
  }
  const withCoord = new Set(coords.map((c) => c.image_id));
  const withoutGps = images.filter((i) => !withCoord.has(i.id));
  if (images.length > 0 && withoutGps.length > 0) {
    add('warning', 'IMAGES_WITHOUT_GPS',
      `${withoutGps.length} de ${images.length} imágenes no tienen GPS en el EXIF.`);
  }
  if (images.length > 0 && coords.length < RULES.MIN_IMAGES_WITH_GPS) {
    add('error', 'FEW_IMAGES_WITH_GPS',
      `Se requieren al menos ${RULES.MIN_IMAGES_WITH_GPS} imágenes con GPS (hay ${coords.length}).`);
  }
  const badCoords = coords.filter(
    (c) => !geo.isValidLat(c.latitude) || !geo.isValidLng(c.longitude)
  );
  if (badCoords.length) {
    add('error', 'INVALID_IMAGE_COORDS', `${badCoords.length} coordenadas de imagen fuera de rango.`);
  }
  const noAlt = coords.filter((c) => c.altitude_m === null || c.altitude_m === undefined);
  if (coords.length && noAlt.length) {
    add('warning', 'IMAGES_WITHOUT_ALTITUDE', `${noAlt.length} coordenadas sin altitud.`);
  }

  // --- Datos del vuelo ---
  if (!flight.altitude_m) add('warning', 'NO_FLIGHT_ALTITUDE', 'No se registró la altitud de vuelo.');
  if (flight.overlap_percent == null) {
    add('warning', 'NO_OVERLAP', 'No se registró el solapamiento.');
  } else if (flight.overlap_percent < RULES.MIN_OVERLAP_PERCENT) {
    add('warning', 'LOW_OVERLAP',
      `Solapamiento de ${flight.overlap_percent}% (se recomienda ≥ ${RULES.MIN_OVERLAP_PERCENT}%).`);
  }

  // --- Puntos de control (GCP) ---
  const badGcps = gcps.filter((g) => !geo.isValidLat(g.latitude) || !geo.isValidLng(g.longitude));
  if (badGcps.length) {
    add('error', 'INVALID_GCP_COORDS', `${badGcps.length} GCPs con coordenadas fuera de rango.`);
  }
  if (gcps.length < RULES.MIN_GCPS) {
    add('error', 'FEW_GCPS', `Se requieren al menos ${RULES.MIN_GCPS} GCPs (hay ${gcps.length}).`);
  } else if (gcps.length < RULES.RECOMMENDED_GCPS) {
    add('warning', 'GCPS_BELOW_RECOMMENDED',
      `Hay ${gcps.length} GCPs; se recomiendan ${RULES.RECOMMENDED_GCPS} o más.`);
  }
  const labels = gcps.map((g) => g.label);
  if (new Set(labels).size !== labels.length) {
    add('warning', 'DUPLICATE_GCP_LABELS', 'Hay GCPs con la misma etiqueta.');
  }

  // Distribución: la caja de los GCPs debe cubrir una parte razonable del área de imágenes
  const validGcps = gcps.filter((g) => !badGcps.includes(g));
  const imgPts = coords
    .filter((c) => !badCoords.includes(c))
    .map((c) => ({ lat: c.latitude, lng: c.longitude }));
  if (validGcps.length >= RULES.MIN_GCPS && imgPts.length >= RULES.MIN_IMAGES_WITH_GPS) {
    const imgArea = geo.boxArea(geo.boundingBox(imgPts));
    const gcpArea = geo.boxArea(
      geo.boundingBox(validGcps.map((g) => ({ lat: g.latitude, lng: g.longitude })))
    );
    if (imgArea > 0 && gcpArea / imgArea < RULES.MIN_GCP_COVERAGE) {
      add('warning', 'POOR_GCP_DISTRIBUTION',
        'Los GCPs están concentrados; distribúyelos cubriendo toda el área del vuelo.');
    }
  }

  const errors = issues.filter((i) => i.level === 'error').length;
  const warnings = issues.filter((i) => i.level === 'warning').length;
  return {
    flight_id: flightId,
    status: errors ? 'blocked' : warnings ? 'warnings' : 'ready',
    summary: {
      images: images.length,
      images_with_gps: coords.length,
      control_points: gcps.length,
      errors,
      warnings,
    },
    issues,
  };
}

module.exports = { validateFlight, RULES };