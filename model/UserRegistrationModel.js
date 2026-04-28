'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

/**
 * UserRegistration model — new schema (database-redesign spec)
 *
 * Maps to the redesigned `user_registration` table with:
 *   - UUID auto-generation via beforeCreate hook
 *   - Password hashing via beforeCreate hook
 *   - validPassword() instance method
 *   - hasOne associations to etudiant, enseignant, encadrant, entreprise
 *
 * Requirements: 10.7
 */
const UserRegistration = sequelize.define('UserRegistration', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  uuid: {
    type: DataTypes.STRING(36),
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('STUDENT', 'TEACHER', 'SUPERVISOR', 'COMPANY', 'ADMIN'),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'user_registration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Generate UUID before creating a new record
UserRegistration.beforeCreate(async (instance) => {
  instance.uuid = uuidv4();
});

// Hash password before creating a new record
UserRegistration.beforeCreate(async (instance) => {
  if (instance.password_hash) {
    const salt = await bcrypt.genSalt(10);
    instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
  }
});

// Instance method to validate a plain-text password against the stored hash
UserRegistration.prototype.validPassword = function (plainPassword) {
  return bcrypt.compareSync(plainPassword, this.password_hash);
};

/**
 * Define associations to user-type profile tables.
 * Each user_registration row has at most one profile per type.
 * The FK on the child side is `user_id`.
 */
function associate(models) {
  const { Etudiant, Enseignant, Encadrant, Entreprise } = models;

  if (Etudiant) {
    UserRegistration.hasOne(Etudiant, { foreignKey: 'user_id', as: 'etudiant' });
  }
  if (Enseignant) {
    UserRegistration.hasOne(Enseignant, { foreignKey: 'user_id', as: 'enseignant' });
  }
  if (Encadrant) {
    UserRegistration.hasOne(Encadrant, { foreignKey: 'user_id', as: 'encadrant' });
  }
  if (Entreprise) {
    UserRegistration.hasOne(Entreprise, { foreignKey: 'user_id', as: 'entreprise' });
  }
}

module.exports = { UserRegistration, associate };
