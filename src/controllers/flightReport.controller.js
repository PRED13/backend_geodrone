const { buildFlightReportData } = require('../services/flightReport.service');
const { buildFlightPdf } = require('../services/flightReportPdf.service');

/** Genera y descarga el reporte PDF de un vuelo. */
async function flightReportPdf(req, res) {
  try {
    const data = await buildFlightReportData(req.params.id, req.user.id);
    if (!data) return res.status(404).json({ error: 'Vuelo no encontrado' });

    // Solo el dueño del proyecto (o un admin) puede descargar el reporte
    if (data.project && data.project.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes acceso a este vuelo' });
    }

    const buffer = await buildFlightPdf(data);
    const safeName = String(data.flight.name).replace(/[^\w\-]+/g, '_').slice(0, 60) || 'vuelo';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${safeName}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el reporte del vuelo' });
  }
}

module.exports = { flightReportPdf };