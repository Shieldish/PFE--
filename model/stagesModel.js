const { DataTypes } = require('sequelize');
const { sequelize } = require('./model');

const { v4: uuidv4 } = require('uuid');
const zlib = require('node:zlib');

const stage = sequelize.define('stage', {
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
  Nom: {
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
    allowNull: false,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('Description', compressed);
      } catch (error) {
        console.error('Error compressing description:', error);
        // Handle the error as needed
      }
    },
    get() {
      try {
        const value = this.getDataValue('Description');
        const uncompressed = zlib.inflateSync(Buffer.from(value, 'base64'));
        return uncompressed.toString();
      } catch (error) {
        console.error('Error decompressing description:', error);
        // Handle the error as needed
        return 'Error decompressing description:'+ error; // Return a default value or handle the error
      }
    }
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
  tableName :'stage',
  timestamps: true
});

// Hook to generate UUID before creating a new stage
stage.beforeCreate((stage, _) => {
  stage.id = uuidv4();
});


// Sync the model with the database using alter method
(async () => {
  await stage.sync({ alter: true }); // This will alter the table to match the model definition
  console.log("Model synced successfully");
})();

module.exports = stage;
