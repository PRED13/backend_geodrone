const { Flight, Image, ControlPoint, Model3D, Project } = require('../models');

/**
 * GET /api/flights?project_id=xxx
 * Lista vuelos de un proyecto.
 */
async function list(req, res) {
  try {
    const { project_id } = req.query;
    const where = {};
    if (project_id) where.project_id = project_id;

    const flights = await Flight.findAll({
      where,
      order: [['date', 'DESC']],
    });
    res.json(flights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar vuelos' });
  }
}

/**
 * POST /api/flights
 * Crea un vuelo asociado a un proyecto.
 */
async function create(req, res) {
  try {
    const { name, date, altitude_m, overlap_percent, notes, project_id } = req.body;

    const project = await Project.findOne({
      where: { id: project_id, user_id: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const flight = await Flight.create({
      name, date, altitude_m, overlap_percent, notes, project_id,
    });
    res.status(201).json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear vuelo' });
  }
}

/**
 * GET /api/flights/:id
 * Obtiene un vuelo con imágenes y modelo 3D.
 */
async function getById(req, res) {
  try {
    const flight = await Flight.findByPk(req.params.id, {
      include: [
        { model: Image, as: 'Images' },
        { model: ControlPoint, as: 'ControlPoints' },
        { model: Model3D, as: 'Model3D' },
      ],
    });
    if (!flight) return res.status(404).json({ error: 'Vuelo no encontrado' });
    res.json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vuelo' });
  }
}

/**
 * PUT /api/flights/:id
 * Edita un vuelo.
 */
async function update(req, res) {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Vuelo no encontrado' });

    const { name, date, altitude_m, overlap_percent, notes, status } = req.body;
    await flight.update({ name, date, altitude_m, overlap_percent, notes, status });
    res.json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar vuelo' });
  }
}

/**
 * DELETE /api/flights/:id
 * Elimina un vuelo y sus datos en cascada.
 */
async function remove(req, res) {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) return res.status(404).json({ error: 'Vuelo no encontrado' });

    await flight.destroy();
    res.json({ message: 'Vuelo eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar vuelo' });
  }
}

module.exports = { list, create, getById, update, remove };
