const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GeoDrone API',
      version: '1.0.0',
      description:
        'API REST del sistema GeoDrone. Gestiona usuarios, proyectos, vuelos, imágenes con GPS, modelos 3D generados por OpenDroneMap, mediciones y reportes.',
      contact: {
        name: 'Equipo GeoDrone',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido en /api/auth/login',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Rutas donde están los comentarios JSDoc con @swagger
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
