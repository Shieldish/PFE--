'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { DATABASE } = require('./constants');
const { isDevelopment } = require('./env-validator');

/**
 * Enhanced Sequelize Database Configuration
 * 
 * Improvements:
 * - Connection pooling for better performance
 * - Retry logic for transient connection failures
 * - Better logging configuration
 * - Timezone handling
 */

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    
    // Connection pooling for better performance
    pool: {
      max: DATABASE.POOL.MAX,
      min: DATABASE.POOL.MIN,
      acquire: DATABASE.POOL.ACQUIRE,
      idle: DATABASE.POOL.IDLE,
    },
    
    // Logging: verbose in development, silent in production
    logging: isDevelopment() ? console.log : false,
    
    // Retry logic for transient failures
    retry: {
      max: DATABASE.RETRY.MAX_ATTEMPTS,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /PROTOCOL_CONNECTION_LOST/,
      ],
    },
    
    // Dialect-specific options
    dialectOptions: {
      charset: 'utf8mb4',
      // Set timezone to UTC for consistency
      timezone: '+00:00',
      // Enable multiple statements (use with caution)
      multipleStatements: false,
    },
    
    // Model defaults
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // Add timestamps by default
      timestamps: true,
      underscored: false,
      // Prevent Sequelize from pluralizing table names
      freezeTableName: true,
    },
    
    // Timezone for Sequelize
    timezone: '+00:00',
  }
);

/**
 * Test database connection with retry logic
 * @param {number} attempt - Current attempt number
 * @returns {Promise<boolean>} Success status
 */
async function testConnection(attempt = 1) {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    if (attempt < DATABASE.RETRY.MAX_ATTEMPTS) {
      console.warn(`Database connection attempt ${attempt} failed. Retrying in ${DATABASE.RETRY.DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, DATABASE.RETRY.DELAY_MS));
      return testConnection(attempt + 1);
    }
    throw error;
  }
}

module.exports = { sequelize, Sequelize, testConnection };
