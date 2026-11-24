const express = require('express');
const { list, create, getById, pdf, remove } = require('../controllers/report.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reportes generados por el usuario
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Listar reportes del usuario autenticado
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de reportes
 *   post:
 *     summary: Crear un reporte con mediciones seleccionadas
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, project_id]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project_id:
 *                 type: string
 *               measurement_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Reporte creado
 */
router.get('/', list);
router.post('/', create);
router.get('/:id/pdf', pdf);
router.get('/:id', getById);
router.delete('/:id', remove);

module.exports = router;