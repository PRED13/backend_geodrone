const User = require('./User');
const Project = require('./Project');
const Flight = require('./Flight');
const Image = require('./Image');
const Coordinate = require('./Coordinate');
const ControlPoint = require('./ControlPoint');
const Measurement = require('./Measurement');
const Model3D = require('./Model3D');
const Report = require('./Report');

// ── Asociaciones ─────────────────────────────────────────────

// Un usuario crea muchos proyectos
User.hasMany(Project, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'user_id' });

// Un proyecto tiene muchos vuelos
Project.hasMany(Flight, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Flight.belongsTo(Project, { foreignKey: 'project_id' });

// Un vuelo tiene muchas imágenes
Flight.hasMany(Image, { foreignKey: 'flight_id', onDelete: 'CASCADE' });
Image.belongsTo(Flight, { foreignKey: 'flight_id' });

// Cada imagen tiene una coordenada GPS (1:1)
Image.hasOne(Coordinate, { foreignKey: 'image_id', onDelete: 'CASCADE' });
Coordinate.belongsTo(Image, { foreignKey: 'image_id' });

// Un vuelo tiene muchos puntos de control (GCPs)
Flight.hasMany(ControlPoint, { foreignKey: 'flight_id', onDelete: 'CASCADE' });
ControlPoint.belongsTo(Flight, { foreignKey: 'flight_id' });

// Un vuelo tiene un modelo 3D (1:1)
Flight.hasOne(Model3D, { foreignKey: 'flight_id', onDelete: 'CASCADE' });
Model3D.belongsTo(Flight, { foreignKey: 'flight_id' });

// Un proyecto tiene muchas mediciones
Project.hasMany(Measurement, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Measurement.belongsTo(Project, { foreignKey: 'project_id' });

// Un usuario hace muchas mediciones
User.hasMany(Measurement, { foreignKey: 'user_id' });
Measurement.belongsTo(User, { foreignKey: 'user_id' });

// Un proyecto tiene muchos reportes
Project.hasMany(Report, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Report.belongsTo(Project, { foreignKey: 'project_id' });

// Un usuario genera muchos reportes
User.hasMany(Report, { foreignKey: 'user_id' });
Report.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Project,
  Flight,
  Image,
  Coordinate,
  ControlPoint,
  Measurement,
  Model3D,
  Report,
};
