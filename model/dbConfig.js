
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

const fetchSidebarItems = (lang, connection, callback) => {
  
  const sidebarSql = `
    SELECT
      s.id,
      s.name_${lang} AS name,
      s.link,
      s.icon,
      s.parent_id
    FROM sidebar_items s
    ORDER BY s.parent_id, s.id
  `;

  connection.query(sidebarSql, (sidebarErr, sidebarResults) => {
    if (sidebarErr) {
      console.error('Error fetching sidebar items:', sidebarErr);
      if (typeof callback === 'function') {
        callback('Error fetching sidebar items', null);
      }
      return;
    }

    // Build the sidebar items structure
    const sidebarItems = sidebarResults.reduce((acc, item) => {
      if (item.parent_id === null) {
        acc.push({
          id: item.id,
          name: item.name,
          link: item.link,
          icon: item.icon,
          children: []
        });
      } else {
        const parent = acc.find(i => i.id === item.parent_id);
        if (parent) {
          parent.children.push({
            id: item.id,
            name: item.name,
            link: item.link,
            icon: item.icon
          });
        }
      }
      return acc;
    }, []);

    //console.log("Sidebar Items : =>", sidebarItems);
    if (typeof callback === 'function') {
      callback(null, sidebarItems);
    }
  });
};

module.exports = {connection , fetchSidebarItems};

