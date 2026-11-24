const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configura Multer para guardar las fotos del dron en:
 *   uploads/flights/<flight_id>/
 *
 * El flight_id se toma del body o del query string.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const flightId = req.body.flight_id || req.params.flight_id || 'unknown';
    const dir = path.join(__dirname, '..', '..', 'uploads', 'flights', flightId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Prefijo con timestamp para evitar colisiones
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|tiff|tif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o TIFF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB por imagen
});

module.exports = upload;
