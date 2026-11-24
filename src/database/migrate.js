/**
 * Crea (o actualiza) las tablas en PostgreSQL a partir de los modelos.
 *
 * Uso:
 *   npm run db:migrate              -> crea las tablas que falten (no toca las existentes)
 *   npm run db:migrate -- --alter   -> ajusta tablas existentes a los modelos (conserva datos)
 */
require('dotenv').config();
const { sequelize } = require('./connection');
require('../models'); // registra modelos y asociaciones

async function run() {
  const alter = process.argv.includes('--alter');
  try {
    await sequelize.authenticate();
    console.log(
      `Conectado a ${process.env.DB_NAME || 'geodrone_db'} en ` +
      `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`
    );
    await sequelize.sync({ alter });
    console.log(alter ? 'Tablas sincronizadas (alter).' : 'Tablas creadas/verificadas.');
    process.exit(0);
  } catch (err) {
    console.error('Error en la migración:', err.message);
    process.exit(1);
  }
}

run();