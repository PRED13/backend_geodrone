const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Puntos de control en tierra (GCPs - Ground Control Points).
 * Se usan para mejorar la precisión geométrica del modelo 3D generado por ODM.
 */
const ControlPoint = sequelize.define('ControlPoint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  label: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Identificador del punto, ej: GCP-01',
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
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  flight_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'control_points',
});

module.exports = ControlPoint;
