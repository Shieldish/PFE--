const { id_ID } = require("@faker-js/faker");

const fakeData = Array.from({ length: 1000 }, (_, index) => ({
  stageId: faker.datatype.uuid(),
  etudiantID: faker.datatype.uuid(),
  etudiantName: faker.person.fullName(),
  etudiantInstitue:faker.helpers.arrayElement(['FSS', 'FSEG', 'ISET','ISIMS','CIC' , 'LSI' ,'LISI','MPSRCC','LFI']),
  etudiantEmail: faker.internet.email(),
  stageDomaine:faker.helpers.arrayElement(['INFORMATIQUE', 'dev', 'web','manager','admin reseau' , 'securité' ,'compteur','dev junior','pro']),
  stageSujet: faker.lorem.words(10),
  entrepriseName: faker.helpers.arrayElement(['Microsoft', 'amazon inc', 'oracle','windows','ibm' ,'facebook','meta', 'google','rockstars','steam','GTA 5']),// Correct usage of companyName method
  entrepriseEmail: faker.helpers.arrayElement(['test.nodemailer.pfe2024@gmail.com', 'gabiam.k.samuel@gmail.com', 'kossisamuel.gabiam@fss.u-sfax.tn']),
  status:  faker.helpers.arrayElement(['a attente', 'accepté', 'refusé']),
  CV: `D:\\PFE--\\stockages\\${faker.internet.userName()}\\${faker.datatype.number()}-candidature.pdf`,
  postulatedAt: faker.date.past(),
}));

// Insert fake data into the database
async function insertFakeData() {
  try {
    await sequelize.sync(); // Sync the model with the database
    await stagepostulation.bulkCreate(fakeData);
    console.log('Fake data inserted successfully.');
  } catch (error) {
    console.error('Error inserting fake data:', error);
  } finally {
   // await sequelize.close(); // Close the database connection
  }
}

// Call the function to insert fake data
insertFakeData();





const { faker } = require('@faker-js/faker');
const fakeDatas = Array.from({ length: 1000 }, (_, index) => ({
  id:faker.datatype.uuid(), 
  Nom:faker.person.jobTitle(),
  Domaine:faker.helpers.arrayElement(['FSS', 'FSEG', 'ISET','ISIMS','CIC' , 'LSI' ,'LISI','MPSRCC','LFI']),
  Email: faker.internet.email(),
  Email2: faker.internet.email(),
  Titre:faker.helpers.arrayElement(['INFORMATIQUE', 'dev', 'web','manager','admin reseau' , 'securité' ,'compteur','dev junior','pro']),
  Nom: faker.lorem.words(2),
  Libelle: faker.lorem.words(5),
 /*  Description: faker.lorem.words(50), */
 Description: faker.random.words(50),
  Niveau:faker.helpers.arrayElement(['lincence', 'master', 'doctora','Ingenieur']),
  Experience:faker.helpers.arrayElement(['0', '1 ans', '2 ans','3 ans',' 4 ans' , '5 ans' ,'6 ans','7  ans','8 ans']),
  PostesVacants: faker.helpers.arrayElement(['5 places', '10 places', '3 places','1 places','2 places', '50 places']),// Correct usage of companyName method
  CreatedBy: faker.helpers.arrayElement(['test.nodemailer.pfe2024@gmail.com', 'gabiam.k.samuel@gmail.com', 'kossisamuel.gabiam@fss.u-sfax.tn']),
  Langue: faker.helpers.arrayElement(['Français', 'Anglais', 'Arabe','Espagnol']),
  DateDebut: faker.date.soon(),
  DateFin: faker.date.future(),
  Zip:faker.number.int(),
  Telephone:faker.phone.number(),
  Fax:faker.phone.imei(),
  Address:faker.location.city(),
  State :faker.location.city(),
  Rue:faker.location.buildingNumber(),
  gridCheck:'1'

}));


async function insertFakeData() {
  try {
    await sequelize.sync(); // Sync the model with the database
    await stage.bulkCreate(fakeDatas);
    console.log('Fake data inserted successfully.');
  } catch (error) {
    console.error('Error inserting fake data:', error);
  } finally {
   // await sequelize.close(); // Close the database connection
  }
}
insertFakeData();
