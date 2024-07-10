const { id_ID } = require("@faker-js/faker");
const { faker } = require('@faker-js/faker');
const fakeData = Array.from({ length: 100 }, (_, index) => ({
  stageId: faker.datatype.uuid(),
  etudiantID: faker.datatype.uuid(),
  etudiantName: faker.person.fullName(),
  etudiantInstitue:faker.helpers.arrayElement(['FSS', 'FSEG', 'ISET','ISIMS','CIC' , 'LSI' ,'LISI','MPSRCC','LFI']),
  etudiantEmail: faker.helpers.arrayElement(['test.nodemailer.pfe2024@gmail.com', 'gabiam.k.samuel@gmail.com', 'kossisamuel.gabiam@fss.u-sfax.tn']),
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

const fakeDatas = Array.from({ length: 30 }, (_, index) => {
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



<div class="card custom-card mycontainer" >
<div class="card-header">
   <button class="btn btn-success btn-block "disabled><strong>User Information</strong></button>
</div>
<div class="card-body">
   <hr width="100%" size="5">
   <p ><strong>ID :</strong> <strong><%= userData.UUID.toUpperCase() %></strong></p>
   <p ><strong>FIRST NAME :</strong><strong class="text-uppercase "  style="color: green;">  <%= userData.NOM %></strong></p>
   <p ><strong>LAST NAME :</strong><strong class="text-uppercase " style="color: green;">  <%= userData.PRENOM %></strong> </p>
   <p ><strong>EMAIL ADDRESS :</strong> <strong class="text-uppercase " style="color:green;">  <%= userData.EMAIL %></strong></p>
   <p ><strong>DEPARTMENT :</strong><strong style="color: black">  <%= userData.DEPARTEMENT %></strong> </p>
   <p ><strong>ADDRESS :</strong><strong style="color: black">  <%= userData.ADDRESS %></strong> </p>
   <p ><strong>BIRTHDAY DATE :</strong><strong style="color: black">
      <% if (userData.DATE) { %>
      <%= userData.DATE.toLocaleString('fr-FR', { month: 'long', day: '2-digit', year: 'numeric' }) %>
      <% } else { %>
      NA
      <% } %>
      </strong>
   </p>
   <hr width="100%" size="5">
   <p ><strong>ACCOUNT TYPE :</strong><strong style="color: rgb(208, 39, 30)">  <%= userData.role %></strong> </p>
   <p ><strong>VALIDITY :</strong><strong style="color: red;">  <%= userData.ISVALIDATED ? 'Yes' : 'No' %></strong> </p>
   <p ><strong>CREATED :</strong><strong style="color:blue">  <%= userData.createdAt.toLocaleString('fr-FR', { month: 'long', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) %></strong> </p>
   <p ><strong>UPDATED :</strong><strong style="color: blue;">  <%= userData.updatedAt.toLocaleString('fr-FR', { month: 'long', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })%></strong> </p>
   <!-- Add more fields as needed -->
</div>
</div>