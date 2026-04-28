'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

/**
 * User-type profile models — new schema (database-redesign spec)
 *
 * Defines Sequelize models for:
 *   - Etudiant   (student profile)
 *   - Enseignant (academic teacher/supervisor)
 *   - Encadrant  (professional supervisor)
 *   - Entreprise (company/organization)
 *
 * Each model has a belongsTo association to UserRegistration via user_id.
 * Encadrant also has a belongsTo Entreprise via entreprise_id.
 * Entreprise has a hasMany Encadrant.
 *
 * Requirements: 10.7
 */

// ---------------------------------------------------------------------------
// Etudiant (Student Profile)
// ---------------------------------------------------------------------------
const Etudiant = sequelize.define('Etudiant', {
  etudiant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  uuid: {
    type: DataTypes.STRING(36),
    unique: true,
    allowNull: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true,
  },
  departement: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  specialite: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'etudiant',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Enseignant (Academic Teacher/Supervisor)
// ---------------------------------------------------------------------------
const Enseignant = sequelize.define('Enseignant', {
  enseignant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true,
  },
  departement: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  grade: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'enseignant',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Entreprise (Company/Organization)
// Defined before Encadrant because Encadrant references it
// ---------------------------------------------------------------------------
const Entreprise = sequelize.define('Entreprise', {
  entreprise_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  domaine: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  site_web: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'entreprise',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Encadrant (Professional Supervisor)
// ---------------------------------------------------------------------------
const Encadrant = sequelize.define('Encadrant', {
  encadrant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true,
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  poste: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'encadrant',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Associations
// ---------------------------------------------------------------------------

/**
 * Wire up all associations between user-type models and UserRegistration.
 * Call this once after all models are loaded, passing the UserRegistration model.
 *
 * @param {object} models - { UserRegistration }
 */
function associate(models) {
  const { UserRegistration } = models;

  // Each profile belongs to a user_registration row
  if (UserRegistration) {
    Etudiant.belongsTo(UserRegistration, { foreignKey: 'user_id', as: 'user' });
    Enseignant.belongsTo(UserRegistration, { foreignKey: 'user_id', as: 'user' });
    Encadrant.belongsTo(UserRegistration, { foreignKey: 'user_id', as: 'user' });
    Entreprise.belongsTo(UserRegistration, { foreignKey: 'user_id', as: 'user' });
  }

  // Encadrant belongs to Entreprise (nullable FK)
  Encadrant.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });

  // Entreprise has many Encadrant
  Entreprise.hasMany(Encadrant, { foreignKey: 'entreprise_id', as: 'encadrants' });
}

module.exports = { Etudiant, Enseignant, Encadrant, Entreprise, associate };
