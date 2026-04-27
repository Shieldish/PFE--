'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const user_registration = sequelize.define('user_registration', {
  UUID: {
    type: DataTypes.STRING,
    allowNull: false
  },
  EMAIL: {
    type: DataTypes.STRING,
    allowNull: false
  },
  NOM: {
    type: DataTypes.STRING,
    allowNull: false
  },
  PRENOM: {
    type: DataTypes.STRING,
    allowNull: false
  },
  PASSWORD: {
    type: DataTypes.STRING,
    allowNull: true
  },
  DEPARTEMENT: {
    type: DataTypes.STRING,
    defaultValue: 'NA'
  },
  ADDRESS: {
    type: DataTypes.STRING,
    defaultValue: 'NA'
  },
  DATE: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN', 'DEPARTEMENT', 'ENTREPRISE'),
    defaultValue: 'USER'
  },
  ISVALIDATED: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  TOKEN: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastEmailSentTime: {
    type: DataTypes.DATE
  },
  lastEmailResetTime: {
    type: DataTypes.DATE
  },
  lastEmailResetSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
});

user_registration.prototype.validPassword = function (PASSWORD) {
  return bcrypt.compareSync(PASSWORD, this.PASSWORD);
};

user_registration.beforeCreate(async (instance) => {
  if (instance.PASSWORD) {
    const salt = await bcrypt.genSalt(10);
    instance.PASSWORD = await bcrypt.hash(instance.PASSWORD, salt);
  }
});

async function syncUserModel() {
  await user_registration.sync({ alter: true });
}

module.exports = { user_registration, syncUserModel };
