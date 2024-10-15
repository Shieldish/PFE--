// model/model.js
const { v4: uuidv4 } = require('uuid');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
 const fs = require('fs/promises'); 
 const f = require('fs'); 


const caFilePath = path.join(__dirname, '../certificate.pem');
const ca = f.readFileSync(caFilePath, 'utf8');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD, 
  {
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT,
    port: process.env.DATABASE_PORT,
    dialectOptions: {
      ssl: {
        ca: ca, // Include the CA certificate
        rejectUnauthorized: true, // Ensures the server certificate is validated
      },
    },
    logging: false, 

  }
);

const enseignant = sequelize.define('enseignant', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  PRENOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  SEXE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DEPARTEMENT: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DATE: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'enseignant',
  timestamps: true
});

const encadrant = sequelize.define('encadrant', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  PRENOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  SEXE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DEPARTEMENT: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DATE: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'encadrant',
  timestamps: true
});

const etudiant = sequelize.define('etudiant', {
  ID: {
    type: DataTypes.STRING(36),
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  PRENOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  SEXE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DEPARTEMENT: {
    type: DataTypes.STRING,
    allowNull: true
  },
  SPECIALITE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DATE: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'etudiant',
  timestamps: true
});

etudiant.beforeCreate((etudiant, _) => {
  etudiant.ID = uuidv4();
});



const entreprise = sequelize.define('entreprise', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DOMAINE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  VILLE: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ADDRESSE : {
    type: DataTypes.STRING,
    allowNull: true
  },
  TELEPHONE: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'entreprise',
  timestamps: true
});

/* async function getAllTablesAndStructure() {
  try {
    const tablesAndColumns = await sequelize.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = :databaseName;
    `, {
      replacements: { databaseName: sequelize.config.database },
      type: sequelize.QueryTypes.SELECT
    });

    if (!Array.isArray(tablesAndColumns) || tablesAndColumns.length === 0) {
      throw new Error('No tables and columns found');
    }

    const tablesStructure = {};
    tablesAndColumns.forEach(row => {
      const { table_name, column_name } = row;
      if (!tablesStructure[table_name]) {
        tablesStructure[table_name] = [];
      }
      tablesStructure[table_name].push(column_name);
    });

    return tablesStructure;
  } catch (error) {
    return null;
  }
} */
async function getAllTablesAndStructure() {
  try {
    const tablesAndColumns = await sequelize.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = :databaseName;
    `, {
      replacements: { databaseName: sequelize.config.database },
      type: sequelize.QueryTypes.SELECT
    });

    if (!Array.isArray(tablesAndColumns) || tablesAndColumns.length === 0) {
      throw new Error('No tables and columns found');
    }

    const tablesStructure = {};
    tablesAndColumns.forEach(row => {
      const { table_name, column_name } = row;
      if (!tablesStructure[table_name]) {
        tablesStructure[table_name] = [];
      }
      tablesStructure[table_name].push(column_name);
    });

    return tablesStructure;
  } catch (error) {
    return null;
  }
}
  
  
async function getDataFromTable(TableName) {
  try {
    const tableData = await sequelize.query(`SELECT * FROM ${TableName}`, {
      type: sequelize.QueryTypes.SELECT
    });

    if (!Array.isArray(tableData) || tableData.length === 0) {
      throw new Error(`No data found in table '${TableName}'`);
    }

    return tableData;
  } catch (error) {
    return null;
  }
}

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection (Sequelize) to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function syncModel() {
  try {
    await enseignant.sync({ alter: true });
    await encadrant.sync({ alter: true });
    await etudiant.sync({ alter: true });
    await entreprise.sync({alter:true});
  } catch (error) {
    console.error('Error syncing models:', error);
  }
}

const executeSQLCommands = async (commands) => {
  for (const sql of commands) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.error('Error executing SQL query:', err);
    }
  }
};

const main = async () => {
  try {
    const sqlFilePath = path.join(__dirname, '../items.sql');
    const sqlQuery = await fs.readFile(sqlFilePath, 'utf8');
    const sqlCommands = sqlQuery.split(';').filter(command => command.trim() !== '');
    await executeSQLCommands(sqlCommands);
  } catch (err) {
    console.error('Error:', err);
  }
};

sequelize.sync().then(() => {
  main();
}).catch(err => {
  console.error('Error syncing database:', err);
});

connectToDatabase();
syncModel();

module.exports = {
  enseignant,
  etudiant,
  encadrant,
  entreprise,
  getAllTablesAndStructure,
  getDataFromTable,
  sequelize,
  DataTypes
};
