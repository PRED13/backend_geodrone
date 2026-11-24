const { Flight, Project, User, Image, Coordinate, ControlPoint, Measurement } = require('../models');
const geo = require('../utils/geo');
const { validateFlight } = require('./validation.service');

const num = (v) => (v === null || v === undefined ? null : Number(v));

/**
 * Calcula resultados a partir de las posiciones GPS de las fotos.
 * photos: [{ name, lat, lng, alt, captured_at }]
 */
function computePhotoStats(photos, totalImages) {
  const stats = {
    photo_count: totalImages,
    photos_with_gps: photos.length,
    area_m2: null,
    area_ha: null,
    perimeter_m: null,
    extent_ew_m: null,
    extent_ns_m: null,
    max_distance_m: null,
    flight_path_m: null,
    altitude: null,
    time: null,
    center: null,
  };
  if (photos.length === 0) return stats;

  stats.center = geo.centroid(photos);

  // Área, perímetro y distancia máxima: sobre el polígono convexo que envuelve las fotos
  const hull = geo.convexHull(photos);
  if (hull.length >= 3) {
    stats.area_m2 = geo.polygonArea(hull);
    stats.area_ha = stats.area_m2 / 10000;
    stats.perimeter_m = geo.pathLength(hull, true);
  }
  if (hull.length >= 2) {
    let max = 0;
    for (let i = 0; i < hull.length; i++) {
      for (let j = i + 1; j < hull.length; j++) {
        max = Math.max(max, geo.haversine(hull[i], hull[j]));
      }
    }
    stats.max_distance_m = max;
  }

  // Extensión este-oeste y norte-sur
  const bb = geo.boundingBox(photos);
  const midLat = (bb.minLat + bb.maxLat) / 2;
  const midLng = (bb.minLng + bb.maxLng) / 2;
  stats.extent_ew_m = geo.haversine({ lat: midLat, lng: bb.minLng }, { lat: midLat, lng: bb.maxLng });
  stats.extent_ns_m = geo.haversine({ lat: bb.minLat, lng: midLng }, { lat: bb.maxLat, lng: midLng });

  // Recorrido: fotos en orden de captura (o por nombre si no hay fecha)
  const ordered = [...photos].sort(
    (a, b) =>
      (a.captured_at ? +new Date(a.captured_at) : 0) - (b.captured_at ? +new Date(b.captured_at) : 0) ||
      String(a.name).localeCompare(String(b.name))
  );
  stats.flight_path_m = geo.pathLength(ordered, false);

  // Altitud
  const alts = photos.map((p) => p.alt).filter((a) => a !== null && Number.isFinite(a));
  if (alts.length) {
    const min = Math.min(...alts);
    const max = Math.max(...alts);
    stats.altitude = {
      min, max,
      avg: alts.reduce((s, a) => s + a, 0) / alts.length,
      range: max - min,
    };
  }

  // Tiempo
  const times = photos
    .map((p) => (p.captured_at ? +new Date(p.captured_at) : null))
    .filter((t) => t !== null && Number.isFinite(t));
  if (times.length) {
    const first = Math.min(...times);
    const last = Math.max(...times);
    stats.time = { first: new Date(first), last: new Date(last), duration_s: (last - first) / 1000 };
  }

  stats.hull = hull;
  return stats;
}

/**
 * Reúne todo lo necesario para el reporte de un vuelo.
 * Devuelve null si el vuelo no existe.
 */
async function buildFlightReportData(flightId, userId) {
  const flight = await Flight.findByPk(flightId);
  if (!flight) return null;

  const [project, user, images, gcps, validation, measurements] = await Promise.all([
    Project.findByPk(flight.project_id),
    User.findByPk(userId),
    Image.findAll({ where: { flight_id: flightId }, order: [['created_at', 'ASC']] }),
    ControlPoint.findAll({ where: { flight_id: flightId }, order: [['label', 'ASC']] }),
    validateFlight(flightId),
    Measurement.findAll({ where: { project_id: flight.project_id }, order: [['created_at', 'ASC']] }),
  ]);

  const coords = images.length
    ? await Coordinate.findAll({ where: { image_id: images.map((i) => i.id) } })
    : [];
  const coordByImage = new Map(coords.map((c) => [c.image_id, c]));

  const photos = images
    .map((img) => {
      const c = coordByImage.get(img.id);
      if (!c || !geo.isValidLat(c.latitude) || !geo.isValidLng(c.longitude)) return null;
      return {
        id: img.id,
        name: img.original_name || img.filename,
        lat: Number(c.latitude),
        lng: Number(c.longitude),
        alt: num(c.altitude_m),
        captured_at: img.captured_at || null,
      };
    })
    .filter(Boolean);

  const gcpList = gcps.map((g) => ({
    label: g.label,
    lat: Number(g.latitude),
    lng: Number(g.longitude),
    alt: num(g.altitude_m),
    notes: g.notes || '',
  }));

  return {
    generated_at: new Date(),
    flight: flight.toJSON(),
    project: project ? project.toJSON() : null,
    user: user ? { name: user.name, email: user.email } : null,
    validation,
    stats: computePhotoStats(photos, images.length),
    photos,
    gcps: gcpList,
    measurements: measurements.map((m) => m.toJSON()),
  };
}

module.exports = { buildFlightReportData, computePhotoStats };