const express = require('express');
const { getByFlight, create, update } = require('../controllers/model3d.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Models3D
 *   description: Modelos 3D generados por OpenDroneMap
 */

/**
 * @swagger
 * /api/models3d/flight/{flight_id}:
 *   get:
 *     summary: Obtener modelo 3D de un vuelo
 *     tags: [Models3D]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flight_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del modelo 3D con rutas de archivos
 *       404:
 *         description: Modelo no encontrado
 */
router.get('/flight/:flight_id', getByFlight);

/**
 * @swagger
 * /api/models3d:
 *   post:
 *     summary: Crear registro de modelo 3D (inicia el procesamiento)
 *     tags: [Models3D]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Registro creado
 */
router.post('/', create);

/**
 * @swagger
 * /api/models3d/{id}:
 *   put:
 *     summary: Actualizar estado y rutas del modelo 3D (usado por el procesador ODM)
 *     tags: [Models3D]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modelo actualizado
 */
router.put('/:id', update);

module.exports = router;
