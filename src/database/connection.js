const { Sequelize } = require('sequelize');

const sslCa = process.env.DB_SSL_CA;

const sequelize = new Sequelize(
  process.env.DB_NAME || 'geodrone_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: sslCa
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: sslCa.replace(/\\n/g, '\n'),
          },
        }
      : {},
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

module.exports = { sequelize };
