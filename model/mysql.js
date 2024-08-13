/* const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database successfully.');
});

module.exports = connection; */

require('dotenv').config();
const mysql = require('mysql2/promise'); // Use mysql2 for promise support

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

const closeConnection = async () => {
  if (connection) {
    try {
      await connection.end();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err);
      throw err;
    }
  }
};

module.exports = {
  createConnection,
  closeConnection
};
