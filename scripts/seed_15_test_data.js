'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { enseignant, encadrant, etudiant, entreprise, sequelize } = require('../model/model');
const stage = require('../model/stagesModel');
const { faker } = require('@faker-js/faker');

const COUNT = 15;

const departements = ['Informatique', 'Mathematique', 'Physique', 'Chimie', 'Mecanique', 'Electronique', 'Gestion'];
const specialites = ['Developpement Web', 'Reseaux', 'Data Science', 'Securite', 'IA', 'Cloud', 'DevOps'];
const domaines = ['IT', 'Banque', 'Assurance', 'Logistique', 'Sante', 'Education', 'Energie', 'Telecom'];
const villes = ['Lome', 'Kara', 'Sokode', 'Atakpame', 'Dapaong', 'Mango', 'Tsevie'];
const niveaux = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Ingenieur'];
const experiences = ['Debutant', 'Intermediaire', 'Avance'];
const langues = ['Francais', 'Anglais', 'Allemand'];

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion a la base de donnees reussie');

    // Vider les tables (dans le bon ordre)
    console.log('\n🔄 Suppression des donnees existantes...');
    await stage.destroy({ where: {}, force: true });
    await etudiant.destroy({ where: {}, force: true });
    await enseignant.destroy({ where: {}, force: true });
    await encadrant.destroy({ where: {}, force: true });
    await entreprise.destroy({ where: {}, force: true });

    // 1. Insertion 15 Enseignants
    console.log(`\n📚 Insertion de ${COUNT} enseignants...`);
    const enseignantsData = [];
    for (let i = 1; i <= COUNT; i++) {
      enseignantsData.push({
        EMAIL: `enseignant${i}@university.tg`,
        NOM: faker.person.lastName(),
        PRENOM: faker.person.firstName(),
        SEXE: faker.person.sex(),
        DEPARTEMENT: faker.helpers.arrayElement(departements),
        DATE: faker.date.past().toISOString().split('T')[0]
      });
    }
    await enseignant.bulkCreate(enseignantsData);
    console.log(`✅ ${COUNT} enseignants inseres`);

    // 2. Insertion 15 Encadrants
    console.log(`\n👨‍🏫 Insertion de ${COUNT} encadrants...`);
    const encadrantsData = [];
    for (let i = 1; i <= COUNT; i++) {
      encadrantsData.push({
        EMAIL: `encadrant${i}@university.tg`,
        NOM: faker.person.lastName(),
        PRENOM: faker.person.firstName(),
        SEXE: faker.person.sex(),
        DEPARTEMENT: faker.helpers.arrayElement(departements),
        DATE: faker.date.past().toISOString().split('T')[0]
      });
    }
    await encadrant.bulkCreate(encadrantsData);
    console.log(`✅ ${COUNT} encadrants inseres`);

    // 3. Insertion 15 Etudiants
    console.log(`\n🎓 Insertion de ${COUNT} etudiants...`);
    const etudiantsData = [];
    for (let i = 1; i <= COUNT; i++) {
      etudiantsData.push({
        ID: uuidv4(),
        EMAIL: `etudiant${i}@university.tg`,
        NOM: faker.person.lastName(),
        PRENOM: faker.person.firstName(),
        SEXE: faker.person.sex(),
        DEPARTEMENT: faker.helpers.arrayElement(departements),
        SPECIALITE: faker.helpers.arrayElement(specialites),
        DATE: faker.date.past().toISOString().split('T')[0]
      });
    }
    await etudiant.bulkCreate(etudiantsData);
    console.log(`✅ ${COUNT} etudiants inseres`);

    // 4. Insertion 15 Entreprises
    console.log(`\n🏢 Insertion de ${COUNT} entreprises...`);
    const entreprisesData = [];
    for (let i = 1; i <= COUNT; i++) {
      entreprisesData.push({
        EMAIL: `contact@entreprise${i}.tg`,
        NOM: faker.company.name(),
        DOMAINE: faker.helpers.arrayElement(domaines),
        VILLE: faker.helpers.arrayElement(villes),
        ADDRESSE: faker.location.streetAddress(),
        TELEPHONE: faker.phone.number()
      });
    }
    await entreprise.bulkCreate(entreprisesData);
    console.log(`✅ ${COUNT} entreprises inseres`);

    // 5. Insertion 15 Stages
    console.log(`\n💼 Insertion de ${COUNT} stages...`);
    const stagesData = [];
    for (let i = 1; i <= COUNT; i++) {
      const dateDebut = faker.date.future();
      const dateFin = new Date(dateDebut);
      dateFin.setMonth(dateFin.getMonth() + 3);

      stagesData.push({
        id: uuidv4(),
        created_by: entreprisesData[i-1].EMAIL,
        titre: faker.person.jobTitle(),
        domaine: faker.helpers.arrayElement(domaines),
        nom_entreprise: entreprisesData[i-1].NOM,
        libelle: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(3),
        niveau: faker.helpers.arrayElement(niveaux),
        experience: faker.helpers.arrayElement(experiences),
        langue: faker.helpers.arrayElement(langues),
        postes_vacants: faker.number.int({ min: 1, max: 5 }),
        telephone: faker.phone.number(),
        fax: faker.phone.number(),
        email: entreprisesData[i-1].EMAIL,
        date_debut: dateDebut.toISOString().split('T')[0],
        date_fin: dateFin.toISOString().split('T')[0],
        adresse: entreprisesData[i-1].ADDRESSE,
        rue: faker.location.street(),
        ville: entreprisesData[i-1].VILLE,
        code_postal: faker.location.zipCode(),
        is_active: true
      });
    }
    await stage.bulkCreate(stagesData);
    console.log(`✅ ${COUNT} stages inseres`);

    console.log('\n🎉 TOUTES LES DONNEES DE TEST ONT ETE INSEREES AVEC SUCCES !');
    console.log(`\n📊 Statistiques:`);
    console.log(`   Enseignants: ${await enseignant.count()}`);
    console.log(`   Encadrants:  ${await encadrant.count()}`);
    console.log(`   Etudiants:   ${await etudiant.count()}`);
    console.log(`   Entreprises: ${await entreprise.count()}`);
    console.log(`   Stages:      ${await stage.count()}`);

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Execution
seedDatabase();