const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./model');
const zlib = require('node:zlib');

const stage = sequelize.define('stage', {
  id: {
    type: DataTypes.STRING(36), // Use DataTypes.UUID instead of DataTypes.STRING
    primaryKey: true,
    allowNull: false,
     defaultValue: DataTypes.UUIDV4  // Generate UUID for new records
  },
  Domaine: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Libelle: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false,
    set(value) {
      try {
        const compressed = zlib.deflateSync(value).toString('base64');
        this.setDataValue('Description', compressed);
      } catch (error) {
        console.error('Error compressing description:', error);
        // Handle the error as needed
      }
    },
    get() {
      try {
        const value = this.getDataValue('Description');
        const uncompressed = zlib.inflateSync(Buffer.from(value, 'base64'));
        return uncompressed.toString();
      } catch (error) {
        console.error('Error decompressing description:', error);
        // Handle the error as needed
        return 'Error decompressing description:'+ error; // Return a default value or handle the error
      }
    }
  },
  
  Niveau: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Experience: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Langue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  PostesVacants: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Fax: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Email2: {
    type: DataTypes.STRING,
    allowNull: false
  },
  DateDebut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  DateFin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Rue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  State: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Zip: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gridCheck: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
  ,
  CreatedBy: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  // Add timestamps
  tableName :'stage',
  timestamps: true
});

// Hook to generate UUID before creating a new stage
stage.beforeCreate((stage, _) => {
  stage.id = uuidv4();
});


/* 
const { faker } = require('@faker-js/faker');

const fakeDatas = Array.from({ length: 8 }, (_, index) => {
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
 */







// Sync the model with the database using alter method
(async () => {
  await stage.sync({ alter: true }); // This will alter the table to match the model definition
  console.log("Model synced successfully");
})();

module.exports = stage;
