'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const zlib = require('node:zlib');
const { sequelize } = require('../config/database');

const stagepostulation = sequelize.define('stagepostulation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stageId: { type: DataTypes.STRING(36), allowNull: false },
  etudiantID: { type: DataTypes.STRING, allowNull: false },
  etudiantName: { type: DataTypes.STRING, allowNull: false },
  etudiantInstitue: { type: DataTypes.STRING, allowNull: false },
  etudiantSection: { type: DataTypes.STRING, allowNull: false },
  etudiantEmail: { type: DataTypes.STRING, allowNull: false },
  stageDomaine: { type: DataTypes.STRING, allowNull: false },
  stageSujet: { type: DataTypes.STRING, allowNull: false },
  entrepriseName: { type: DataTypes.STRING, allowNull: false },
  entrepriseEmail: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('a attente', 'accepté', 'refusé'),
    allowNull: false,
    defaultValue: 'a attente'
  },
  CV: { type: DataTypes.STRING, allowNull: true },
  postulatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stagepostulation',
  timestamps: false
});

const candidature = sequelize.define('candidature', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stage_id:    { type: DataTypes.STRING(36),  allowNull: false },
  etudiant_id: { type: DataTypes.INTEGER,     allowNull: false },
  status: {
    type: DataTypes.ENUM('en_attente', 'accepte', 'refuse'),
    allowNull: false,
    defaultValue: 'en_attente',
  },
  nom:                  { type: DataTypes.STRING(100), allowNull: false },
  prenom:               { type: DataTypes.STRING(100), allowNull: false },
  date_naissance:       { type: DataTypes.DATEONLY,    allowNull: true },
  adresse:              { type: DataTypes.STRING(255), allowNull: true },
  telephone:            { type: DataTypes.STRING(30),  allowNull: true },
  email:                { type: DataTypes.STRING(255), allowNull: false },
  niveau_etudes:        { type: DataTypes.STRING(100), allowNull: false },
  institution:          { type: DataTypes.STRING(255), allowNull: false },
  domaine_etudes:       { type: DataTypes.STRING(100), allowNull: false },
  section:              { type: DataTypes.STRING(100), allowNull: true },
  annee_obtention:      { type: DataTypes.INTEGER,     allowNull: true },
  has_experience:       { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false },
  experience_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('experience_description', compressed);
      } catch { this.setDataValue('experience_description', value); }
    },
    get() {
      try {
        const value = this.getDataValue('experience_description');
        if (!value) return '';
        return zlib.inflateSync(Buffer.from(value, 'base64')).toString();
      } catch { return ''; }
    }
  },
  motivation: {
    type: DataTypes.TEXT,
    allowNull: true,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('motivation', compressed);
      } catch { this.setDataValue('motivation', value); }
    },
    get() {
      try {
        const value = this.getDataValue('motivation');
        if (!value) return '';
        return zlib.inflateSync(Buffer.from(value, 'base64')).toString();
      } catch { return ''; }
    }
  },
  langues:              { type: DataTypes.STRING(255), allowNull: true },
  logiciels:            { type: DataTypes.STRING(255), allowNull: true },
  competences_autres:   { type: DataTypes.STRING(255), allowNull: true },
  date_debut_souhaitee: { type: DataTypes.DATEONLY,    allowNull: true },
  duree_stage_mois:     { type: DataTypes.INTEGER,     allowNull: true },
  cv_url:               { type: DataTypes.STRING(500), allowNull: true },
  lettre_motivation_url:{ type: DataTypes.STRING(500), allowNull: true },
  releves_notes_url:    { type: DataTypes.STRING(500), allowNull: true },
}, {
  tableName: 'candidature',
  timestamps: true,
  createdAt: 'postule_le',
  updatedAt: 'updated_at',
});

const SYNC_IGNORABLE_CODES = new Set([
  'ER_DUP_FIELDNAME',
  'ER_DUP_KEYNAME',
  'ER_MULTIPLE_PRI_KEY',
  'ER_TRUNCATED_WRONG_VALUE',
  'ER_CANT_DROP_FIELD_OR_KEY',
  'ER_DUP_ENTRY',
]);

async function syncPostulationModels() {
  for (const [name, model] of [['stagepostulation', stagepostulation], ['candidature', candidature]]) {
    try {
      await model.sync({ alter: true });
    } catch (error) {
      if (error.original && SYNC_IGNORABLE_CODES.has(error.original.code)) {
        console.warn(`[syncPostulationModels] Skipping alter for ${name}: ${error.original.sqlMessage}`);
      } else {
        throw error;
      }
    }
  }
}

module.exports = { candidature, stagepostulation, syncPostulationModels };
