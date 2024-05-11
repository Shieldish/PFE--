const fakeData = Array.from({ length: 300 }, (_, index) => ({
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