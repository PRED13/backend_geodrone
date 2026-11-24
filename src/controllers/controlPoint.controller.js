const { ControlPoint } = require('../models');

async function list(req, res) {
  try {
    const { flight_id } = req.query;
    const where = {};
    if (flight_id) where.flight_id = flight_id;
    const points = await ControlPoint.findAll({ where });
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar puntos de control' });
  }
}

async function create(req, res) {
  try {
    const { label, latitude, longitude, altitude_m, notes, flight_id } = req.body;
    const point = await ControlPoint.create({ label, latitude, longitude, altitude_m, notes, flight_id });
    res.status(201).json(point);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear punto de control' });
  }
}

async function update(req, res) {
  try {
    const point = await ControlPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ error: 'Punto de control no encontrado' });
    await point.update(req.body);
    res.json(point);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar punto de control' });
  }
}

async function remove(req, res) {
  try {
    const point = await ControlPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ error: 'Punto de control no encontrado' });
    await point.destroy();
    res.json({ message: 'Punto de control eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar punto de control' });
  }
}

module.exports = { list, create, update, remove };
