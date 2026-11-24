const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Mediciones realizadas sobre el mapa o modelo 3D.
 * El app móvil envía los puntos y el tipo de medición;
 * el servidor calcula y guarda el resultado.
 */
const Measurement = sequelize.define('Measurement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('area', 'distance', 'perimeter', 'height'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    comment: 'Resultado numérico de la medición',
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Unidad del resultado, ej: m, m2, km',
  },
  points: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Array de {lat, lng, alt} que definen la medición',
  },
  name: {
    type: DataTypes.STRING(100),
    comment: 'Nombre opcional dado por el usuario',
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'measurements',
});

module.exports = Measurement;
