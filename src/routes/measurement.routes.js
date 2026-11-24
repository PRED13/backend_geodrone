const express = require('express');
const { list, preview, create, getById, remove } = require('../controllers/measurement.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Measurements
 *   description: Mediciones de área, distancia, perímetro y altura
 */

/**
 * @swagger
 * /api/measurements/calculate:
 *   post:
 *     summary: Calcular una medición sin guardarla (vista previa)
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, points]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [area, distance, perimeter, height]
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat: { type: number }
 *                     lng: { type: number }
 *                     alt: { type: number }
 *     responses:
 *       200:
 *         description: Resultado calculado
 *       400:
 *         description: Puntos inválidos o insuficientes
 */

/**
 * @swagger
 * /api/measurements:
 *   get:
 *     summary: Listar mediciones de un proyecto
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mediciones
 *   post:
 *     summary: Guardar una medición (el servidor calcula value y unit)
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, points, project_id]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [area, distance, perimeter, height]
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat: { type: number }
 *                     lng: { type: number }
 *                     alt: { type: number }
 *               name:
 *                 type: string
 *               project_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medición guardada
 *       400:
 *         description: Puntos inválidos o insuficientes
 */
router.get('/', list);
router.post('/calculate', preview); // antes de '/:id'
router.post('/', create);
router.get('/:id', getById);
router.delete('/:id', remove);

module.exports = router;