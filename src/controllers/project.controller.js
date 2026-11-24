const { Project, Flight, User } = require('../models');

/**
 * GET /api/projects
 * Lista todos los proyectos del usuario autenticado.
 */
async function list(req, res) {
  try {
    const projects = await Project.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar proyectos' });
  }
}

/**
 * POST /api/projects
 * Crea un nuevo proyecto.
 */
async function create(req, res) {
  try {
    const { name, description, location, status } = req.body;
    const project = await Project.create({
      name,
      description,
      location,
      status,
      user_id: req.user.id,
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
}

/**
 * GET /api/projects/:id
 * Obtiene un proyecto con sus vuelos.
 */
async function getById(req, res) {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Flight, as: 'Flights' }],
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
}

/**
 * PUT /api/projects/:id
 * Edita un proyecto.
 */
async function update(req, res) {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { name, description, location, status } = req.body;
    await project.update({ name, description, location, status });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
}

/**
 * DELETE /api/projects/:id
 * Elimina un proyecto y sus datos en cascada.
 */
async function remove(req, res) {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    await project.destroy();
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
}

module.exports = { list, create, getById, update, remove };
