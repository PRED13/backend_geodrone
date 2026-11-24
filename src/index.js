require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./database/connection');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Crea tablas faltantes sin alterar las existentes.
    await sequelize.sync();
    console.log('✅ Modelos sincronizados con la base de datos.');

    app.listen(PORT, () => {
      console.log(`🚀 GeoDrone API corriendo en http://localhost:${PORT}`);
      console.log(`📄 Documentación Swagger: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
