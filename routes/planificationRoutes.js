const express = require('express');
const Soutenance=require('../model/soutenanceModel')
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { exportData } = require('../controllers/exportController');

router.get('/', async (req, res) => {
    try {
      const soutenances = await Soutenance.findAll();
      //console.log( 'soutenance data : ',soutenances)

      res.render('Planification', { soutenances : soutenances});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/soutenances/:id', async (req, res) => {
    try {
      const soutenance = await Soutenance.findByPk(req.params.id);
      if (!soutenance) {
        return res.status(404).json({ error: 'Soutenance introuvable' });
      }
  
      // Mettre à jour la soutenance avec les nouvelles données
      await soutenance.update(req.body);
    /*   console.log(req.body) */

 
  
      // Vérifier les conflits avec les nouvelles données
      const conflictingData = await checkConflicts(req.body, soutenance.id);
      if (conflictingData.length > 0) {
      /*   console.log('conflictingData :',conflictingData) */
        return res.status(200).json({ conflictingData });
      } else {
        return res.status(200).json({ conflictingData: [] });
      }
    } catch (error) {
   /*    res.status(400).json({ error: error.message }); */
      res.status(400).render('404.ejs', { error: error.message });
    }
  });



async function checkConflicts(data, id) {
  const duplicates = [];

  // Fetch all soutenances except the one being updated
  const soutenances = await Soutenance.findAll({
    where: {
      id: { [Op.ne]: id }
    }
  });

  // Loop through all soutenances and compare
  for (let i = 0; i < soutenances.length; i++) {
    // Only compare with the provided data (similar to soutenances[j])
    if (
      soutenances[i].date.toLowerCase() === data.date.toLowerCase() && 
      soutenances[i].time.trim().toLowerCase() === data.time.trim().toLowerCase()
    ) {

      // Check for duplicates in 'salle' ignoring empty fields
      if (
        soutenances[i].salle &&
        data.salle &&
        soutenances[i].salle.trim().toLowerCase() === data.salle.trim().toLowerCase()
      ) {
        duplicates.push({
          id: soutenances[i].id,
          fields: ['date', 'time', 'salle']
        });
      }

      // Role fields to check
      const roleFields = ['president', 'rapporteur', 'encadrantAcademique', 'encadrantProfessionnel'];
      roleFields.forEach(field => {
        // Check for duplicates in role fields ignoring empty fields
        if (
          soutenances[i][field] &&
          data[field] &&
          soutenances[i][field].trim().toLowerCase() === data[field].trim().toLowerCase()
        ) {
          duplicates.push({
            id: soutenances[i].id,
            fields: [field]
          });
        }
      });
    }
  }

  return duplicates;
}

  router.post('/Addsoutenances', async (req,res)=>{
   /*  console.log(req.body); */
    try {
      const newSoutenance = await Soutenance.create(req.body);
      res.status(201).json(newSoutenance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })


  router.delete('/soutenances/:id', async (req, res) => {
    try {
      const id = req.params.id;
      
      // Find the soutenance by ID
      const soutenance = await Soutenance.findByPk(id);
      
      // Check if the soutenance exists
      if (!soutenance) {
        return res.status(404).json({ error: 'Soutenance non trouvée' });
      }
  
      // Delete the soutenance
      await soutenance.destroy();
      
      // Send a success response
      res.status(200).json({ message: 'Soutenance supprimée avec succès' });
    } catch (error) {
      console.error('Error deleting soutenance:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la soutenance' });
      
    }
  });


  router.get('/get-soutenances', (req, res) => {
    // Fetch all soutenances from the database
    Soutenance.findAll()
        .then(soutenances => {
            res.json({ soutenances });
        })
        .catch(error => {
            console.error('Error fetching soutenances:', error);
            res.status(500).send('Server error');
        });
});



router.post('/validate-soutenances', (req, res) => {
  const soutenances = req.body.soutenances;
  let duplicates = [];

  // Perform checks for duplicate dates, times, and salles
  for (let i = 0; i < soutenances.length; i++) {
    for (let j = i + 1; j < soutenances.length; j++) {
      if (
        soutenances[i].date.toLowerCase() === soutenances[j].date.toLowerCase() &&
        soutenances[i].time.trim().toLowerCase() === soutenances[j].time.trim().toLowerCase()
      ) {

        // Check for duplicates in 'salle' ignoring empty fields
        if (
          soutenances[i].salle &&
          soutenances[j].salle &&
          soutenances[i].salle.trim().toLowerCase() === soutenances[j].salle.trim().toLowerCase()
        ) {
          duplicates.push({
            id: soutenances[i].id,
            fields: ['date', 'time', 'salle'],
          });
          duplicates.push({
            id: soutenances[j].id,
            fields: ['date', 'time', 'salle'],
          });
        }

        const roleFields = ['president', 'rapporteur', 'encadrantAcademique', 'encadrantProfessionnel'];
        roleFields.forEach((field) => {
          // Check for duplicates in role fields ignoring empty fields
          if (
            soutenances[i][field] &&
            soutenances[j][field] &&
            soutenances[i][field].trim().toLowerCase() === soutenances[j][field].trim().toLowerCase()
          ) {
            duplicates.push({
              id: soutenances[i].id,
              fields: [field],
            });
            duplicates.push({
              id: soutenances[j].id,
              fields: [field],
            });
          }
        });
      }
    }
  }

  res.json({ duplicates });
});



router.post('/export', exportData);





module.exports = router;