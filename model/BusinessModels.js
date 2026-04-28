'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

/**
 * Business logic models — new schema (database-redesign spec)
 *
 * Defines Sequelize models for:
 *   - Stage        (internship opportunity)
 *   - Candidature  (student application)
 *   - Affectation  (supervisor assignment)
 *   - Soutenance   (defense presentation)
 *
 * Associations:
 *   Stage        belongsTo Entreprise (entreprise_id)
 *   Candidature  belongsTo Stage (stage_id)
 *   Candidature  belongsTo Etudiant (etudiant_id)
 *   Affectation  belongsTo Candidature (candidature_id, UNIQUE)
 *   Affectation  belongsTo Enseignant (enseignant_id, nullable)
 *   Affectation  belongsTo Encadrant  (encadrant_id, nullable)
 *   Soutenance   belongsTo Affectation (affectation_id, nullable)
 *   Soutenance   belongsTo Enseignant  (president_id, rapporteur_id, encadrant_academique_id)
 *   Soutenance   belongsTo Encadrant   (encadrant_professionnel_id)
 *
 * Requirements: 10.7
 */

// ---------------------------------------------------------------------------
// Stage (Internship Opportunity)
// ---------------------------------------------------------------------------
const Stage = sequelize.define('Stage', {
  stage_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  domaine: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  niveau_requis: {
    type: DataTypes.ENUM('LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE'),
    allowNull: true,
  },
  experience_requise: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  langue_requise: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postes_vacants: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: true,
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  code_postal: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contact_telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'stage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Candidature (Student Application)
// ---------------------------------------------------------------------------
const Candidature = sequelize.define('Candidature', {
  candidature_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stage_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  etudiant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'ANNULE'),
    defaultValue: 'EN_ATTENTE',
    allowNull: false,
  },
  // Snapshot of student information at application time
  etudiant_nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant_prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  etudiant_departement: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant_specialite: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Application documents
  cv_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  lettre_motivation_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  releves_notes_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  motivation_letter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date_postulation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
  },
  date_modification: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'candidature',
  timestamps: false, // managed manually via date_postulation / date_modification
  hooks: {
    beforeUpdate(instance) {
      instance.date_modification = new Date();
    },
  },
});

// ---------------------------------------------------------------------------
// Affectation (Supervisor Assignment)
// ---------------------------------------------------------------------------
const Affectation = sequelize.define('Affectation', {
  affectation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  candidature_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  enseignant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  encadrant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date_affectation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'affectation',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Soutenance (Defense Presentation)
// ---------------------------------------------------------------------------
const Soutenance = sequelize.define('Soutenance', {
  soutenance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  affectation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date_soutenance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  heure_soutenance: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  salle: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  type_presentation: {
    type: DataTypes.ENUM('MONOME', 'BINOME', 'TRINOME'),
    allowNull: true,
  },
  // Student names (manually entered for flexibility)
  etudiant1_nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant1_prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant2_nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant2_prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant3_nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  etudiant3_prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Jury members (FK columns — associations wired below)
  president_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rapporteur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  encadrant_academique_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  encadrant_professionnel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sujet: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entreprise_nom: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'soutenance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ---------------------------------------------------------------------------
// Associations
// ---------------------------------------------------------------------------

/**
 * Wire up all associations between business models and user-type models.
 * Call this once after all models are loaded.
 *
 * @param {object} models - { Entreprise, Etudiant, Enseignant, Encadrant }
 */
function associate(models) {
  const { Entreprise, Etudiant, Enseignant, Encadrant } = models;

  // Stage belongs to Entreprise
  if (Entreprise) {
    Stage.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
    Entreprise.hasMany(Stage, { foreignKey: 'entreprise_id', as: 'stages' });
  }

  // Candidature belongs to Stage and Etudiant
  Stage.hasMany(Candidature, { foreignKey: 'stage_id', as: 'candidatures' });
  Candidature.belongsTo(Stage, { foreignKey: 'stage_id', as: 'stage' });

  if (Etudiant) {
    Etudiant.hasMany(Candidature, { foreignKey: 'etudiant_id', as: 'candidatures' });
    Candidature.belongsTo(Etudiant, { foreignKey: 'etudiant_id', as: 'etudiant' });
  }

  // Affectation belongs to Candidature (one-to-one, UNIQUE FK)
  Candidature.hasOne(Affectation, { foreignKey: 'candidature_id', as: 'affectation' });
  Affectation.belongsTo(Candidature, { foreignKey: 'candidature_id', as: 'candidature' });

  if (Enseignant) {
    Affectation.belongsTo(Enseignant, { foreignKey: 'enseignant_id', as: 'enseignant' });
    Enseignant.hasMany(Affectation, { foreignKey: 'enseignant_id', as: 'affectations' });
  }

  if (Encadrant) {
    Affectation.belongsTo(Encadrant, { foreignKey: 'encadrant_id', as: 'encadrant' });
    Encadrant.hasMany(Affectation, { foreignKey: 'encadrant_id', as: 'affectations' });
  }

  // Soutenance belongs to Affectation (nullable)
  Affectation.hasMany(Soutenance, { foreignKey: 'affectation_id', as: 'soutenances' });
  Soutenance.belongsTo(Affectation, { foreignKey: 'affectation_id', as: 'affectation' });

  // Soutenance jury members — three enseignant roles + one encadrant role
  if (Enseignant) {
    Soutenance.belongsTo(Enseignant, { foreignKey: 'president_id', as: 'president' });
    Soutenance.belongsTo(Enseignant, { foreignKey: 'rapporteur_id', as: 'rapporteur' });
    Soutenance.belongsTo(Enseignant, { foreignKey: 'encadrant_academique_id', as: 'encadrantAcademique' });
  }

  if (Encadrant) {
    Soutenance.belongsTo(Encadrant, { foreignKey: 'encadrant_professionnel_id', as: 'encadrantProfessionnel' });
  }
}

module.exports = { Stage, Candidature, Affectation, Soutenance, associate };
