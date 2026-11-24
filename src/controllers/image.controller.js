const path = require('path');
const exifr = require('exifr');
const { Image, Coordinate, Flight } = require('../models');

/**
 * POST /api/images/upload
 * Recibe una o varias fotos del dron, las guarda en disco
 * y extrae la coordenada GPS del EXIF de cada una.
 */
async function upload(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron imágenes' });
    }

    const { flight_id } = req.body;

    const flight = await Flight.findByPk(flight_id);
    if (!flight) return res.status(404).json({ error: 'Vuelo no encontrado' });

    const results = [];

    for (const file of req.files) {
      // Ruta relativa para guardar en la BD
      const relativePath = path.join('uploads', 'flights', flight_id, file.filename)
        .replace(/\\/g, '/');

      // Extraer datos EXIF
      let capturedAt = null;
      let gps = null;
      try {
        const exif = await exifr.parse(file.path, {
          gps: true,
          tiff: true,
          exif: true,
        });
        if (exif) {
          capturedAt = exif.DateTimeOriginal || exif.CreateDate || null;
          if (exif.latitude && exif.longitude) {
            gps = {
              latitude: exif.latitude,
              longitude: exif.longitude,
              altitude_m: exif.GPSAltitude || null,
            };
          }
        }
      } catch (exifErr) {
        console.warn(`⚠️  No se pudo leer EXIF de ${file.filename}:`, exifErr.message);
      }

      // Guardar imagen en BD
      const image = await Image.create({
        filename: file.filename,
        original_name: file.originalname,
        path: relativePath,
        size_bytes: file.size,
        mime_type: file.mimetype,
        captured_at: capturedAt,
        flight_id,
      });

      // Guardar coordenada GPS si existe
      let coordinate = null;
      if (gps) {
        coordinate = await Coordinate.create({
          latitude: gps.latitude,
          longitude: gps.longitude,
          altitude_m: gps.altitude_m,
          image_id: image.id,
        });
      }

      results.push({ image, coordinate });
    }

    res.status(201).json({
      message: `${results.length} imagen(es) subida(s) correctamente`,
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
}

/**
 * GET /api/images?flight_id=xxx
 * Lista las imágenes de un vuelo.
 */
async function list(req, res) {
  try {
    const { flight_id } = req.query;
    const where = {};
    if (flight_id) where.flight_id = flight_id;

    const images = await Image.findAll({
      where,
      include: [{ model: Coordinate, as: 'Coordinate' }],
      order: [['created_at', 'ASC']],
    });
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar imágenes' });
  }
}

/**
 * DELETE /api/images/:id
 * Elimina una imagen de la BD (no borra el archivo físico automáticamente).
 */
async function remove(req, res) {
  try {
    const image = await Image.findByPk(req.params.id);
    if (!image) return res.status(404).json({ error: 'Imagen no encontrada' });
    await image.destroy();
    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
}

module.exports = { upload, list, remove };
