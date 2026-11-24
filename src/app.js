const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const flightRoutes = require('./routes/flight.routes');
const imageRoutes = require('./routes/image.routes');
const coordinateRoutes = require('./routes/coordinate.routes');
const controlPointRoutes = require('./routes/controlPoint.routes');
const measurementRoutes = require('./routes/measurement.routes');
const model3dRoutes = require('./routes/model3d.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (fotos subidas)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/coordinates', coordinateRoutes);
app.use('/api/control-points', controlPointRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/models3d', model3dRoutes);
app.use('/api/reports', reportRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'GeoDrone API v1.0',
    docs: '/api-docs',
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
