'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const zlib = require('node:zlib');

const stage = sequelize.define('stage', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  Domaine: { type: DataTypes.STRING, allowNull: false },
  Nom: { type: DataTypes.STRING, allowNull: false },
  Titre: { type: DataTypes.STRING, allowNull: false },
  Libelle: { type: DataTypes.TEXT, allowNull: false },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('Description', compressed);
      } catch (error) {
        console.error('Error compressing description:', error);
      }
    },
    get() {
      try {
        const value = this.getDataValue('Description');
        if (!value) return '';
        return zlib.inflateSync(Buffer.from(value, 'base64')).toString();
      } catch {
        return '';
      }
    }
  },
  Niveau: { type: DataTypes.STRING, allowNull: false },
  Experience: { type: DataTypes.STRING, allowNull: false },
  Langue: { type: DataTypes.STRING, allowNull: false },
  PostesVacants: { type: DataTypes.STRING, allowNull: false },
  Telephone: { type: DataTypes.STRING, allowNull: false },
  Fax: { type: DataTypes.STRING, allowNull: false },
  Email: { type: DataTypes.STRING, allowNull: false },
  Email2: { type: DataTypes.STRING, allowNull: false },
  DateDebut: { type: DataTypes.DATE, allowNull: false },
  DateFin: { type: DataTypes.DATE, allowNull: false },
  Address: { type: DataTypes.STRING, allowNull: false },
  Rue: { type: DataTypes.STRING, allowNull: false },
  State: { type: DataTypes.STRING, allowNull: false },
  Zip: { type: DataTypes.STRING, allowNull: false },
  gridCheck: { type: DataTypes.BOOLEAN, allowNull: false },
  CreatedBy: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'stage',
  timestamps: true
});

stage.beforeCreate((instance) => {
  instance.id = uuidv4();
});

async function syncStageModel() {
  await stage.sync({ alter: true });
}

module.exports = stage;
module.exports.syncStageModel = syncStageModel;
