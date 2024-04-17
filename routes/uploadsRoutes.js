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
const connection = require ('../model/dbConfig')

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

router.get('/upload', (req, res) => {
  getAllTablesAndStructure()
    .then(tablesStructure => {
      // List of table names you want to exclude
      const excludedTables = ['userregistrations','sidebar_items','UserRegistrations'];

      // Filter out the excluded table names
      const filteredTablesStructure = Object.fromEntries(
        Object.entries(tablesStructure).filter(([tableName]) => !excludedTables.includes(tableName))
      );

      items = filteredTablesStructure;
     // console.log('items from upload : ', items);

      return res.render('uploads', { dt: data, items: filteredTablesStructure ,fileName:fileName});
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).send('Error occurred while fetching tables and their structures');
    });
});

 

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  let fileName = req.file.originalname;

  if (!file) {
      return res.status(400).send('No file uploaded.');
  }

  // Check file type synchronously
  const fileType = path.extname(file.originalname).toLowerCase();
  if (fileType !== '.xlsx' && fileType !== '.csv') {
      return res.status(400).send('Unsupported file format. Please upload an Excel file (xlsx) or CSV file.');
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
                  return res.status(500).send('Error while processing file.');
              });
      }
  } catch (err) {
      console.error('Error:', err);
      return res.status(500).send('Error while processing file.');
  }
});


router.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body;

  //console.log(Data, Options, TableName);

  try {
    // Check if TableName is missing
    if (!TableName) {
      res.status(400).json({ error: 'Table name is required.' });
      return;
    }

    // Check if Options is missing or invalid
    if (Options !== '1' && Options !== '2') {
      res.status(400).json({ error: 'Invalid Options value. Use 1 or 2.' });
      return;
    }

    // Get the model for the specified table
    const Model = sequelize.models[TableName];

    if (!Model) {
      res.status(404).json({ error: `Table "${TableName}" not found.` });
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
    
        console.log(`${result.length} rows inserted successfully.`);
        await transaction.commit();
        res.status(200).json({ message: 'Data inserted successfully.' });
      } catch (error) {
        // Handle other errors, if any
        await transaction.rollback();
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal server error. Failed to insert data.' });
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
        res.status(200).json({ message: 'Data inserted and updated successfully.' });
      } catch (error) {
        await transaction.rollback();
        console.error('Error inserting/updating data:', error);
        res.status(500).json({ error: 'Internal server error. Failed to insert/update data.' });
      }
    }
  } catch (error) {
    console.error('Error saving data to database:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

  router.get(['/','/upload'], (req, res) => { 

   

    res.render('uploads',{dt : data, items:items ,fileName:fileName });
});



module.exports = router;
