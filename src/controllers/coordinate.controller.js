const { Coordinate } = require('../models');

async function list(req, res) {
  try {
    const { flight_id } = req.query;
    // Coordenadas de todas las imágenes de un vuelo
    const coords = await Coordinate.findAll({
      include: [{ association: 'Image', where: flight_id ? { flight_id } : {}, attributes: ['id', 'filename'] }],
    });
    res.json(coords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar coordenadas' });
  }
}

async function getById(req, res) {
  try {
    const coord = await Coordinate.findByPk(req.params.id);
    if (!coord) return res.status(404).json({ error: 'Coordenada no encontrada' });
    res.json(coord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener coordenada' });
  }
}

module.exports = { list, getById };
