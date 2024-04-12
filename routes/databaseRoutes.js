const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const UserRegistration  = require('../controllers/UserRegistration'); // Import UserRegistration model
const { enseignant, encadrant, etudiant } = require('../model/model');
const util = require('util');
const { exit } = require('process');
const fs = require('fs').promises;

const router = express.Router(); 

// Use bodyParser middleware to parse request bodies
router.use(bodyParser.urlencoded({ extended: true }));


let filteredArrayGlobal
let countGlobal
router.get('/', (req, res) => {
  // Query MySQL for table names
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {

      req.flash('error', 'Error fetching table names');
      return res.render('index', { messages: req.flash() });
     /*  console.error('Error fetching table names:', err);
      res.status(500).send('Error fetching table names');
      return; */
    }
    const tablesToRemove = ['sidebar_items'];
    
    const tables = results.map(row => ({ Tables_in_fss: row[`Tables_in_${connection.config.database}`] }))
      .filter(table => !tablesToRemove.includes(table['Tables_in_fss']));

    // Render the index page with the table names
    res.render('index', { tables });
  });
});
  // Route to handle table selection
  router.get('/:tableName', (req, res) => {
    const tableName = req.params.tableName;
    // Query MySQL for table data
    connection.query(`SELECT * FROM ${tableName}`, (err, results) => {
        if (err) {
          req.flash('error', `Error fetching data from table ${tableName}:`);
          return res.render('crud', { messages: req.flash() });
           /*  console.error(`Error fetching data from table ${tableName}:`, err);
            res.status(500).send('Error fetching data');
            return; */
        }

        let count = results.length;

        // Remove password, token, and date
        const keysToRemove = ['PASSWORD', 'TOKEN','UUID' ];
        const filteredArray = results.map(obj => {
            keysToRemove.forEach(key => delete obj[key]);
            return obj;
        });

        // Format createdAt and updatedAt properties
        filteredArray.forEach(obj => {
            if (obj.createdAt) {
                obj.createdAt = new Date(obj.createdAt).toLocaleString('fr-FR', { 
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            if (obj.updatedAt) {
                obj.updatedAt = new Date(obj.updatedAt).toLocaleString('fr-FR', { 
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            if (obj.DATE) {
              obj.DATE = new Date(obj.DATE).toLocaleString('fr-FR', { 
                  month: 'long',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
              });
          }
        });
        req.flash('success', ` data successfully fetched from table ${tableName}:`);
       // return res.render('crud', { messages: req.flash() });
          filteredArrayGlobal=filteredArray;
          countGlobal=count;
        res.render('crud', { data: filteredArrayGlobal, tableName,count: countGlobal , messages: req.flash()});
    });
});

  router.post('/:tableName/add', async (req, res) => {
    const tableName = req.params.tableName;
    const { EMAIL, ...otherFields } = req.body;
  
    try {
      // Get the Sequelize model based on the table name
      const Model = tableName === 'enseignant' ? enseignant :
                    tableName === 'encadrant' ? encadrant :
                    tableName === 'userregistrations' ? UserRegistration :
                    tableName === 'etudiant' ? etudiant : null;
  
      if (!Model) {
        throw new Error(`Model not found for table ${tableName}`);
      }
      
               if(otherFields.DATE)
               {
                otherFields.DATE= getFormattedDateTime();
               // console.log(otherFields.DATE)
               }
      delete otherFields.createdAt;
      // Create a new instance of the model with the data from the request body
      const newEntry = await Model.create({
        EMAIL,
        ...otherFields
      });
  
      // Redirect the user to the appropriate route after successful creation
      res.redirect(`/gestion/${tableName}`);
    } catch (err) {
      console.error(`Error creating entry in table ${tableName}:`, err);
      res.status(500).send('Error creating entry');
    }
  });

  router.post('/:tableName/update/:email', async (req, res) => {
    const tableName = req.params.tableName;
    const { EMAIL, ...otherFields } = req.body;
  
    try {
      // Get the Sequelize model based on the table name
      const Model = tableName === 'enseignant' ? enseignant :
        tableName === 'encadrant' ? encadrant :
        tableName === 'userregistrations' ? UserRegistration :
        tableName === 'etudiant' ? etudiant : null;
  
      if (!Model) {
        throw new Error(`Model not found for table ${tableName}`);
      }
              
      if(otherFields.DATE)
      {
       otherFields.DATE= getFormattedDateTime();
      
      }
      delete otherFields.createdAt;
      // Update the entry in the table using Sequelize

      await Model.update(otherFields, {
        where: { EMAIL }
      });
  
      // Set the flash message
      req.flash('success', `Data successfully updated in table: ${tableName}`);
  
      // Redirect with the flash message
       res.redirect(`/gestion/${tableName}`,);
     //  res.render('crud', { data: filteredArrayGlobal, tableName,count: countGlobal , messages: req.flash()});
    
    } catch (err) {
      console.error(`Error updating data in table ${tableName}:`, err);
      req.flash('error', 'Error updating entry');
      res.redirect(`/gestion/${tableName}`);
    }
  });

  // Route to handle deleting an entry
  router.get('/:tableName/delete/:email', (req, res) => {
    const tableName = req.params.tableName;
    const email = req.params.email;
  
    // Delete entry from the table
    connection.query(`DELETE FROM ${tableName} WHERE EMAIL=?`, [email], (err, result) => {
      if (err) {
        console.error(`Error deleting data from table ${tableName}:`, err);
        res.status(500).send('Error deleting entry');
        return;
      }
      res.redirect(`/gestion/${tableName}`);
    });
  });
  function getFormattedDateTime() {
    // Get current date and time
    const currentDate = new Date();

    // Extracting individual date components
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Note: January is 0
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    // Formatting date and time
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Returning formatted date and time
    return formattedDateTime;
}

module.exports = router;