'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Soutenance = sequelize.define('Soutenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.TIME, allowNull: false },
  salle: { type: DataTypes.STRING, allowNull: false },
  groupe: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  etudiant1: { type: DataTypes.STRING, allowNull: false },
  etudiant2: { type: DataTypes.STRING },
  etudiant3: { type: DataTypes.STRING },
  sujet: { type: DataTypes.STRING, allowNull: false },
  president: { type: DataTypes.STRING, allowNull: false },
  rapporteur: { type: DataTypes.STRING, allowNull: false },
  encadrantAcademique: { type: DataTypes.STRING, allowNull: false },
  encadrantProfessionnel: { type: DataTypes.STRING },
  entreprise: { type: DataTypes.STRING },
}, {
  tableName: 'soutenance',
  timestamps: true,
});

async function syncSoutenanceModel() {
  await Soutenance.sync({ alter: true });
}

module.exports = Soutenance;
module.exports.syncSoutenanceModel = syncSoutenanceModel;
