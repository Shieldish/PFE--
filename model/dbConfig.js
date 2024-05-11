/* 
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

 */

/* require('dotenv').config();
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

const createDBConnection = () => {
  const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
  });

  connection.connect(err => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database');
    executeSQLQueries(connection);
  });

  connection.on('error', err => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect to database...');
      createDBConnection();
    } else {
      throw err;
    }
  });

  return connection;
};

const executeSQLQueries = connection => {
  const sqlFilePath = path.join(__dirname, '../items.sql');
  try {
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    const sqlCommands = sqlQuery.split(';').filter(command => command.trim() !== '');

    // Execute each SQL command
    sqlCommands.forEach(sql => {
      connection.query(sql, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          return;
        }
        console.log('SQL query executed successfully');
      });
    });
  } catch (error) {
    console.error('Error reading SQL file:', error);
  }
};

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

    if (typeof callback === 'function') {
      callback(null, sidebarItems);
    }
  });
};

const connection = createDBConnection();

module.exports = { connection, fetchSidebarItems };
 */

/* gemini
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

  // Handle connection errors
  connection.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Connection lost, reconnecting...');
      connection.connect();
    } else {
      console.error('Unexpected connection error:', err);
    }
  });

  // ... rest of the code for initializing the database (unchanged)
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

  try {
    connection.query(sidebarSql, (sidebarErr, sidebarResults) => {
      if (sidebarErr) {
        console.error('Error fetching sidebar items:', sidebarErr);
        if (typeof callback === 'function') {
          callback('Error fetching sidebar items', null);
        }
        return;
      }
      // ... rest of the code for building sidebar items (unchanged)
    });
  } catch (error) {
    console.error('Error executing sidebar query:', error);
    if (typeof callback === 'function') {
      callback('Error fetching sidebar items', null);
    }
  }
};

module.exports = { connection, fetchSidebarItems };
 */

/* gtp 
require('dotenv').config();
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// Create a function to establish MySQL connection
const createConnection = () => {
  return mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });
};

const executeQuery = (connection, sql) => {
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

const fetchSidebarItems = (lang, callback) => {
  // Create a new connection each time
  const connection = createConnection();

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

  executeQuery(connection, sidebarSql)
    .then(sidebarResults => {
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

      callback(null, sidebarItems);
    })
    .catch(err => {
      console.error('Error fetching sidebar items:', err);
      callback('Error fetching sidebar items', null);
    })
    .finally(() => {
      // Close the connection after fetching sidebar items
      connection.end();
    });
};

module.exports = {
  connection: createConnection(),
  fetchSidebarItems
};
 */

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