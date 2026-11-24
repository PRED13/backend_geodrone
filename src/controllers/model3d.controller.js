const { Model3D } = require('../models');

async function getByFlight(req, res) {
  try {
    const model = await Model3D.findOne({ where: { flight_id: req.params.flight_id } });
    if (!model) return res.status(404).json({ error: 'Modelo 3D no encontrado' });
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener modelo 3D' });
  }
}

async function create(req, res) {
  try {
    const { name, flight_id } = req.body;
    const existing = await Model3D.findOne({ where: { flight_id } });
    if (existing) return res.status(409).json({ error: 'Ya existe un modelo 3D para este vuelo' });
    const model = await Model3D.create({ name, flight_id });
    res.status(201).json(model);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear modelo 3D' });
  }
}

/**
 * PUT /api/models3d/:id
 * Actualiza el estado y rutas de archivos del modelo (llamado por el procesador ODM).
 */
async function update(req, res) {
  try {
    const model = await Model3D.findByPk(req.params.id);
    if (!model) return res.status(404).json({ error: 'Modelo 3D no encontrado' });
    await model.update(req.body);
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar modelo 3D' });
  }
}

module.exports = { getByFlight, create, update };
