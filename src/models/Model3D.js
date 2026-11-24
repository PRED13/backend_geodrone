const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Modelo 3D generado por OpenDroneMap a partir de las imágenes de un vuelo.
 * Almacena la referencia a los archivos de salida (OBJ, PLY, GeoTIFF, etc.).
 */
const Model3D = sequelize.define('Model3D', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
    comment: 'Estado del procesamiento ODM',
  },
  odm_task_id: {
    type: DataTypes.STRING(100),
    comment: 'ID de la tarea en OpenDroneMap',
  },
  orthophoto_path: {
    type: DataTypes.STRING(512),
    comment: 'Ruta al ortofotomapa GeoTIFF',
  },
  pointcloud_path: {
    type: DataTypes.STRING(512),
    comment: 'Ruta al archivo de nube de puntos (.las / .laz)',
  },
  mesh_path: {
    type: DataTypes.STRING(512),
    comment: 'Ruta al modelo 3D (.obj)',
  },
  dsm_path: {
    type: DataTypes.STRING(512),
    comment: 'Ruta al Modelo Digital de Superficie',
  },
  processing_time_s: {
    type: DataTypes.INTEGER,
    comment: 'Tiempo de procesamiento en segundos',
  },
  started_at: {
    type: DataTypes.DATE,
  },
  finished_at: {
    type: DataTypes.DATE,
  },
  flight_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'models_3d',
});

module.exports = Model3D;
