
const bcrypt = require('bcrypt');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../model/model'); // Adjust the path as needed

const UserRegistration = sequelize.define('UserRegistration', {
  UUID: {
    type: DataTypes.STRING,
    allowNull: false
  }, NOM: {
      type: DataTypes.STRING,
      allowNull: false,
      
    },
    PRENOM: {
      type: DataTypes.STRING,
      allowNull: false
    },
   
    EMAIL: {
      type: DataTypes.STRING,
      allowNull: false,
      //unique :true
    },
    PASSWORD: {
      type: DataTypes.STRING,
      allowNull: true
    },
    DEPARTEMENT: {
      type: DataTypes.STRING,
      defaultValue : 'NA'
    
    },
    ADRESS: {
      type: DataTypes.STRING,
      defaultValue : 'NA'
    },
    DATE: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('USER', 'ADMIN'),
    defaultValue: 'USER'
    },
    ISVALIDATED: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    TOKEN:{
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true, 
    hooks: {
      beforeCreate: async (UserRegistration) => {
        if (UserRegistration.PASSWORD) {
          const salt = await bcrypt.genSalt(10); // Removed the second argument
          UserRegistration.PASSWORD = await bcrypt.hash(UserRegistration.PASSWORD, salt); // Used await here
        }
      }
    }
  });
  UserRegistration.prototype.validPassword = function(PASSWORD) {
    return bcrypt.compareSync(PASSWORD, this.PASSWORD);
  };
  

async function syncModel() {
    try {
      
     await UserRegistration.sync({ alter: true });
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


module.exports = UserRegistration
  

