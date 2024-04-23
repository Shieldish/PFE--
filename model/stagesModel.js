const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./model');

const Stages = sequelize.define('Stages', {
  id: {
    type: DataTypes.STRING(36), // Use DataTypes.UUID instead of DataTypes.STRING
    primaryKey: true,
    allowNull: false,
     defaultValue: DataTypes.UUIDV4  // Generate UUID for new records
  },
  Domaine: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Libelle: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Niveau: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Experience: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Langue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  PostesVacants: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Fax: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Email2: {
    type: DataTypes.STRING,
    allowNull: false
  },
  DateDebut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  DateFin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Rue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  State: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Zip: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gridCheck: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
  ,
  CreatedBy: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  // Add timestamps
  timestamps: true
});

// Hook to generate UUID before creating a new stage
Stages.beforeCreate((Stages, _) => {
  Stages.id = uuidv4();
});

// Sync the model with the database using alter method
(async () => {
  await Stages.sync({ alter: true }); // This will alter the table to match the model definition
  console.log("Model synced successfully");
})();

module.exports = Stages;
