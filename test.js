

const { faker } = require('@faker-js/faker');

const fakeDatas = Array.from({ length: 2 }, (_, index) => {
  const titre = faker.helpers.arrayElement([
    "Software Engineer", "Data Scientist", "UX/UI Designer", "Product Manager", 
    "AI/Machine Learning Engineer", "Cybersecurity Specialist", "Cloud Architect", 
    "Full Stack Developer", "Digital Marketing Specialist", "Financial Analyst", 
    "DevOps Engineer", "Medical Doctor", "Nurse Practitioner", "Pharmacist", 
    "Dentist", "Operations Manager", "Marketing Manager", "Human Resources Manager", 
    "Sales Manager", "Accountant", "Lawyer", "Civil Engineer", "Mechanical Engineer", 
    "Electrical Engineer", "Aerospace Engineer", "Biomedical Engineer", 
    "Environmental Engineer", "Construction Manager", "Architect", "Graphic Designer", 
    "Content Writer", "Video Editor", "Photographer", "Chef", "Restaurant Manager", 
    "Fitness Trainer", "Teacher", "Professor", "Police Officer", "Firefighter", 
    "Paramedic", "Pilot", "Flight Attendant", "Event Planner", "Real Estate Agent", 
    "Social Worker", "Clinical Psychologist"
  ]);

  return {
    id: faker.datatype.uuid(),
    Nom: faker.helpers.arrayElement([
      "Tunisair", "Tunisie Télécom", "Banque Internationale Arabe de Tunisie (BIAT)",
      "Banque de l'Habitat (BH)", "Groupe Délice", "Société Tunisienne de l'Electricité et du Gaz (STEG)",
      "Société Tunisienne des Industries de Pneumatiques (STIP)", "Ooredoo Tunisie", "Orange Tunisie",
      "Tunisie Sucre", "Banque Nationale Agricole (BNA)", "Société Nationale des Chemins de Fer Tunisiens (SNCFT)",
      "Les Ciments de Bizerte", "Groupe Chimique Tunisien (GCT)", "Société des Ciments de Gabès",
      "Société Tunisienne des Marchés de Gros (STMG)", "One Tech Group", "Groupe Loukil",
      "Groupe Poulina", "Leoni Tunisie"
    ]),
    Email: faker.internet.email(),
    Email2: faker.internet.email(),
    Titre: titre,
    Libelle: faker.helpers.arrayElement([
      "Technologies de l'information", "Télécommunications", "Finance et comptabilité",
      "Marketing et communication", "Ressources humaines", "Gestion et administration", "Santé",
      "Éducation et formation", "Ingénierie", "Bâtiment et travaux publics", "Commerce et vente",
      "Tourisme et hôtellerie", "Industrie et fabrication", "Logistique et transport", "Juridique"
    ]),
    Domaine: titre,
    Description: faker.lorem.words({ min: 50, max: 100 }),
    Niveau: faker.helpers.arrayElement(['licence', 'master', 'doctora', 'Ingenieur']),
    Experience: faker.helpers.arrayElement(['0', '1 ans', '2 ans', '3 ans', '4 ans', '5 ans', '6 ans', '7 ans', '8 ans']),
    PostesVacants: faker.helpers.arrayElement(['5 places', '10 places', '3 places', '1 place', '2 places', '50 places']),
    CreatedBy: faker.helpers.arrayElement(['test.nodemailer.pfe2024@gmail.com', 'gabiam.k.samuel@gmail.com', 'kossisamuel.gabiam@fss.u-sfax.tn']),
    Langue: faker.helpers.arrayElement(['Français', 'Anglais', 'Arabe', 'Espagnol']),
    DateDebut: faker.date.soon(),
    DateFin: faker.date.future(),
    Zip: faker.number.int(),
    Telephone: faker.phone.number(),
    Fax: faker.phone.number(),
    Address: faker.helpers.arrayElement(["Ariana", "Beja", "Ben Arous", "Bizerte", "Gabes", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kebili", "Kef", "Mahdia", "Manouba", "Medenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"]),
    State: faker.location.city(),
    Rue: faker.location.buildingNumber(),
    gridCheck: '1'
  };
});


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
 







const { faker } = require('@faker-js/faker');

(async () => {
    try {
      // Connect to the database
      await Soutenance.sequelize.authenticate();
      console.log('Connection to the database has been established successfully.');
  
      // Generate and insert 50 fake records
      for (let i = 0; i < 50; i++) {
        await Soutenance.create({
          date: faker.date.future({ years: 1, refDate: new Date() }).toISOString().split('T')[0], // Generates a future date
          time: faker.date.between({ from: '09:00:00', to: '17:00:00' }).toTimeString().split(' ')[0], // Generates a random time
          salle: faker.helpers.arrayElement(['A9', 'A10', 'A11']), // Randomly selects from a list
          groupe: faker.helpers.arrayElement(['L3S3', 'L3S3 IRS', 'L3S3 IOT']),
          type: faker.helpers.arrayElement(['Binome', 'Monome']),
          etudiant1: faker.person.fullName(),
          etudiant2: faker.datatype.boolean() ? faker.person.fullName() : null, // 50% chance to have a second student
          etudiant3: faker.datatype.boolean() ? faker.person.fullName() : null, // 50% chance to have a third student
          sujet: faker.commerce.productName(), // Placeholder for a subject name
          president: faker.person.fullName(),
          rapporteur: faker.person.fullName(),
          encadrantAcademique: faker.person.fullName(),
          encadrantProfessionnel: faker.datatype.boolean() ? faker.person.fullName() : null, // 50% chance to have a professional supervisor
          entreprise: faker.datatype.boolean() ? faker.company.name() : null, // 50% chance to have an associated company
        });
      }
  
      console.log('50 fake records have been inserted into the Soutenance table.');
    } catch (error) {
      console.error('Error inserting fake records:', error);
    } finally {
      // Close the database connection
      try {
        await Soutenance.sequelize.close();
        console.log('Connection to the database has been closed.');
      } catch (closeError) {
        console.error('Error closing the database connection:', closeError);
      }
    }
  })();
