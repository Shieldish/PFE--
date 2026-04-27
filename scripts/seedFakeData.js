'use strict';

require('dotenv').config();
const { sequelize } = require('../config/database');
const { stage } = require('../model/stagesModel');
const { Soutenance } = require('../model/soutenanceModel');
const { faker } = require('@faker-js/faker');

// ---------------------------------------------------------------------------
// Fake internship (stage) data
// ---------------------------------------------------------------------------

const domaines = ['Informatique', 'Finance', 'Marketing', 'Génie Civil', 'Électronique', 'Mécanique'];
const niveaux = ['Licence', 'Master', 'Ingénieur', 'Technicien Supérieur'];
const langues = ['Français', 'Anglais', 'Arabe', 'Bilingue'];
const states = [
  'Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte',
  'Nabeul', 'Gabès', 'Ariana', 'Ben Arous', 'Manouba',
];

const fakeDatas = Array.from({ length: 20 }, () => ({
  Titre: faker.person.jobTitle(),
  Domaine: faker.helpers.arrayElement(domaines),
  Niveau: faker.helpers.arrayElement(niveaux),
  Langue: faker.helpers.arrayElement(langues),
  Address: faker.location.streetAddress(),
  State: faker.helpers.arrayElement(states),
  Nom: faker.company.name(),
  Libelle: faker.lorem.sentence(),
  Description: faker.lorem.paragraphs(2),
  Experience: faker.helpers.arrayElement(['Débutant', '1-2 ans', '3-5 ans', '5+ ans']),
  PostesVacants: String(faker.number.int({ min: 1, max: 10 })),
  Telephone: faker.phone.number(),
  Fax: faker.phone.number(),
  Email: faker.internet.email(),
  Email2: faker.internet.email(),
  DateDebut: faker.date.soon({ days: 30 }),
  DateFin: faker.date.soon({ days: 180 }),
  Rue: faker.location.street(),
  Zip: faker.location.zipCode(),
  gridCheck: faker.datatype.boolean(),
  CreatedBy: faker.internet.email(),
}));

async function insertFakeData() {
  await stage.sync({ alter: true });
  await stage.bulkCreate(fakeDatas);
  console.log(`Inserted ${fakeDatas.length} fake stage records.`);
}

// ---------------------------------------------------------------------------
// Fake soutenance data
// ---------------------------------------------------------------------------

const salles = ['Salle A', 'Salle B', 'Salle C', 'Amphi 1', 'Amphi 2'];
const groupes = ['G1', 'G2', 'G3', 'G4'];
const types = ['PFE', 'PFA', 'Stage d\'été'];

async function generateFakeSoutenances() {
  await Soutenance.sync({ alter: true });

  const soutenances = Array.from({ length: 15 }, () => ({
    date: faker.date.soon({ days: 60 }).toISOString().split('T')[0],
    time: `${String(faker.number.int({ min: 8, max: 17 })).padStart(2, '0')}:00:00`,
    salle: faker.helpers.arrayElement(salles),
    groupe: faker.helpers.arrayElement(groupes),
    type: faker.helpers.arrayElement(types),
    etudiant1: faker.person.fullName(),
    etudiant2: faker.datatype.boolean() ? faker.person.fullName() : null,
    etudiant3: faker.datatype.boolean() ? faker.person.fullName() : null,
    sujet: faker.lorem.sentence(),
    president: faker.person.fullName(),
    rapporteur: faker.person.fullName(),
    encadrantAcademique: faker.person.fullName(),
    encadrantProfessionnel: faker.datatype.boolean() ? faker.person.fullName() : null,
    entreprise: faker.datatype.boolean() ? faker.company.name() : null,
  }));

  await Soutenance.bulkCreate(soutenances);
  console.log(`Inserted ${soutenances.length} fake soutenance records.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  try {
    await insertFakeData();
    await generateFakeSoutenances();
    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
