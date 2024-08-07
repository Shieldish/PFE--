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

let isConnected = false;

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    if (isConnected) {
      resolve();
      return;
    }

    connection.connect((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to MySQL database');
        isConnected = true;
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

const fetchSidebarItems = async (lang, userRole) => {
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
    const sidebarItems = buildSidebarTree(sidebarResults, userRole);
    return sidebarItems;
  } catch (err) {
    console.error('Error fetching sidebar items:', err);
    throw err;
  }
};

const buildSidebarTree = (items, userRole, parentId = null) => {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => {
      const children = buildSidebarTree(items, userRole, item.id);
      const hasAccessToItem = hasAccess(item.link, userRole);
      const hasAccessToChildren = children.some(child => child.visible);

      return {
        id: item.id,
        name: item.name,
        link: item.link,
        icon: item.icon,
        children: children.filter(child => child.visible),
        visible: hasAccessToItem || hasAccessToChildren
      };
    })
    .filter(item => item.visible);
};

const hasAccess = (link, userRole) => {
  const roleAccess = {
    '/': ['USER', 'ENTREPRISE','ADMIN', 'DEPARTEMENT'],
    '/etudiant': ['USER', 'ENTREPRISE','ADMIN', 'DEPARTEMENT'],
    '/home': ['USER', 'ENTREPRISE','ADMIN', 'DEPARTEMENT'],
    '/entreprise': ['ENTREPRISE', 'DEPARTEMENT', 'ADMIN'],
    '/encadrement': ['DEPARTEMENT', 'ADMIN'],
    '/planification': ['DEPARTEMENT', 'ADMIN'],
    '/settings': ['USER', 'ENTREPRISE', 'DEPARTEMENT', 'ADMIN'],
    '/gestion': ['ADMIN'],
    '/files/upload': ['ADMIN']
  };

  // If the link is not in the roleAccess object or starts with '#', assume it's accessible to all
  if (!roleAccess[link] || link.startsWith('#')) {
    return false;
  }

  return roleAccess[link].includes(userRole);
};

const main = async () => {
  try {
    await connectToDatabase();
    const sqlFilePath = path.join(__dirname, '../items.sql');
    const sqlQuery = await fs.readFile(sqlFilePath, 'utf8');
    const sqlCommands = sqlQuery.split(';').filter(command => command.trim() !== '');
    await executeSQLCommands(sqlCommands);
    const sidebarItems = await fetchSidebarItems('en', 'USER'); // Assuming 'USER' role for example
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
