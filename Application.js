const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Stages = require('./stages');
const Etudiant = require('./etudiant');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // possible values: 'pending', 'accepted', 'rejected'
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resume: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

Application.associate = (models) => {
  Application.belongsTo(models.Stages, {
    foreignKey: 'stageId',
    as: 'stage',
  });

  Application.belongsTo(models.Etudiant, {
    foreignKey: 'etudiantEmail',
    as: 'etudiant',
  });
};

module.exports = Application;











const StagePostulation = sequelize.define('StagePostulation', {
    // No need for an additional id field as Sequelize will create one by default
    StageId: {
      type: DataTypes.STRING(36), // Same data type as Stages.id
      allowNull: false,
      references: {
        model: 'Stages',
        key: 'id'
      }
    },
    EtudiantEmail: {
      type: DataTypes.STRING, // Same data type as etudiant.EMAIL
      allowNull: false,
      references: {
        model: 'etudiant',
        key: 'EMAIL'
      }
    },
    // You can add additional fields to this table to store information about the postulation, 
    // such as the date the student applied, their application status (pending, accepted, rejected), etc.
    Status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ApplicationDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    // Add timestamps if needed
    timestamps: true
  });
  