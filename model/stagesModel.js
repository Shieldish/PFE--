'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const zlib = require('node:zlib');

// Model mapped to the actual DB schema created by the Sequelize migration.
// Column names match the migration (lowercase snake_case).
const stage = sequelize.define('stage', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
  },
  entreprise_id: { type: DataTypes.INTEGER, allowNull: true },
  created_by:    { type: DataTypes.STRING(255), allowNull: false },
  titre:         { type: DataTypes.STRING(255), allowNull: false },
  domaine:       { type: DataTypes.STRING(100), allowNull: false },
  nom_entreprise:{ type: DataTypes.STRING(255), allowNull: false },
  libelle:       { type: DataTypes.TEXT, allowNull: false },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    set(value) {
      if (!value) { this.setDataValue('description', value); return; }
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('description', compressed);
      } catch {
        this.setDataValue('description', value);
      }
    },
    get() {
      try {
        const value = this.getDataValue('description');
        if (!value) return '';
        return zlib.inflateSync(Buffer.from(value, 'base64')).toString();
      } catch {
        return '';
      }
    }
  },
  niveau:         { type: DataTypes.STRING(50),  allowNull: false },
  experience:     { type: DataTypes.STRING(50),  allowNull: false },
  langue:         { type: DataTypes.STRING(50),  allowNull: false },
  postes_vacants: { type: DataTypes.SMALLINT,    allowNull: false, defaultValue: 1 },
  telephone:      { type: DataTypes.STRING(30),  allowNull: true },
  fax:            { type: DataTypes.STRING(30),  allowNull: true },
  email:          { type: DataTypes.STRING(255), allowNull: true },
  email2:         { type: DataTypes.STRING(255), allowNull: true },
  date_debut:     { type: DataTypes.DATEONLY,    allowNull: false },
  date_fin:       { type: DataTypes.DATEONLY,    allowNull: false },
  adresse:        { type: DataTypes.STRING(255), allowNull: true },
  rue:            { type: DataTypes.STRING(255), allowNull: true },
  ville:          { type: DataTypes.STRING(100), allowNull: true },
  code_postal:    { type: DataTypes.STRING(20),  allowNull: true },
  is_active:      { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: true },
}, {
  tableName: 'stage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Virtual aliases so existing route code using old uppercase names still works
// (e.g. stages.Titre, stages.Domaine, stages.CreatedBy, stages.Libelle, stages.Nom)
stage.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  // Expose old-style uppercase aliases alongside new names
  values.Titre      = values.titre;
  values.Domaine    = values.domaine;
  values.Nom        = values.nom_entreprise;
  values.Libelle    = values.libelle;
  values.Description= values.description;
  values.Niveau     = values.niveau;
  values.Experience = values.experience;
  values.Langue     = values.langue;
  values.PostesVacants = values.postes_vacants;
  values.Telephone  = values.telephone;
  values.Fax        = values.fax;
  values.Email      = values.email;
  values.Email2     = values.email2;
  values.DateDebut  = values.date_debut;
  values.DateFin    = values.date_fin;
  values.Address    = values.adresse;
  values.Rue        = values.rue;
  values.State      = values.ville;
  values.Zip        = values.code_postal;
  values.CreatedBy  = values.created_by;
  return values;
};

// Also expose as direct properties for code that reads them without toJSON()
const _get = stage.prototype.get;
stage.prototype.get = function (key, options) {
  if (key === undefined) return _get.call(this, key, options);
  const aliasMap = {
    Titre: 'titre', Domaine: 'domaine', Nom: 'nom_entreprise',
    Libelle: 'libelle', Niveau: 'niveau', Experience: 'experience',
    Langue: 'langue', PostesVacants: 'postes_vacants', Telephone: 'telephone',
    Fax: 'fax', Email: 'email', Email2: 'email2', DateDebut: 'date_debut',
    DateFin: 'date_fin', Address: 'adresse', Rue: 'rue', State: 'ville',
    Zip: 'code_postal', CreatedBy: 'created_by', Createdby: 'created_by',
  };
  return _get.call(this, aliasMap[key] || key, options);
};

async function syncStageModel() {
  try {
    await stage.sync({ alter: true });
  } catch (error) {
    if (error.original && ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_MULTIPLE_PRI_KEY',
        'ER_TRUNCATED_WRONG_VALUE', 'ER_CANT_DROP_FIELD_OR_KEY', 'ER_DUP_ENTRY'].includes(error.original.code)) {
      console.warn(`[syncStageModel] Skipping alter for stage: ${error.original.sqlMessage}`);
    } else {
      throw error;
    }
  }
}

module.exports = stage;
module.exports.syncStageModel = syncStageModel;
