const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const zlib = require('node:zlib');
const { sequelize } = require('./model');
const Stages=require('./stagesModel');
const { enseignant, encadrant, etudiant } = require('./model');

const { faker } = require('@faker-js/faker');


const stagepostulation = sequelize.define('stagepostulation', {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
  },
  stageId: {
      type: DataTypes.STRING(36),
      allowNull: false,
  },
  etudiantID: {
    type: DataTypes.STRING,
    allowNull: false,
},
  etudiantName: {
    type: DataTypes.STRING,
    allowNull: false,
},

etudiantInstitue: {
  type: DataTypes.STRING,
  allowNull: false,
},

etudiantSection: {
  type: DataTypes.STRING,
  allowNull: false,

},
  etudiantEmail: {
      type: DataTypes.STRING,
      allowNull: false,
     // unique: true, // Ensure uniqueness
  },
  stageDomaine: {
      type: DataTypes.STRING,
      allowNull: false,
  },
  stageSujet: {
      type: DataTypes.STRING,
      allowNull: false,
  },
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
      type: DataTypes.STRING,
      allowNull: true
  },
  postulatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
  }
}, {
  tableName :'stagepostulation',
  timestamps: false
});



const candidature = sequelize.define('candidature', {
  candidatureId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  id: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  niveau_etudes: {
    type: DataTypes.STRING,
    allowNull: false
  },
  institution: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domaine_etudes: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
  annee_obtention: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  experience: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  experience_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('experience_description', compressed);
      } catch (error) {
        console.error('Error compressing experience_description:', error);
      }
    },
    get() {
      try {
        const value = this.getDataValue('experience_description');
        const uncompressed = zlib.inflateSync(Buffer.from(value, 'base64'));
        return uncompressed.toString();
      } catch (error) {
        console.error('Error decompressing experience_description:', error);
        return 'Error decompressing experience_description: '+ error; // Return a default value or handle the error
      }
    }
  },
  // Set and get method for motivation
  motivation: {
    type: DataTypes.TEXT,
    allowNull: true,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('motivation', compressed);
      } catch (error) {
        console.error('Error compressing motivation:', error);
      }
    },
    get() {
      try {
        const value = this.getDataValue('motivation');
        const uncompressed = zlib.inflateSync(Buffer.from(value, 'base64'));
        return uncompressed.toString();
      } catch (error) {
        console.error('Error decompressing motivation:', error);
        return 'Error decompressing motivation:'+ error; // Return a default value or handle the error
      }
    }
  },
  langues: {
    type: DataTypes.STRING,
    allowNull: false
  },
  logiciels: {
    type: DataTypes.STRING,
    allowNull: true
  },
  competences_autres: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  duree_stage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cv: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lettre_motivation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  releves_notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'candidature',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['id', 'email']
    }
  ]
});







(async () => {
  await stagepostulation.sync({ alter: true });
  await candidature.sync({ alter: true }); 
  console.log("Model:stagepostulation , candidature are synced successfully");
})();


module.exports = { candidature, stagepostulation };
