const express = require('express');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');
const bodyParser = require('body-parser');
const {sequelize,   enseignant,  etudiant ,getDataFromTable, getAllTablesAndStructure } = require('../model/model');
const unidecode = require('unidecode');


const router = express.Router();

// Middleware
router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// Initialize multer
const uploadFolder = 'Uploads';
const uploadFolderPath = path.join(__dirname,  '..', uploadFolder);
if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}
const upload = multer({ dest: uploadFolderPath });


let data=[]
let items=[]
let fileName;

router.get('/upload', async (req, res) => {
  try {
    const tablesStructure = await getAllTablesAndStructures();
    console.log('Raw tables structure:', tablesStructure);
    
    if (!tablesStructure) {
      throw new Error('Failed to retrieve tables structure');
    }

    // List of table names you want to exclude
    const excludedTables = ['user_registrations', 'sidebar_items', 'stage', 'stagepostulation', 'candidature'];
    
    // Filter out the excluded table names
    const filteredTablesStructure = Object.fromEntries(
      Object.entries(tablesStructure).filter(([tableName]) => !excludedTables.includes(tableName))
    );

    console.log('Filtered tables structure:', filteredTablesStructure);

    // Render the page with the filtered table structure
    res.render('uploads', { items: filteredTablesStructure, dt: data, fileName: fileName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Une erreur s\'est produite lors de la récupération des tables et de leurs structures: ' + error.message);
  }
});




router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  let fileName = req.file.originalname;

  if (!file) {
      return res.status(400).send('Aucun fichier téléchargé.');
  }

  // Check file type synchronously
  const fileType = path.extname(file.originalname).toLowerCase();
  if (fileType !== '.xlsx' && fileType !== '.csv') {
      return res.status(400).send('Format de fichier non pris en charge. Veuillez télécharger un fichier Excel (xlsx) ou un fichier CSV.');
  }

  try {
      // Read and process file asynchronously
      if (fileType === '.xlsx') {
          // Read Excel file
          const workbook = await xlsx.readFile(file.path);
          // Convert first sheet to JSON
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          let excelData = xlsx.utils.sheet_to_json(worksheet);
          // Apply unidecode to keys
          excelData = excelData.map((row) => {
              const transformedRow = {};
              for (const key in row) {
                  if (row.hasOwnProperty(key)) {
                      const newKey = unidecode(key).replace(/[^\w\s]/gi, ''); // Remove special characters and convert accented characters
                      transformedRow[newKey] = row[key];
                  }
              }
              return transformedRow;
          });
          const rowCount = excelData.length;
          fileName += `: ${rowCount} Rows`;
          return res.render('uploads', { dt: excelData, items: items, fileName: fileName });
      } else if (fileType === '.csv') {
          // Read CSV file asynchronously
          const csvData = [];
          fs.createReadStream(file.path, { encoding: 'latin1' })
              .pipe(csvParser())
              .on('data', (row) => {
                  const transformedRow = {};
                  for (const key in row) {
                      if (row.hasOwnProperty(key)) {
                          const newKey = unidecode(key).replace(/[^\w\s]/gi, ''); // Remove special characters and convert accented characters
                          transformedRow[newKey] = row[key];
                      }
                  }
                  csvData.push(transformedRow);
              })
              .on('end', () => {
                  const rowCount = csvData.length;
                  fileName += `: ${rowCount} Rows`;
                  return res.render('uploads', { dt: csvData, items: items, fileName: fileName });
              })
              .on('error', (err) => {
                  console.error('Error:', err);
                  return res.status(500).send('Erreur lors du traitement du fichier. ',err);
              });
      }
  } catch (err) {
      console.error('Error:', err);
      return res.status(500).send('Erreur lors du traitement du fichier ',err);
  }
});


router.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body;

  //console.log(Data, Options, TableName);

  try {
    // Check if TableName is missing
    if (!TableName) {
      res.status(400).json({ error: 'Le nom de la table est obligatoire.' });
      return;
    }

    // Check if Options is missing or invalid
    if (Options !== '1' && Options !== '2') {
      res.status(400).json({ error: 'Valeur d\'options non valide. Utilisez-en 1 ou 2.' });
      return;
    }

    // Get the model for the specified table
    const Model = sequelize.models[TableName];

    if (!Model) {
      res.status(404).json({ error: `Table "${TableName}" n'est pas trouvé.` });
      return;
    }

    // Handle data insertion based on the specified options
    if (Options === '1') {
      // Insert new data only
      const transaction = await sequelize.transaction();
    
      try {
        const result = await Model.bulkCreate(Data, {
          transaction,
          ignoreDuplicates: true, // Ignore duplicate entry errors
        });
    
        console.log(`${result.length}lignes insérées avec succès.`);
        await transaction.commit();
        res.status(200).json({ message: 'Données insérées avec succès.' });
      } catch (error) {
        // Handle other errors, if any
        await transaction.rollback();
        console.error('Erreur lors de l\'insertion des données :', error);
        res.status(500).json({ error: 'Erreur interne du serveur. Échec de l\'insertion des données.' });
      }
    } else if (Options === '2') {
      // Insert new data and update existing data
      const transaction = await sequelize.transaction();
    
      try {
        await Promise.all(
          Data.map(async (item) => {
            const [result, created] = await Model.findOrCreate({
              where: { EMAIL: item.EMAIL }, // Use the unique key condition here
              defaults: item,
              transaction,
             // ignoreDuplicates: true, // Ignore duplicate entry errors
            });
    
            if (!created) {
              await result.update(item, { transaction });
            }
          })
        );
    
        await transaction.commit();
        res.status(200).json({ message: 'Données insérées et mises à jour avec succès.' });
      } catch (error) {
        await transaction.rollback();
        console.error('Erreur lors de l\'insertion/mise à jour des données :', error);
        res.status(500).json({ error: 'Erreur interne du serveur. Échec de l\'insertion/mise à jour des données.' });
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données dans la base de données :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

  router.get(['/','/upload'], (req, res) => { 

   

    res.render('uploads',{dt : data, items:items ,fileName:fileName });
});


async function getAllTablesAndStructures() {
  try {
    const tablesAndColumns = await sequelize.query(`
      SELECT table_name AS "TABLE_NAME", column_name AS "COLUMN_NAME"
      FROM information_schema.columns
      WHERE table_schema = :databaseName;
    `, {
      replacements: { databaseName: sequelize.config.database },
      type: sequelize.QueryTypes.SELECT
    });

  /*   console.log('tablesAndColumns:', tablesAndColumns); */

    if (!Array.isArray(tablesAndColumns) || tablesAndColumns.length === 0) {
      throw new Error('No tables and columns found');
    }

    const tablesStructure = {};
    tablesAndColumns.forEach(row => {
      const { TABLE_NAME, COLUMN_NAME } = row;
      if (!tablesStructure[TABLE_NAME]) {
        tablesStructure[TABLE_NAME] = [];
      }
      tablesStructure[TABLE_NAME].push(COLUMN_NAME);
    });
/*   
    console.log('Tables structure:', tablesStructure); */

    // You can proceed to filter out any unwanted tables here if necessary
    const excludedTables = ['user_registrations', 'sidebar_items', 'stage', 'stagepostulation', 'candidature'];
    const filteredTablesStructure = Object.fromEntries(
      Object.entries(tablesStructure).filter(([tableName]) => !excludedTables.includes(tableName))
    );

    /* console.log('Filtered tables structure:', filteredTablesStructure); */

    return filteredTablesStructure;
  } catch (error) {
    console.error('Error fetching tables structure:', error);
    return null;
  }
}



module.exports = router;
