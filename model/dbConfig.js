require('dotenv').config();
const mysql = require('mysql');
const path = require('path');
const fs = require('fs/promises');

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
});

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to MySQL database');
        resolve();
      }
    });
  });
};

const executeSQLCommands = async (commands) => {
  for (const sql of commands) {
    try {
      await executeQuery(sql);
      console.log('SQL query executed successfully');
    } catch (err) {
      console.error('Error executing SQL query:', err);
      return; // Don't terminate the connection here
    }
  }
};

const executeQuery = (sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const fetchSidebarItems = async (lang) => {
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

  try {
    const sidebarResults = await executeQuery(sidebarSql);
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
    return sidebarItems;
  } catch (err) {
    console.error('Error fetching sidebar items:', err);
    throw err;
  }
};

const main = async () => {
  try {
    await connectToDatabase();
    const sqlFilePath = path.join(__dirname, '../items.sql');
    const sqlQuery = await fs.readFile(sqlFilePath, 'utf8');
    const sqlCommands = sqlQuery.split(';').filter(command => command.trim() !== '');
    await executeSQLCommands(sqlCommands);
    const sidebarItems = await fetchSidebarItems('en');
    console.log('Sidebar Items:', sidebarItems);
  } catch (err) {
    console.error('Error:', err);
  }
};

module.exports = {
  connection,
  connectToDatabase,
  executeSQLCommands,
  executeQuery,
  fetchSidebarItems,
  main
};