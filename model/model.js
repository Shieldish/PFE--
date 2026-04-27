'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const enseignant = sequelize.define('enseignant', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: { type: DataTypes.STRING, allowNull: true },
  PRENOM: { type: DataTypes.STRING, allowNull: true },
  SEXE: { type: DataTypes.STRING, allowNull: true },
  DEPARTEMENT: { type: DataTypes.STRING, allowNull: true },
  DATE: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'enseignant', timestamps: true });

const encadrant = sequelize.define('encadrant', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: { type: DataTypes.STRING, allowNull: true },
  PRENOM: { type: DataTypes.STRING, allowNull: true },
  SEXE: { type: DataTypes.STRING, allowNull: true },
  DEPARTEMENT: { type: DataTypes.STRING, allowNull: true },
  DATE: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'encadrant', timestamps: true });

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
  NOM: { type: DataTypes.STRING, allowNull: true },
  PRENOM: { type: DataTypes.STRING, allowNull: true },
  SEXE: { type: DataTypes.STRING, allowNull: true },
  DEPARTEMENT: { type: DataTypes.STRING, allowNull: true },
  SPECIALITE: { type: DataTypes.STRING, allowNull: true },
  DATE: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'etudiant', timestamps: true });

etudiant.beforeCreate((instance) => {
  instance.ID = uuidv4();
});

const entreprise = sequelize.define('entreprise', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  NOM: { type: DataTypes.STRING, allowNull: true },
  DOMAINE: { type: DataTypes.STRING, allowNull: true },
  VILLE: { type: DataTypes.STRING, allowNull: true },
  ADDRESSE: { type: DataTypes.STRING, allowNull: true },
  TELEPHONE: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'entreprise', timestamps: true });

async function getAllTablesAndStructure() {
  try {
    const tablesAndColumns = await sequelize.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = :databaseName;`,
      {
        replacements: { databaseName: sequelize.config.database },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!Array.isArray(tablesAndColumns) || tablesAndColumns.length === 0) {
      throw new Error('No tables and columns found');
    }

    const tablesStructure = {};
    tablesAndColumns.forEach(({ table_name, column_name }) => {
      if (!tablesStructure[table_name]) tablesStructure[table_name] = [];
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
    await entreprise.sync({ alter: true });
  } catch (error) {
    console.error('Error syncing models:', error);
  }
}

module.exports = {
  enseignant,
  etudiant,
  encadrant,
  entreprise,
  getAllTablesAndStructure,
  getDataFromTable,
  syncModel,
  sequelize,
  DataTypes
};
