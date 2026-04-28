'use strict';

require('dotenv').config();

/**
 * Sequelize CLI configuration.
 * Used by sequelize-cli for migrations and seeders.
 * Reads connection details from environment variables.
 */
module.exports = {
  development: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    dialectOptions: {
      // Required for MySQL 8+ authentication
      authPlugins: {
        mysql_native_password: () => () => Buffer.from(process.env.DATABASE_PASSWORD + '\0'),
      },
    },
    logging: false,
  },
  test: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME + '_test',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  },
};
