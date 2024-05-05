const fakeData = Array.from({ length: 2000 }, (_, index) => ({
  stageId: faker.datatype.uuid(),
  etudiantID: faker.datatype.uuid(),
  etudiantName: faker.person.fullName(),
  etudiantInstitue:faker.person.fullName(), // Correct usage of companyName method
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










router.get('/postulant', async (req, res) => {
  const entreprise = 'test.nodemailer.pfe2024@gmail.com';

  try {
    const { search, page = 1, pageSize = 10, sortBy = 'postulatedAt', sortOrder = 'DESC', filters } = req.query;

    const where = {
      entrepriseEmail: entreprise,
      ...(search && {
        [Op.or]: [
          { etudiantName: { [Op.iLike]: `%${search}%` } },
          { etudiantInstitue: { [Op.iLike]: `%${search}%` } },
          { stageDomaine: { [Op.iLike]: `%${search}%` } },
          { stageSujet: { [Op.iLike]: `%${search}%` } },
          { status: { [Op.iLike]: `%${search}%` } },
        ],
      }),
      ...(filters && Object.entries(filters).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {})),
    };

    const order = [[sortBy, sortOrder]];

    let postulant;
    let count;

    if (search === '' || search === undefined) {
      // Fetch all records without applying search
      ({ count, rows: postulant } = await stagepostulation.findAndCountAll({
        where,
        order,
      }));
    } else {
      // Apply search query
      ({ count, rows: postulant } = await stagepostulation.findAndCountAll({
        where,
        order,
      }));
    }

    const postulantJson = postulant.map((postulantObj) => {
      const modifiedPostulant = { ...postulantObj };
      modifiedPostulant.CVPath = `/stockages/${postulantObj.etudiantEmail}/${path.basename(postulantObj.CV)}`;
      return modifiedPostulant;
    });

    const totalItems = postulantJson.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Check if pageSize is a valid positive integer
    const validPageSize = parseInt(pageSize) > 0 ? parseInt(pageSize) : 10;

    const startIndex = (page - 1) * validPageSize;
    const endIndex = startIndex + validPageSize;
    const paginatedPostulants = postulantJson.slice(startIndex, endIndex);

    return res.status(200).json({
      totalItems,
      totalPages,
      currentPage: page,
      postulant: paginatedPostulants,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while fetching postulant data: ' + error.message);
    return res.status(500).json({ error: 'An error occurred while fetching postulant data' + error.message });
  }
});


if (filters && filters.length > 0) {
  filters.forEach(filter => {
    // Map each filter to the corresponding database column
    switch (filter) {
      case 'institute':
        where.etudiantInstitue = { [Op.not]: null };
        break;
      case 'domain':
        where.stageDomaine = { [Op.not]: null };
        break;
      case 'status':
        where.status = { [Op.not]: null };
        break;
      // Add more cases for other filters if needed
    }
  });
}
