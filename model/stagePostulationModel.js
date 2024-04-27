const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./model');
const Stages=require('./stagesModel');
const { enseignant, encadrant, etudiant } = require('./model');

const StagePostulation = sequelize.define('StagePostulation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    stageId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: Stages, // Use the model itself, not a string
        key: 'id'
      }
    },
    etudiantEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: etudiant, // Use the model itself, not a string
        key: 'EMAIL'
      }
    } ,
       StageDomaine: {
      type: DataTypes.STRING,
      allowNull: false,
    
    },
    stageSujet: {
      type: DataTypes.STRING,
      allowNull: false,
    
    }
    ,

    entrepriseName: {
      type: DataTypes.STRING,
      allowNull: false,
    
    },
    entrepriseEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    
    },
  
    status: {
      type: DataTypes.ENUM('a attente', 'accepté', 'refusé'),
      allowNull: false,
      defaultValue: 'a attente'
    },
    CV: {
      type: DataTypes.BLOB,
      allowNull: true
    },
    postulatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false
  });
  // Define associations
/*   StagePostulation.belongsTo(Stages, { foreignKey: 'stageId' });
  StagePostulation.belongsTo(etudiant, { foreignKey: 'etudiantEmail' }); */
Stages.hasMany(StagePostulation, { foreignKey: 'stageId' });
StagePostulation.belongsTo(Stages, { foreignKey: 'stageId' });

etudiant.hasMany(StagePostulation, { foreignKey: 'etudiantEmail' });
StagePostulation.belongsTo(etudiant, { foreignKey: 'etudiantEmail' });


sequelize.sync({ alter: true })
  .then(() => {
    console.log('Tables have been synced');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });


  module.exports = StagePostulation;