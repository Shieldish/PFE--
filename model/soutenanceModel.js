// model/soutenance.js
const { faker } = require('@faker-js/faker');
const { DataTypes } = require('sequelize');
const sequelize = require('./model').sequelize;

const Soutenance = sequelize.define('Soutenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  salle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  groupe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  etudiant1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  etudiant2: {
    type: DataTypes.STRING,
  },
  etudiant3: {
    type: DataTypes.STRING,
  },
  sujet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  president: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rapporteur: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  encadrantAcademique: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  encadrantProfessionnel: {
    type: DataTypes.STRING,
  },
  entreprise: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'soutenance',
  timestamps: true,
});


function getRandomNumber() {
  return Math.floor(Math.random() * 3) + 1;
}


async function generateFakeSoutenances(count =  getRandomNumber()) {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    const soutenances = [];

    for (let i = 0; i < count; i++) {
      const soutenance = {
        date: faker.date.between({ from: '2023-01-01', to: '2024-12-31' }),
        time: faker.date.future().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        salle: faker.location.buildingNumber(),
        groupe: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E']),
        type: faker.helpers.arrayElement(['PFE', 'Stage', 'Projet']),
        etudiant1: faker.person.fullName(),
        etudiant2: Math.random() > 0.5 ? faker.person.fullName() : null,
        etudiant3: Math.random() > 0.2 ? faker.person.fullName() : null,
        sujet: faker.lorem.sentence(),
        president: faker.person.fullName(),
        rapporteur: faker.person.fullName(),
        encadrantAcademique: faker.person.fullName(),
        encadrantProfessionnel: Math.random() > 0.7 ? faker.person.fullName() : null,
        entreprise: Math.random() > 0.6 ? faker.company.name() : null,
      };

      soutenances.push(soutenance);
    }

    await Soutenance.bulkCreate(soutenances);
    console.log(`Successfully created ${count} fake soutenances.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
   
  }
}

// Run the function
generateFakeSoutenances();

module.exports = Soutenance;
