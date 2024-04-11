const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const util = require('util');
const { exit } = require('process');
const fs = require('fs').promises;

const router = express.Router(); 

// Use bodyParser middleware to parse request bodies
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
  // Query MySQL for table names
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error fetching table names:', err);
      res.status(500).send('Error fetching table names');
      return;
    }
    const tablesToRemove = ['sidebar_items'];
    
    const tables = results.map(row => ({ Tables_in_fss: row[`Tables_in_${connection.config.database}`] }))
      .filter(table => !tablesToRemove.includes(table['Tables_in_fss']));

    console.log(tables);

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
        console.error(`Error fetching data from table ${tableName}:`, err);
        res.status(500).send('Error fetching data');
        return;
      }
      let count=results.length
      
      //remove password , token , and date :  
      const keysToRemove = ['PASSWORD', 'TOKEN',];
      const filteredArray = results.map(obj => {
        keysToRemove.forEach(key => delete obj[key]);
        return obj;
      });

      res.render('crud', { data: filteredArray, tableName, count  });
    });
  });
  
  
  // Route to handle form submission for creating a new entry
  router.post('/:tableName/add', (req, res) => {
    const tableName = req.params.tableName;
    const { EMAIL, ...otherFields } = req.body;
  
    // Extract column names from the request body keys
    const columns = Object.keys(otherFields);
  
    // Construct the SQL query dynamically
    const sql = `INSERT INTO ${tableName} (EMAIL, ${columns.join(', ')}) VALUES (?, ${Array(columns.length).fill('?').join(', ')})`;
  
    // Extract values from otherFields
    const values = [EMAIL, ...columns.map(column => otherFields[column])];
  
    // Insert new entry into the table
    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error(`Error inserting data into table ${tableName}:`, err);
        res.status(500).send('Error creating entry');
        return;
      }
      res.redirect(`/gestion/${tableName}`);
    });
  });
  

  // Route to handle form submission for updating an existing entry
  router.post('/:tableName/update/:email', (req, res) => {
    const tableName = req.params.tableName;
    const email = req.params.email;
    const { EMAIL, ...otherFields } = req.body;

    // Extract column names from the request body keys
    const columns = Object.keys(otherFields);

    // Construct the SQL query dynamically
    const sql = `UPDATE ${tableName} SET ${columns.map(column => `${column} = ?`).join(', ')} WHERE EMAIL = ?`;

    // Extract values from otherFields
    const values = [...columns.map(column => otherFields[column]), email];

    // Update the entry in the table
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error(`Error updating data in table ${tableName}:`, err);
            res.status(500).send('Error updating entry');
            return;
        }
        res.redirect(`/gestion/${tableName}`);
    });
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


module.exports = router;