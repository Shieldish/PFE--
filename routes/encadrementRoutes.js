const session = require('express-session');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const stage=require('../model/stagesModel')
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const { Op } = require('sequelize');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();

// [NEW SCHEMA] Import new schema models for affectation
const { Affectation } = require('../model/BusinessModels');
const { Enseignant, Encadrant } = require('../model/UserTypeModels');

router.get('/', async (req,res)=>{
    return res.render('encadrement/index')
})


router.get('/AllStages', async (req, res) => {
    try {
        const allStages = await stagepostulation.findAll({
            attributes: { exclude: ['', ''] }
        });
        return res.status(200).json({
            postulant: allStages.map(s => s.toJSON())
          });
    } catch (error) {
        console.error('Erreur lors de la récupération de tout stages:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/viewsMoreDetails', async (req, res) => {
    const etudiantEmail = req.query.etudiantEmail;
    const stageId = req.query.stageId;
    try {
        let candidatures = await candidature.findOne({
            where: {
                email: etudiantEmail,
                stage_id: stageId,
            },
        });
        if (!candidatures) {
            return res.status(404).send('candidature pas trouvé');
        }

        const cJson = candidatures.toJSON();
        const modifiedcandidature = {
            ...cJson,
            cv:               cJson.cv_url               || cJson.cv               || null,
            lettre_motivation:cJson.lettre_motivation_url || cJson.lettre_motivation || 'document pas fournis',
            releves_notes:    cJson.releves_notes_url     || cJson.releves_notes     || 'document pas fournis',
        };

        const StageData = await stagepostulation.findOne({
            where: {
                stageId: stageId,
                etudiantEmail: etudiantEmail,
            },
        });
        const stageDataJSON = StageData ? StageData.toJSON() : {};

        return res.render('encadrement/candidature-details', {
            candidature: modifiedcandidature,
            stage: stageDataJSON,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
  });
  
// [NEW SCHEMA] POST /affectation — create or update supervisor assignment in new schema
// Accepts: { candidature_id, enseignant_id (optional), encadrant_id (optional), notes (optional) }
// Also accepts legacy identifiers for backward compatibility.
router.post('/affectation', async (req, res) => {
  const { candidature_id, enseignant_id, encadrant_id, notes } = req.body;

  if (!candidature_id) {
    return res.status(400).json({ error: 'candidature_id est requis' });
  }

  // [NEW SCHEMA] Upsert into new affectation table; failures are isolated
  try {
    const existing = await Affectation.findOne({ where: { candidature_id } });

    // [NEW SCHEMA] Resolve enseignant_id — allow NULL (pending assignment)
    const resolvedEnseignantId = enseignant_id != null && enseignant_id !== '' ? parseInt(enseignant_id, 10) : null;
    // [NEW SCHEMA] Resolve encadrant_id — allow NULL (pending assignment)
    const resolvedEncadrantId = encadrant_id != null && encadrant_id !== '' ? parseInt(encadrant_id, 10) : null;

    if (existing) {
      // [NEW SCHEMA] Update existing affectation record
      await existing.update({
        enseignant_id: resolvedEnseignantId,
        encadrant_id: resolvedEncadrantId,
        notes: notes || existing.notes,
      });
      return res.status(200).json({ message: 'Affectation mise à jour', affectation: existing });
    } else {
      // [NEW SCHEMA] Create new affectation record
      const newAffectation = await Affectation.create({
        candidature_id: parseInt(candidature_id, 10),
        enseignant_id: resolvedEnseignantId,
        encadrant_id: resolvedEncadrantId,
        notes: notes || null,
      });
      return res.status(201).json({ message: 'Affectation créée', affectation: newAffectation });
    }
  } catch (newSchemaError) {
    // [NEW SCHEMA] Failure in new schema write — log but do not break legacy flow
    console.error('[NEW SCHEMA] Erreur lors de la création/mise à jour de l\'affectation:', newSchemaError);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'affectation', details: newSchemaError.message });
  }
});

// [NEW SCHEMA] GET /affectation/:candidature_id — retrieve affectation for a candidature
router.get('/affectation/:candidature_id', async (req, res) => {
  const { candidature_id } = req.params;
  try {
    const affectation = await Affectation.findOne({
      where: { candidature_id },
    });
    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvée' });
    }
    return res.status(200).json({ affectation });
  } catch (err) {
    console.error('[NEW SCHEMA] Erreur lors de la récupération de l\'affectation:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;