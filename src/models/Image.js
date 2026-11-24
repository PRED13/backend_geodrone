const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Imagen capturada por el dron durante un vuelo.
 * Al subirse, se extrae su GPS EXIF y se guarda en la tabla coordinates.
 */
const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
  },
  path: {
    type: DataTypes.STRING(512),
    allowNull: false,
    comment: 'Ruta relativa en el servidor, ej: uploads/flights/uuid/foto.jpg',
  },
  size_bytes: {
    type: DataTypes.BIGINT,
  },
  mime_type: {
    type: DataTypes.STRING(50),
  },
  captured_at: {
    type: DataTypes.DATE,
    comment: 'Fecha/hora capturada del EXIF de la imagen',
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true cuando OpenDroneMap ya procesó esta imagen',
  },
  flight_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'images',
});

module.exports = Image;
