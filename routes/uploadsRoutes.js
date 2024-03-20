const express = require('express');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');
const bodyParser = require('body-parser');
const { getDataFromTable, getAllTablesAndStructure } = require('../model/model');
const unidecode = require('unidecode');
const connection = require ('../model/dbConfig')

const router = express.Router();

// Middleware
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Initialize multer
const uploadFolder = 'Uploads';
const uploadFolderPath = path.join(__dirname,  '..', uploadFolder);
if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}
const upload = multer({ dest: uploadFolderPath });


let data=[]
let items=[]


/* router.get('/upload', (req, res) => {
    getAllTablesAndStructure()
        .then(tablesStructure => {
            items=tablesStructure ;
           console.log('items from upload : ',items);
          return  res.render('uploads', {dt:data, items: tablesStructure });
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send('Error occurred while fetching tables and their structures');
        });
});
 */

router.get('/upload', (req, res) => {
  // Assuming you have a MySQL connection named 'connection' already established

  // Query MySQL for table names
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error fetching table names:', err);
      return res.status(500).send('Error fetching table names');
    }

    const tables = {};

    // Function to get the structure for each table
    const getTableStructure = (tableName) => {
      return new Promise((resolve, reject) => {
        connection.query(`DESCRIBE ${tableName}`, (err, columns) => {
          if (err) {
            reject(err);
            return;
          }
          const columnNames = columns.map(column => column.Field);
          resolve(columnNames);
        });
      });
    };

    // Fetch table structures in parallel
    const tableStructurePromises = results.map(row => {
      const tableName = row[`Tables_in_${connection.config.database}`];
      return getTableStructure(tableName).then(columns => {
        tables[tableName] = columns;
      });
    });

    Promise.all(tableStructurePromises)
      .then(() => {
        items=tables

        // res.render('index', { tables });
 
        return res.render('uploads', {dt:data, items: items });
      })
      .catch(err => {
        console.error('Error fetching table structures:', err);
        res.status(500).send('Error fetching table structures');
      });
  });
});

router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
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
                data=transformedRow
                return transformedRow;
            });
           // res.render('uploads', {dt:data, items: items });
            return res.render('uploads', { dt: excelData , items : items });
           
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
                    data=csvData
                })
                .on('end', () => {
                 // res.render('uploads', {dt:data, items: items });
                  return res.render('uploads', { dt: csvData ,items: items });
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
  let d = Data;

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

    // Handle data insertion based on the specified options
    if (Options === '1') {
      // Insert new data only
      for (const item of d) {
        try {
          const query = 'INSERT INTO ?? SET ?';
          await connection.query(query, [TableName, item]);
        } catch (error) {
          // Log error for debugging
          console.error('Error inserting data:', error);
          // Send appropriate error response to client
          res.status(500).json({ error: 'Internal server error. Failed to insert data.' });
          return;
        }
      }
      // Send success response to client
      res.status(200).json({ message: 'Data inserted successfully.' });
    } else if (Options === '2') {
      // Insert new data and update existing data
      for (const item of d) {
        const query = 'INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?';
        try {
          await connection.query(query, [TableName, item, item]);
        } catch (error) {
          // Log error for debugging
          console.error('Error inserting/updating data:', error);
          // Send appropriate error response to client
          res.status(500).json({ error: 'Internal server error. Failed to insert/update data.' });
          return;
        }
      }
      // Send success response to client
      res.status(200).json({ message: 'Data inserted and updated successfully.' });
    }
  } catch (error) {
    // Log error for debugging
    console.error('Error saving data to database:', error);
    // Send appropriate error response to client
    res.status(500).json({ error: 'Internal server error.' });
  }
});

 

  router.get('/upload', (req, res) => { 
    console.log('items from uploads', items)
    res.render('uploads',{dt : data, items:items });
});

router.get('/pages/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  // Define data for each page dynamically
  let data = {};
  
   if (pageName === 'uploads') {
    data = { dt: data, items: items };
    ejs.renderFile(`views/uploads.ejs`, data,{items: items},{ layout: 'layouts/main', sidebar: true }, (err, html) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.send(html);
  });

  }  else if (pageName === 'etudiant') {
   
    ejs.renderFile(`views/etudiant.ejs`,{ layout: 'layouts/main', sidebar: true }, (err, html) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.send(html);
  });

  } 
  
  
  else {
    // Handle unknown page names
    console.error('Unknown page:');
    return res.status(404).send('Page not found');
  }
  
  // Render the EJS file with dynamic data
  
});

module.exports = router;
