
const bcrypt = require('bcrypt');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../model/model'); // Adjust the path as needed

const user_registration = sequelize.define('user_registration', {
  UUID: {
    type: DataTypes.STRING,
    allowNull: false
  }, 
  EMAIL: {
    type: DataTypes.STRING,
    allowNull: false,
    //unique :true
  },NOM: {
      type: DataTypes.STRING,
      allowNull: false,
      
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
      defaultValue : 'NA'
    
    },
    ADDRESS: {
      type: DataTypes.STRING,
      defaultValue : 'NA'
    },
    DATE: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('USER', 'ADMIN','DEPARTEMENT','ENTREPRISE'),
    defaultValue: 'USER'
    },
    ISVALIDATED: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    TOKEN:{
      type: DataTypes.STRING,
      allowNull: true
    },

    lastEmailSentTime :{
      type: DataTypes.DATE,
     // defaultValue: DataTypes.NOW

    },
    lastEmailResetTime :{
      type: DataTypes.DATE,
     // defaultValue: DataTypes.NOW

    },
    lastEmailResetSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },


  }, {
    timestamps: true, 
    hooks: {
      beforeCreate: async (user_registration) => {
        if (user_registration.PASSWORD) {
          const salt = await bcrypt.genSalt(10); 
          user_registration.PASSWORD = await bcrypt.hash(user_registration.PASSWORD, salt);
        }
      }
    }
  });
  user_registration.prototype.validPassword = function(PASSWORD) {
    return bcrypt.compareSync(PASSWORD, this.PASSWORD);
  };
  

async function syncModel() {
    try {
      
     await user_registration.sync({ alter: true });
    } catch (error) {
      console.error('Error syncing models:', error);
    }
  }
  
  sequelize.sync()
    .then(() => {
      // console.log('Database & tables synced');
    })
    .catch(err => {
      // console.error('Error syncing database:', err);
    });
  

  syncModel();


module.exports = user_registration
  

