const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  altitude_m: {
    type: DataTypes.FLOAT,
    comment: 'Altitud de vuelo en metros',
  },
  overlap_percent: {
    type: DataTypes.FLOAT,
    comment: 'Porcentaje de solapamiento',
  },
  status: {
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'failed'),
    defaultValue: 'planned',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'flights',
});

module.exports = Flight;
