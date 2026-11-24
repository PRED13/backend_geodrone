const { Report, Measurement, Project, User } = require('../models');
const { generateReportPdf } = require('../services/report.service');

async function list(req, res) {
  try {
    const { project_id } = req.query;
    const where = { user_id: req.user.id };
    if (project_id) where.project_id = project_id;
    const reports = await Report.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar reportes' });
  }
}

async function create(req, res) {
  try {
    const { title, description, project_id, measurement_ids } = req.body;

    // Agrupa las mediciones seleccionadas (solo las del mismo proyecto) en el resumen
    let summary = null;
    if (measurement_ids && measurement_ids.length > 0) {
      const measurements = await Measurement.findAll({
        where: { id: measurement_ids, project_id },
        attributes: ['id', 'type', 'value', 'unit', 'name'],
      });
      summary = measurements.map((m) => m.toJSON());
    }

    const report = await Report.create({
      title, description, project_id, user_id: req.user.id, summary,
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear reporte' });
  }
}

async function getById(req, res) {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
}

/** Genera y descarga el PDF del reporte. */
async function pdf(req, res) {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    if (report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este reporte' });
    }

    // Lee las mediciones actuales a partir de los ids guardados en el resumen
    const ids = (report.summary || []).map((s) => s.id);
    const measurements = ids.length
      ? await Measurement.findAll({
          where: { id: ids, project_id: report.project_id },
          order: [['created_at', 'ASC']],
        })
      : [];

    const [project, user] = await Promise.all([
      Project.findByPk(report.project_id),
      User.findByPk(report.user_id),
    ]);

    const { buffer, filePath } = await generateReportPdf({
      report, project, user, measurements: measurements.map((m) => m.toJSON()),
    });

    await report.update({ file_path: filePath });

    const safeName = report.title.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'reporte';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
}

async function remove(req, res) {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    await report.destroy();
    res.json({ message: 'Reporte eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar reporte' });
  }
}

module.exports = { list, create, getById, pdf, remove };