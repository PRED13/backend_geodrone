const { Measurement } = require('../models');
const { calculate, MeasurementError } = require('../services/measurement.service');

function handleError(res, err, fallback) {
  if (err instanceof MeasurementError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: fallback });
}

async function list(req, res) {
  try {
    const { project_id } = req.query;
    const where = {};
    if (project_id) where.project_id = project_id;
    const measurements = await Measurement.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(measurements);
  } catch (err) {
    handleError(res, err, 'Error al listar mediciones');
  }
}

/** Calcula sin guardar (vista previa en el mapa). */
async function preview(req, res) {
  try {
    const { type, points } = req.body;
    const { value, unit, details } = calculate(type, points);
    res.json({ type, value, unit, details });
  } catch (err) {
    handleError(res, err, 'Error al calcular medición');
  }
}

/** El servidor calcula el valor; cualquier "value" enviado por el cliente se ignora. */
async function create(req, res) {
  try {
    const { type, points, name, project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id es obligatorio' });
    const result = calculate(type, points);
    const measurement = await Measurement.create({
      type: result.type,
      value: result.value,
      unit: result.unit,
      points: result.points,
      name,
      project_id,
      user_id: req.user.id,
    });
    res.status(201).json({ ...measurement.toJSON(), details: result.details });
  } catch (err) {
    handleError(res, err, 'Error al guardar medición');
  }
}

async function getById(req, res) {
  try {
    const m = await Measurement.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: 'Medición no encontrada' });
    res.json(m);
  } catch (err) {
    handleError(res, err, 'Error al obtener medición');
  }
}

async function remove(req, res) {
  try {
    const m = await Measurement.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: 'Medición no encontrada' });
    await m.destroy();
    res.json({ message: 'Medición eliminada' });
  } catch (err) {
    handleError(res, err, 'Error al eliminar medición');
  }
}

module.exports = { list, preview, create, getById, remove };