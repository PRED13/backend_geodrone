const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Reporte generado a partir de un proyecto.
 * Agrupa mediciones y puede exportarse como PDF desde el app móvil.
 */
const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  file_path: {
    type: DataTypes.STRING(512),
    comment: 'Ruta al PDF generado, si aplica',
  },
  summary: {
    type: DataTypes.JSONB,
    comment: 'Resumen de mediciones incluidas en el reporte',
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
  tableName: 'reports',
});

module.exports = Report;
