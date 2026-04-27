'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

let connection = null;

const createConnection = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME
      });
      console.log('Connected to MySQL database.');
    } catch (err) {
      console.error('Error connecting to MySQL database:', err);
      throw err;
    }
  }
  return connection;
};

module.exports = { createConnection };
