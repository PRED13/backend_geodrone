const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const TYPE_LABELS = {
  area: 'Área',
  distance: 'Distancia',
  perimeter: 'Perímetro',
  height: 'Altura',
};
const UNIT_LABELS = { m: 'm', m2: 'm²', km: 'km' };

const MARGIN = 50;
const COLORS = { primary: '#1F4E79', text: '#222222', muted: '#666666', line: '#CCCCCC', zebra: '#F3F6FA' };

const fmtNumber = (n) =>
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const fmtDate = (d) =>
  new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/** Carpeta donde se guardan los PDFs (relativa al directorio de ejecución). */
function reportsDir() {
  return path.join(process.env.UPLOAD_PATH || 'uploads', 'reports');
}

/**
 * Dibuja el PDF y devuelve un Buffer.
 * data = { report, project, user, measurements }
 */
function buildPdfBuffer({ report, project, user, measurements }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = doc.page.width - MARGIN * 2;

    // ---- Encabezado ----
    doc.fillColor(COLORS.primary).fontSize(22).font('Helvetica-Bold').text('GeoDrone', MARGIN, MARGIN);
    doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica').text('Reporte de mediciones');
    doc.moveDown(0.5);
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentWidth, doc.y).strokeColor(COLORS.primary).lineWidth(1.5).stroke();
    doc.moveDown(1);

    // ---- Título y datos generales ----
    doc.fillColor(COLORS.text).fontSize(18).font('Helvetica-Bold').text(report.title, { width: contentWidth });
    doc.moveDown(0.5);

    const meta = [
      ['Proyecto', project?.name || String(report.project_id)],
      ...(project?.location ? [['Ubicación', project.location]] : []),
      ['Elaborado por', user?.name || String(report.user_id)],
      ['Fecha del reporte', fmtDate(report.created_at || report.createdAt || new Date())],
      ['Mediciones incluidas', String(measurements.length)],
    ];
    doc.fontSize(10);
    meta.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').fillColor(COLORS.text).text(`${k}: `, { continued: true });
      doc.font('Helvetica').fillColor(COLORS.text).text(v);
    });

    if (report.description) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(11).text('Descripción');
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(report.description, { width: contentWidth });
    }

    // ---- Tabla de mediciones ----
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.primary).text('Mediciones');
    doc.moveDown(0.4);

    const cols = [
      { label: 'Nombre', width: 0.34 },
      { label: 'Tipo', width: 0.16 },
      { label: 'Valor', width: 0.22, align: 'right' },
      { label: 'Unidad', width: 0.12 },
      { label: 'Puntos', width: 0.16, align: 'right' },
    ].map((c) => ({ ...c, px: c.width * contentWidth }));

    const rowHeight = 20;
    const drawRow = (values, y, { header = false, zebra = false } = {}) => {
      if (header) doc.rect(MARGIN, y, contentWidth, rowHeight).fill(COLORS.primary);
      else if (zebra) doc.rect(MARGIN, y, contentWidth, rowHeight).fill(COLORS.zebra);
      let x = MARGIN;
      cols.forEach((c, i) => {
        doc
          .fillColor(header ? '#FFFFFF' : COLORS.text)
          .font(header ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .text(String(values[i]), x + 5, y + 6, {
            width: c.px - 10,
            align: c.align || 'left',
            lineBreak: false,
            ellipsis: true,
          });
        x += c.px;
      });
    };

    if (measurements.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLORS.muted)
        .text('Este reporte no incluye mediciones.');
    } else {
      let y = doc.y;
      drawRow(cols.map((c) => c.label), y, { header: true });
      y += rowHeight;
      measurements.forEach((m, idx) => {
        if (y + rowHeight > doc.page.height - MARGIN - 20) {
          doc.addPage();
          y = MARGIN;
          drawRow(cols.map((c) => c.label), y, { header: true });
          y += rowHeight;
        }
        drawRow(
          [
            m.name || '(sin nombre)',
            TYPE_LABELS[m.type] || m.type,
            fmtNumber(m.value),
            UNIT_LABELS[m.unit] || m.unit,
            Array.isArray(m.points) ? m.points.length : '-',
          ],
          y,
          { zebra: idx % 2 === 1 }
        );
        y += rowHeight;
      });
      doc.y = y + 10;
      doc.x = MARGIN;

      // ---- Totales por tipo (solo tipos con la misma unidad se suman) ----
      const totals = {};
      measurements.forEach((m) => {
        const key = `${m.type}|${m.unit}`;
        totals[key] = (totals[key] || 0) + Number(m.value);
      });
      const totalLines = Object.entries(totals).map(([key, sum]) => {
        const [type, unit] = key.split('|');
        return `${TYPE_LABELS[type] || type} (total): ${fmtNumber(sum)} ${UNIT_LABELS[unit] || unit}`;
      });
      if (doc.y + 30 + totalLines.length * 14 > doc.page.height - MARGIN) doc.addPage();
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.primary).text('Resumen', MARGIN);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
      totalLines.forEach((l) => doc.text(l, MARGIN));
    }

    // ---- Pie de página en todas las páginas ----
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // El pie va dentro del margen inferior: se pone en 0 mientras se escribe
      // para que pdfkit no cree una página nueva.
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(
        `GeoDrone · Página ${i - range.start + 1} de ${range.count}`,
        MARGIN,
        doc.page.height - MARGIN + 10,
        { width: contentWidth, align: 'center', lineBreak: false }
      );
      doc.page.margins.bottom = savedBottom;
    }

    doc.end();
  });
}

/**
 * Genera el PDF, lo guarda en disco y devuelve { buffer, filePath }.
 * filePath es relativo, ej: uploads/reports/<id>.pdf
 */
async function generateReportPdf(data) {
  const buffer = await buildPdfBuffer(data);
  const dir = reportsDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const fileName = `${data.report.id}.pdf`;
  await fs.promises.writeFile(path.join(dir, fileName), buffer);
  return { buffer, filePath: path.posix.join(dir.split(path.sep).join('/'), fileName) };
}

module.exports = { generateReportPdf, buildPdfBuffer };