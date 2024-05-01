
require('dotenv').config();
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');

  const sqlFilePath = path.join(__dirname, '../items.sql');
  try {
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    const sqlCommands = sqlQuery.split(';').filter(command => command.trim() !== '');

    // Execute each SQL command
    sqlCommands.forEach(sql => {
      console.log(sql)
      try {
        connection.query(sql, (err, result) => {
          if (err) {
            console.error('Error executing SQL query:', err);
            return;
          }
          console.log('SQL query executed successfully');
        });
      } catch (error) {
        console.error('Error executing SQL query:', error);
      }
    });
  } catch (error) {
    console.error('Error reading SQL file:', error);
  }
});

module.exports = connection;

