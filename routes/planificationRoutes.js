const express = require('express');
const Soutenance=require('../model/Soutenance')
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
  async function checkConflicts(data, id) {
    const conflictConditions = [];
    const conflictFields = ['id'];
  
    // Add conditions to the array based on the provided data fields
    if (data.date && data.time && data.salle) {
      conflictConditions.push({ date: data.date, time: data.time, salle: data.salle });
      conflictFields.push('date', 'time', 'salle');
    }
    if (data.date && data.president) {
      conflictConditions.push({ date: data.date, president: data.president });
      conflictFields.push('date', 'president');
    }
    if (data.date && data.rapporteur) {
      conflictConditions.push({ date: data.date, rapporteur: data.rapporteur });
      conflictFields.push('date', 'rapporteur');
    }
    if (data.date && data.encadrantAcademique) {
      conflictConditions.push({ date: data.date, encadrantAcademique: data.encadrantAcademique });
      conflictFields.push('date', 'encadrantAcademique');
    }
    if (data.date && data.encadrantProfessionnel) {
      conflictConditions.push({ date: data.date, encadrantProfessionnel: data.encadrantProfessionnel });
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

    const cleanedConflicts = conflictingData.map(conflict => {
      const cleanedConflict = {};
      for (const key in conflict.dataValues) {
        if (conflict.dataValues[key] !== undefined && conflict.dataValues[key] !== '') {
          cleanedConflict[key] = conflict.dataValues[key];
        }
      }
      return cleanedConflict;

    });
    return cleanedConflicts;
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

module.exports = router;