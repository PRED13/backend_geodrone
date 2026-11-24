const express = require('express');
const { list, create, update, remove } = require('../controllers/controlPoint.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: ControlPoints
 *   description: Puntos de control en tierra (GCPs)
 */

/**
 * @swagger
 * /api/control-points:
 *   get:
 *     summary: Listar puntos de control (filtrar por flight_id)
 *     tags: [ControlPoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: flight_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de GCPs
 *   post:
 *     summary: Crear un punto de control
 *     tags: [ControlPoints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Punto creado
 */
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
