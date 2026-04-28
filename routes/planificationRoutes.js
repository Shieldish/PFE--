const express = require('express');
const Soutenance=require('../model/soutenanceModel')
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { exportData } = require('../controllers/exportController');

// [NEW SCHEMA] Import new schema models for soutenance
const { Soutenance: SoutenanceNew } = require('../model/BusinessModels');
const { Enseignant, Encadrant } = require('../model/UserTypeModels');

router.get('/', async (req, res) => {
    try {
      const soutenances = await Soutenance.findAll();
      res.render('planification/index', { soutenances: soutenances.map(s => s.toJSON()) });
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
      res.status(400).render('pages/404', { error: error.message });
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

      // [NEW SCHEMA] Also write to new soutenance table; failure is isolated
      try {
        const body = req.body;

        // [NEW SCHEMA] Resolve jury member IDs from enseignant/encadrant tables by name
        // Fields from legacy form: president, rapporteur, encadrantAcademique, encadrantProfessionnel
        // These are stored as name strings in the legacy schema — look up IDs in new tables.

        // Helper: find enseignant_id by full name (nom + prenom) or return NULL
        async function resolveEnseignantId(fullName) {
          if (!fullName || fullName.trim() === '') return null;
          const parts = fullName.trim().split(/\s+/);
          if (parts.length < 2) {
            const found = await Enseignant.findOne({ where: { nom: parts[0] } });
            return found ? found.enseignant_id : null;
          }
          const [prenom, ...nomParts] = parts;
          const nom = nomParts.join(' ');
          const found = await Enseignant.findOne({ where: { nom, prenom } })
            || await Enseignant.findOne({ where: { nom: prenom, prenom: nom } });
          return found ? found.enseignant_id : null;
        }

        // Helper: find encadrant_id by full name or return NULL
        async function resolveEncadrantId(fullName) {
          if (!fullName || fullName.trim() === '') return null;
          const parts = fullName.trim().split(/\s+/);
          if (parts.length < 2) {
            const found = await Encadrant.findOne({ where: { nom: parts[0] } });
            return found ? found.encadrant_id : null;
          }
          const [prenom, ...nomParts] = parts;
          const nom = nomParts.join(' ');
          const found = await Encadrant.findOne({ where: { nom, prenom } })
            || await Encadrant.findOne({ where: { nom: prenom, prenom: nom } });
          return found ? found.encadrant_id : null;
        }

        // [NEW SCHEMA] Resolve all jury member IDs (NULL if not found — allowed by schema)
        const [presidentId, rapporteurId, encadrantAcademiqueId, encadrantProfessionnelId] = await Promise.all([
          resolveEnseignantId(body.president),
          resolveEnseignantId(body.rapporteur),
          resolveEnseignantId(body.encadrantAcademique),
          resolveEncadrantId(body.encadrantProfessionnel),
        ]);

        // [NEW SCHEMA] Map legacy type string to new enum value
        const typeMap = { MONOME: 'MONOME', BINOME: 'BINOME', TRINOME: 'TRINOME' };
        const typePresentation = typeMap[(body.type || '').toUpperCase()] || null;

        // [NEW SCHEMA] Parse etudiant names from legacy grouped field (e.g. "Nom Prenom")
        function splitName(fullName) {
          if (!fullName || fullName.trim() === '') return { nom: null, prenom: null };
          const parts = fullName.trim().split(/\s+/);
          if (parts.length === 1) return { nom: parts[0], prenom: null };
          const [prenom, ...nomParts] = parts;
          return { nom: nomParts.join(' '), prenom };
        }

        const etudiant1 = splitName(body.etudiant1);
        const etudiant2 = splitName(body.etudiant2);
        const etudiant3 = splitName(body.etudiant3);

        // [NEW SCHEMA] Create record in new soutenance table
        await SoutenanceNew.create({
          affectation_id: body.affectation_id || null,
          date_soutenance: body.date || null,
          heure_soutenance: body.time || null,
          salle: body.salle || null,
          type_presentation: typePresentation,
          etudiant1_nom: etudiant1.nom,
          etudiant1_prenom: etudiant1.prenom,
          etudiant2_nom: etudiant2.nom || null,
          etudiant2_prenom: etudiant2.prenom || null,
          etudiant3_nom: etudiant3.nom || null,
          etudiant3_prenom: etudiant3.prenom || null,
          president_id: presidentId,
          rapporteur_id: rapporteurId,
          encadrant_academique_id: encadrantAcademiqueId,
          encadrant_professionnel_id: encadrantProfessionnelId,
          sujet: body.sujet || null,
          entreprise_nom: body.entreprise || null,
          notes: null,
        });
      } catch (newSchemaError) {
        // [NEW SCHEMA] Failure in new schema write — log but do not break legacy response
        console.error('[NEW SCHEMA] Erreur lors de la création de la soutenance (nouveau schéma):', newSchemaError);
      }

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