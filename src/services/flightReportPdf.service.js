const PDFDocument = require('pdfkit');

const MARGIN = 50;
const TILE = 256;
const COLORS = {
  primary: '#1F4E79', text: '#222222', muted: '#666666', line: '#CCCCCC', zebra: '#F3F6FA',
  blue: '#1E6FD9', orange: '#F57C00', pink: '#D81B60',
};
const STATUS = {
  ready: { label: 'Listo para procesar', color: '#1B7F3B' },
  warnings: { label: 'Listo, con avisos', color: '#E0A100' },
  blocked: { label: 'Bloqueado: faltan requisitos', color: '#B00020' },
};
const FLIGHT_STATUS = { planned: 'Planeado', in_progress: 'En curso', completed: 'Completado', failed: 'Fallido' };
const TYPE_LABELS = { area: 'Área', distance: 'Distancia', perimeter: 'Perímetro', height: 'Altura' };
const UNIT_LABELS = { m: 'm', m2: 'm²', km: 'km' };
const MAX_PHOTO_ROWS = 60;

const fmt = (n, d = 2) =>
  n === null || n === undefined || !Number.isFinite(Number(n))
    ? '-'
    : Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDate = (d) => (d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const fmtDuration = (s) => {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

/* ---------------- Mapa (teselas de OpenStreetMap) ---------------- */

/** Coordenadas "de mundo" en píxeles (Web Mercator) para un nivel de zoom. */
function worldPx(lat, lng, z) {
  const scale = TILE * 2 ** z;
  const sin = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** Mayor zoom en el que todos los puntos caben en w x h píxeles (con margen pad). */
function chooseZoom(points, w, h, pad) {
  for (let z = 18; z >= 1; z--) {
    const px = points.map((p) => worldPx(p.lat, p.lng, z));
    const xs = px.map((p) => p.x);
    const ys = px.map((p) => p.y);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    if (bw <= w - 2 * pad && bh <= h - 2 * pad) return z;
  }
  return 1;
}

async function fetchTile(z, x, y) {
  const max = 2 ** z;
  if (y < 0 || y >= max) return null;
  const wrappedX = ((x % max) + max) % max;
  try {
    const res = await fetch(`https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`, {
      headers: { 'User-Agent': 'GeoDrone/1.0 (reportes PDF)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null; // sin internet o servidor de mapas no disponible
  }
}

/** Calcula zoom y descarga las teselas necesarias (máximo unas 9). */
async function prepareMap(points, w, h) {
  if (!points.length) return null;
  const z = chooseZoom(points, w, h, 30);
  const px = points.map((p) => worldPx(p.lat, p.lng, z));
  const xs = px.map((p) => p.x);
  const ys = px.map((p) => p.y);
  const left = (Math.min(...xs) + Math.max(...xs)) / 2 - w / 2;
  const top = (Math.min(...ys) + Math.max(...ys)) / 2 - h / 2;

  const jobs = [];
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + w) / TILE); tx++) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + h) / TILE); ty++) {
      jobs.push(fetchTile(z, tx, ty).then((img) => ({ img, tx, ty })));
    }
  }
  const tiles = (await Promise.all(jobs)).filter((t) => t.img);
  return { z, left, top, tiles, totalTiles: jobs.length };
}

