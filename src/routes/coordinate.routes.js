const express = require('express');
const { list, getById } = require('../controllers/coordinate.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Coordinates
 *   description: Coordenadas GPS extraídas del EXIF de las fotos
 */

/**
 * @swagger
 * /api/coordinates:
 *   get:
 *     summary: Listar coordenadas (filtrar por flight_id)
 *     tags: [Coordinates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: flight_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de coordenadas GPS
 */
router.get('/', list);
router.get('/:id', getById);

module.exports = router;
