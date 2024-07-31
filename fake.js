const { faker } = require('@faker-js/faker');
const Soutenance = require('./model/soutenance');
const sequelize = require('./model/model')

async function generateFakeSoutenances(count) {
  const soutenances = [];

  for (let i = 0; i < count; i++) {
    soutenances.push({
      date: faker.date.between({ from: '2024-06-01', to: '2024-06-30' }),
      time: faker.date.anytime().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      salle: faker.helpers.arrayElement(['A9', 'B12', 'C7', 'D3', 'E5']),
      groupe: faker.helpers.arrayElement(['LSI3', 'LSI3 IOT', 'LSI3 IRS', 'LSI3 SLE']),
      type: faker.helpers.arrayElement(['Binome', 'Monome']),
      etudiant1: faker.person.fullName(),
      etudiant2: faker.number.int({ min: 1, max: 10 }) > 3 ? faker.person.fullName() : null,
      etudiant3: faker.number.int({ min: 1, max: 20 }) > 18 ? faker.person.fullName() : null,
      sujet: faker.lorem.sentence(),
      president: faker.person.fullName(),
      rapporteur: faker.person.fullName(),
      encadrantAcademique: faker.person.fullName(),
      encadrantProfessionnel: faker.number.int({ min: 1, max: 10 }) > 5 ? faker.person.fullName() : null,
      entreprise: faker.number.int({ min: 1, max: 10 }) > 5 ? faker.company.name() : null,
    });
  }

  return soutenances;
}

async function insertFakeSoutenances() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    const fakeSoutenances = await generateFakeSoutenances(50);
    await Soutenance.bulkCreate(fakeSoutenances);

    console.log('50 fake soutenances have been inserted successfully.');
  } catch (error) {
    console.error('Unable to connect to the database or insert data:', error);
  } finally {
    await sequelize.close();
  }
}

insertFakeSoutenances();