function drawMap(doc, box, map, data) {
  const { x, y, w, h } = box;

  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.rect(x, y, w, h).fill('#E8EDF2');

  if (map) {
    map.tiles.forEach((t) => {
      doc.image(t.img, x + t.tx * TILE - map.left, y + t.ty * TILE - map.top, { width: TILE, height: TILE });
    });
    const toXY = (p) => {
      const q = worldPx(p.lat, p.lng, map.z);
      return [x + q.x - map.left, y + q.y - map.top];
    };

    // Área cubierta (polígono convexo)
    const hull = data.stats.hull || [];
    if (hull.length >= 3) {
      const pts = hull.map(toXY);
      doc.fillOpacity(0.15).polygon(...pts).fill(COLORS.pink).fillOpacity(1);
      doc.polygon(...pts).dash(4, { space: 3 }).lineWidth(1.5).strokeColor(COLORS.pink).stroke().undash();
    }

    // Recorrido (fotos en orden de captura)
    if (data.photos.length > 1) {
      const ordered = [...data.photos].sort(
        (a, b) =>
          (a.captured_at ? +new Date(a.captured_at) : 0) - (b.captured_at ? +new Date(b.captured_at) : 0) ||
          String(a.name).localeCompare(String(b.name))
      );
      const [sx, sy] = toXY(ordered[0]);
      doc.moveTo(sx, sy);
      ordered.slice(1).forEach((p) => {
        const [px, py] = toXY(p);
        doc.lineTo(px, py);
      });
      doc.lineWidth(0.8).strokeOpacity(0.6).strokeColor(COLORS.blue).stroke().strokeOpacity(1);
    }

    // Fotos (azul)
    doc.lineWidth(0.6);
    data.photos.forEach((p) => {
      const [px, py] = toXY(p);
      doc.circle(px, py, 2.6).fillAndStroke(COLORS.blue, '#FFFFFF');
    });

    // GCPs (naranja) con etiqueta
    doc.lineWidth(1.5);
    data.gcps.forEach((g) => {
      const [px, py] = toXY(g);
      doc.circle(px, py, 5).fillAndStroke(COLORS.orange, '#FFFFFF');
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000').text(g.label, px + 7, py - 3, { lineBreak: false });
    });

    if (map.tiles.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.muted)
        .text('No se pudo descargar el mapa de OpenStreetMap (sin conexión). Se muestran solo los puntos.',
          x + 8, y + 8, { width: w - 16, lineBreak: false });
    }
  } else {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLORS.muted)
      .text('Sin coordenadas para mostrar el mapa.', x + 10, y + h / 2 - 5, { lineBreak: false });
  }
  doc.restore();

  // Atribución obligatoria de OpenStreetMap
  doc.fillOpacity(0.85).rect(x + w - 158, y + h - 14, 158, 14).fill('#FFFFFF').fillOpacity(1);
  doc.font('Helvetica').fontSize(7).fillColor('#333333')
    .text('© OpenStreetMap contributors', x + w - 154, y + h - 10, { lineBreak: false });
  doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(COLORS.line).stroke();
}

/* ---------------- Utilidades de maquetación ---------------- */

const bottomLimit = (doc) => doc.page.height - MARGIN - 20;

function ensureSpace(doc, needed) {
  if (doc.y + needed > bottomLimit(doc)) {
    doc.addPage();
    doc.x = MARGIN;
    doc.y = MARGIN;
  }
}

function heading(doc, text) {
  ensureSpace(doc, 50);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.primary).text(text, MARGIN);
  doc.moveDown(0.3);
}

/** Tabla genérica con encabezado repetido en cada página. cols: [{label, width, align}] */
function table(doc, cols, rows) {
  const contentWidth = doc.page.width - MARGIN * 2;
  const cs = cols.map((c) => ({ ...c, px: c.width * contentWidth }));
  const rowHeight = 18;

  const drawRow = (values, y, { header = false, zebra = false } = {}) => {
    if (header) doc.rect(MARGIN, y, contentWidth, rowHeight).fill(COLORS.primary);
    else if (zebra) doc.rect(MARGIN, y, contentWidth, rowHeight).fill(COLORS.zebra);
    let x = MARGIN;
    cs.forEach((c, i) => {
      doc.fillColor(header ? '#FFFFFF' : COLORS.text)
        .font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
        .text(String(values[i] ?? ''), x + 5, y + 5, {
          width: c.px - 10, align: c.align || 'left', lineBreak: false, ellipsis: true,
        });
      x += c.px;
    });
  };

  ensureSpace(doc, rowHeight * 2);
  let y = doc.y;
  drawRow(cs.map((c) => c.label), y, { header: true });
  y += rowHeight;
  rows.forEach((r, idx) => {
    if (y + rowHeight > bottomLimit(doc)) {
      doc.addPage();
      y = MARGIN;
      drawRow(cs.map((c) => c.label), y, { header: true });
      y += rowHeight;
    }
    drawRow(r, y, { zebra: idx % 2 === 1 });
    y += rowHeight;
  });
  doc.y = y + 6;
  doc.x = MARGIN;
}

/* ---------------- Documento ---------------- */

