const { validateFlight } = require('../services/validation.service');

async function flightValidation(req, res) {
  try {
    const report = await validateFlight(req.params.id);
    if (!report) return res.status(404).json({ error: 'Vuelo no encontrado' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al validar el vuelo' });
  }
}

module.exports = { flightValidation };