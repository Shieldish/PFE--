const express = require('express');
const Soutenance=require('../model/soutenanceModel')
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');


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
      console.log(req.body)

 
  
      // Vérifier les conflits avec les nouvelles données
      const conflictingData = await checkConflicts(req.body, soutenance.id);
      if (conflictingData.length > 0) {
        console.log('conflictingData :',conflictingData)
        return res.status(200).json({ conflictingData });
      } else {
        return res.status(200).json({ conflictingData: [] });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });


/* async function checkConflicts(data, id) {
  const conflictConditions = [];
  const conflictFields = ['id'];

  // Handle the first condition only if date, time, and salle are all provided and not empty
  if (data.date && data.time && data.salle && data.salle.trim()) {
    conflictConditions.push({ date: data.date, time: data.time.trim(), salle: data.salle.trim() });
    conflictFields.push('date', 'time', 'salle');
  }

  // Add conditions for president, rapporteur, encadrantAcademique, and encadrantProfessionnel
  // These conditions only consider date and the respective role fields

  if (data.date && data.president && data.president.trim()) {
    conflictConditions.push({ date: data.date, president: data.president.trim() });
    conflictFields.push('date', 'president');
  }
  
  if (data.date && data.rapporteur && data.rapporteur.trim()) {
    conflictConditions.push({ date: data.date, rapporteur: data.rapporteur.trim() });
    conflictFields.push('date', 'rapporteur');
  }
  
  if (data.date && data.encadrantAcademique && data.encadrantAcademique.trim()) {
    conflictConditions.push({ date: data.date, encadrantAcademique: data.encadrantAcademique.trim() });
    conflictFields.push('date', 'encadrantAcademique');
  }
  
  if (data.date && data.encadrantProfessionnel && data.encadrantProfessionnel.trim()) {
    conflictConditions.push({ date: data.date, encadrantProfessionnel: data.encadrantProfessionnel.trim() });
    conflictFields.push('date', 'encadrantProfessionnel');
  }

  // If no conditions were added, return an empty array (no conflicts)
  if (conflictConditions.length === 0) {
    return [];
  }

  // Perform the query with the built conditions and return only the fields in conflict
  const conflictingData = await Soutenance.findAll({
    where: {
      id: { [Op.ne]: id },
      [Op.or]: conflictConditions,
    },
    attributes: conflictFields // Return only the conflicting fields
  });

  // Clean the conflicts by removing undefined and empty string values, and trimming strings
  const cleanedConflicts = conflictingData.map(conflict => {
    const cleanedConflict = {};
    for (const key in conflict.dataValues) {
      const value = conflict.dataValues[key];
      if (value !== undefined && value !== '' && typeof value === 'string') {
        cleanedConflict[key] = value.trim();
      } else if (value !== undefined && value !== '') {
        cleanedConflict[key] = value; // Retain non-string values as they are
      }
    }
    return cleanedConflict;
  });

  return cleanedConflicts;
}

 */

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
    if (soutenances[i].date === data.date && 
        soutenances[i].time.trim() === data.time.trim()) {

      // Check for duplicates in 'salle' ignoring empty fields
      if (soutenances[i].salle && data.salle && 
          soutenances[i].salle.trim() === data.salle.trim()) {
        duplicates.push({
          id: soutenances[i].id,
          fields: ['date', 'time', 'salle']
        });
      }

      // Role fields to check
      const roleFields = ['president', 'rapporteur', 'encadrantAcademique', 'encadrantProfessionnel'];
      roleFields.forEach(field => {
        // Check for duplicates in role fields ignoring empty fields
        if (soutenances[i][field] && data[field] && 
            soutenances[i][field].trim() === data[field].trim()) {
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
    console.log(req.body);
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
        if (soutenances[i].date === soutenances[j].date && 
            soutenances[i].time.trim() === soutenances[j].time.trim()) {

            // Check for duplicates in 'salle' ignoring empty fields
            if (soutenances[i].salle && soutenances[j].salle && 
                soutenances[i].salle.trim() === soutenances[j].salle.trim()) {
                duplicates.push({
                    id: soutenances[i].id,
                    fields: ['date', 'time', 'salle']
                });
                duplicates.push({
                    id: soutenances[j].id,
                    fields: ['date', 'time', 'salle']
                });
            }

            const roleFields = ['president', 'rapporteur', 'encadrantAcademique', 'encadrantProfessionnel'];
            roleFields.forEach(field => {
                // Check for duplicates in role fields ignoring empty fields
                if (soutenances[i][field] && soutenances[j][field] && 
                    soutenances[i][field].trim() === soutenances[j][field].trim()) {
                    duplicates.push({
                        id: soutenances[i].id,
                        fields: [field]
                    });
                    duplicates.push({
                        id: soutenances[j].id,
                        fields: [field]
                    });
                }
            });
        }
    }
  }

  res.json({ duplicates });
});


module.exports = router;