function drawDocument(doc, data, map) {
  const { flight, project, user, validation, stats } = data;
  const contentWidth = doc.page.width - MARGIN * 2;

  // Encabezado
  doc.fillColor(COLORS.primary).fontSize(22).font('Helvetica-Bold').text('GeoDrone', MARGIN, MARGIN);
  doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica').text('Reporte de vuelo');
  doc.moveDown(0.5);
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentWidth, doc.y).strokeColor(COLORS.primary).lineWidth(1.5).stroke();
  doc.moveDown(1);

  doc.fillColor(COLORS.text).fontSize(18).font('Helvetica-Bold').text(flight.name, MARGIN, doc.y, { width: contentWidth });
  doc.moveDown(0.5);

  // Datos generales
  const meta = [
    ['Proyecto', project?.name || String(flight.project_id)],
    ...(project?.location ? [['Ubicación', project.location]] : []),
    ['Fecha del vuelo', String(flight.date)],
    ['Altitud de vuelo', flight.altitude_m != null ? `${fmt(flight.altitude_m, 0)} m` : '-'],
    ['Solapamiento', flight.overlap_percent != null ? `${fmt(flight.overlap_percent, 0)} %` : '-'],
    ['Estado del vuelo', FLIGHT_STATUS[flight.status] || flight.status],
    ['Elaborado por', user?.name || '-'],
    ['Generado', fmtDate(data.generated_at)],
  ];
  doc.fontSize(10);
  meta.forEach(([k, v]) => {
    doc.font('Helvetica-Bold').fillColor(COLORS.text).text(`${k}: `, MARGIN, doc.y, { continued: true });
    doc.font('Helvetica').text(v);
  });
  if (flight.notes) {
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').text('Notas: ', { continued: true });
    doc.font('Helvetica').text(flight.notes, { width: contentWidth });
  }

  // Estado de validación
  heading(doc, 'Validación del vuelo');
  if (validation) {
    const st = STATUS[validation.status] || { label: validation.status, color: COLORS.muted };
    const boxY = doc.y;
    doc.rect(MARGIN, boxY, contentWidth, 26).fill(st.color);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF').text(st.label, MARGIN + 10, boxY + 8, { lineBreak: false });
    doc.y = boxY + 32;
    doc.x = MARGIN;
    doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text).text(
      `${validation.summary.images} fotos (${validation.summary.images_with_gps} con GPS) · ` +
      `${validation.summary.control_points} puntos de control`, MARGIN, doc.y);
    validation.issues.forEach((i) => {
      ensureSpace(doc, 16);
      doc.fillColor(i.level === 'error' ? '#B00020' : '#8A6100')
        .text(`${i.level === 'error' ? 'Error' : 'Aviso'}: ${i.message}`, MARGIN + 8, doc.y, { width: contentWidth - 8 });
    });
    if (validation.issues.length === 0) {
      doc.fillColor('#1B7F3B').text('Sin avisos ni errores.', MARGIN, doc.y);
    }
  }

  // Resultados calculados a partir de las fotos
  heading(doc, 'Resultados calculados a partir de las fotos');
  const rows = [
    ['Fotos subidas / con GPS', `${stats.photo_count} / ${stats.photos_with_gps}`],
    ['Área cubierta', stats.area_m2 != null ? `${fmt(stats.area_m2)} m²  (${fmt(stats.area_ha, 4)} ha)` : '-'],
    ['Perímetro del área', stats.perimeter_m != null ? `${fmt(stats.perimeter_m)} m` : '-'],
    ['Extensión este-oeste', stats.extent_ew_m != null ? `${fmt(stats.extent_ew_m)} m` : '-'],
    ['Extensión norte-sur', stats.extent_ns_m != null ? `${fmt(stats.extent_ns_m)} m` : '-'],
    ['Distancia máxima entre fotos', stats.max_distance_m != null ? `${fmt(stats.max_distance_m)} m` : '-'],
    ['Recorrido del vuelo', stats.flight_path_m != null ? `${fmt(stats.flight_path_m)} m` : '-'],
    ['Altitud mínima / máxima', stats.altitude ? `${fmt(stats.altitude.min, 1)} / ${fmt(stats.altitude.max, 1)} m` : '-'],
    ['Altitud promedio', stats.altitude ? `${fmt(stats.altitude.avg, 1)} m` : '-'],
    ['Desnivel (máx. - mín.)', stats.altitude ? `${fmt(stats.altitude.range, 1)} m` : '-'],
    ['Primera / última foto', stats.time ? `${fmtDate(stats.time.first)}  /  ${fmtDate(stats.time.last)}` : '-'],
    ['Duración de captura', stats.time ? fmtDuration(stats.time.duration_s) : '-'],
    ['Centro de la zona', stats.center ? `${stats.center.lat.toFixed(6)}, ${stats.center.lng.toFixed(6)}` : '-'],
  ];
  table(doc, [{ label: 'Concepto', width: 0.45 }, { label: 'Valor', width: 0.55 }], rows);
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.muted).text(
    'El área se calcula con el polígono convexo que envuelve las posiciones GPS de las fotos; ' +
    'es una aproximación del terreno cubierto. La altitud es la que reporta el GPS de la cámara.',
    MARGIN, doc.y, { width: contentWidth });

  // Mapa
  const MAP_H = 300;
  heading(doc, 'Mapa del terreno');
  ensureSpace(doc, MAP_H + 30);
  const box = { x: MARGIN, y: doc.y, w: contentWidth, h: MAP_H };
  drawMap(doc, box, map, data);
  doc.y = box.y + MAP_H + 8;
  doc.x = MARGIN;
  // Leyenda
  const ly = doc.y;
  doc.circle(MARGIN + 5, ly + 5, 3).fill(COLORS.blue);
  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text).text(`Fotos (${data.photos.length})`, MARGIN + 14, ly, { lineBreak: false });
  doc.circle(MARGIN + 105, ly + 5, 4).fill(COLORS.orange);
  doc.text(`Puntos de control (${data.gcps.length})`, MARGIN + 114, ly, { lineBreak: false });
  doc.rect(MARGIN + 240, ly + 1, 10, 8).lineWidth(1).dash(2, { space: 2 }).strokeColor(COLORS.pink).stroke().undash();
  doc.text('Área cubierta', MARGIN + 256, ly, { lineBreak: false });
  doc.y = ly + 16;
  doc.x = MARGIN;

  // Puntos de control
  heading(doc, `Puntos de control (${data.gcps.length})`);
  if (data.gcps.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLORS.muted).text('Este vuelo no tiene puntos de control.', MARGIN);
  } else {
    table(doc,
      [
        { label: 'Etiqueta', width: 0.16 },
        { label: 'Latitud', width: 0.2, align: 'right' },
        { label: 'Longitud', width: 0.2, align: 'right' },
        { label: 'Altitud (m)', width: 0.15, align: 'right' },
        { label: 'Notas', width: 0.29 },
      ],
      data.gcps.map((g) => [g.label, g.lat.toFixed(6), g.lng.toFixed(6), fmt(g.alt, 1), g.notes])
    );
  }

  // Mediciones guardadas del proyecto
  if (data.measurements.length > 0) {
    heading(doc, `Mediciones guardadas del proyecto (${data.measurements.length})`);
    table(doc,
      [
        { label: 'Nombre', width: 0.38 },
        { label: 'Tipo', width: 0.18 },
        { label: 'Valor', width: 0.26, align: 'right' },
        { label: 'Unidad', width: 0.18 },
      ],
      data.measurements.map((m) => [
        m.name || '(sin nombre)', TYPE_LABELS[m.type] || m.type, fmt(m.value, 3), UNIT_LABELS[m.unit] || m.unit,
      ])
    );
  }

  // Fotos
  heading(doc, `Fotos con GPS (${data.photos.length})`);
  if (data.photos.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLORS.muted).text('No hay fotos con coordenadas.', MARGIN);
  } else {
    table(doc,
      [
        { label: 'Foto', width: 0.3 },
        { label: 'Captura', width: 0.24 },
        { label: 'Latitud', width: 0.16, align: 'right' },
        { label: 'Longitud', width: 0.16, align: 'right' },
        { label: 'Alt. (m)', width: 0.14, align: 'right' },
      ],
      data.photos.slice(0, MAX_PHOTO_ROWS).map((p) => [
        p.name, p.captured_at ? fmtDate(p.captured_at) : '-', p.lat.toFixed(6), p.lng.toFixed(6), fmt(p.alt, 1),
      ])
    );
    if (data.photos.length > MAX_PHOTO_ROWS) {
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLORS.muted)
        .text(`... y ${data.photos.length - MAX_PHOTO_ROWS} fotos más (no se muestran para mantener el reporte breve).`, MARGIN, doc.y);
    }
  }

  // Pie de página en todas las páginas
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // el pie va dentro del margen: evita que pdfkit cree otra página
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(
      `GeoDrone · ${flight.name} · Página ${i - range.start + 1} de ${range.count}`,
      MARGIN, doc.page.height - MARGIN + 10, { width: contentWidth, align: 'center', lineBreak: false }
    );
    doc.page.margins.bottom = savedBottom;
  }
}

/** Genera el PDF del vuelo y devuelve un Buffer. data viene de buildFlightReportData. */
async function buildFlightPdf(data) {
  const mapW = 595.28 - MARGIN * 2; // ancho útil de una página A4
  const mapPoints = [
    ...data.photos.map((p) => ({ lat: p.lat, lng: p.lng })),
    ...data.gcps.map((g) => ({ lat: g.lat, lng: g.lng })),
  ];
  const map = await prepareMap(mapPoints, mapW, 300); // descarga las teselas antes de dibujar

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      drawDocument(doc, data, map);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildFlightPdf, worldPx, chooseZoom };