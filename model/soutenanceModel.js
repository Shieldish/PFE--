'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Model mapped to the actual DB schema created by the Sequelize migration.
const Soutenance = sequelize.define('Soutenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  affectation_id:          { type: DataTypes.INTEGER,    allowNull: true },
  date_soutenance:         { type: DataTypes.DATEONLY,   allowNull: false },
  heure:                   { type: DataTypes.TIME,       allowNull: false },
  salle:                   { type: DataTypes.STRING(50), allowNull: false },
  groupe:                  { type: DataTypes.STRING(50), allowNull: true },
  type_groupe: {
    type: DataTypes.ENUM('Monome', 'Binome', 'Trinome'),
    allowNull: false,
    defaultValue: 'Monome',
  },
  etudiant1_nom:           { type: DataTypes.STRING(255), allowNull: false },
  etudiant2_nom:           { type: DataTypes.STRING(255), allowNull: true },
  etudiant3_nom:           { type: DataTypes.STRING(255), allowNull: true },
  sujet:                   { type: DataTypes.TEXT,        allowNull: false },
  president_id:            { type: DataTypes.INTEGER,     allowNull: true },
  rapporteur_id:           { type: DataTypes.INTEGER,     allowNull: true },
  encadrant_academique_id: { type: DataTypes.INTEGER,     allowNull: true },
  encadrant_professionnel: { type: DataTypes.STRING(255), allowNull: true },
  entreprise_nom:          { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'soutenance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Virtual aliases so existing route code using old field names still works
Soutenance.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v.date                  = v.date_soutenance;
  v.time                  = v.heure;
  v.type                  = v.type_groupe;
  v.etudiant1             = v.etudiant1_nom;
  v.etudiant2             = v.etudiant2_nom;
  v.etudiant3             = v.etudiant3_nom;
  v.president             = v.president_id;
  v.rapporteur            = v.rapporteur_id;
  v.encadrantAcademique   = v.encadrant_academique_id;
  v.encadrantProfessionnel= v.encadrant_professionnel;
  v.entreprise            = v.entreprise_nom;
  return v;
};

const SYNC_IGNORABLE_CODES = new Set([
  'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_MULTIPLE_PRI_KEY',
  'ER_TRUNCATED_WRONG_VALUE', 'ER_CANT_DROP_FIELD_OR_KEY', 'ER_DUP_ENTRY',
]);

async function syncSoutenanceModel() {
  try {
    await Soutenance.sync({ alter: true });
  } catch (error) {
    if (error.original && SYNC_IGNORABLE_CODES.has(error.original.code)) {
      console.warn(`[syncSoutenanceModel] Skipping alter: ${error.original.sqlMessage}`);
    } else {
      throw error;
    }
  }
}

module.exports = Soutenance;
module.exports.syncSoutenanceModel = syncSoutenanceModel;
