const express = require('express');
const { upload: uploadImages, list, remove } = require('../controllers/image.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Subida y gestión de fotos del dron
 */

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Subir fotos del dron (extrae GPS EXIF automáticamente)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [flight_id, images]
 *             properties:
 *               flight_id:
 *                 type: string
 *                 description: UUID del vuelo al que pertenecen las fotos
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Imágenes subidas y coordenadas GPS guardadas
 *       400:
 *         description: No se recibieron imágenes
 */
router.post('/upload', upload.array('images', 500), uploadImages);

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Listar imágenes de un vuelo
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: flight_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de imágenes con coordenadas GPS
 */
router.get('/', list);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Eliminar una imagen
 *     tags: [Images]
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
 *         description: Imagen eliminada
 */
router.delete('/:id', remove);

module.exports = router;
