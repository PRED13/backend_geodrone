const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Coordenada GPS extraída del EXIF de cada imagen.
 * Una imagen tiene exactamente una coordenada.
 */
const Coordinate = sequelize.define('Coordinate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  altitude_m: {
    type: DataTypes.FLOAT,
    comment: 'Altitud GPS en metros sobre el nivel del mar',
  },
  accuracy_m: {
    type: DataTypes.FLOAT,
    comment: 'Precisión GPS en metros (si la cámara la reporta)',
  },
  image_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: 'Relación 1:1 con Image',
  },
}, {
  tableName: 'coordinates',
});

module.exports = Coordinate;
