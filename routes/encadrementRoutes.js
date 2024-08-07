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

router.get('/', async (req,res)=>{
    return res.render('Encadrement')
})


router.get('/AllStages', async (req, res) => {
    try {
        const allStages = await stagepostulation.findAll({
            attributes: { exclude: ['', ''] }
        });
      //  res.json(allStages);
        return res.status(200).json({
            postulant: allStages
          });
    } catch (error) {
        console.error('Erreur lors de la récupération de tout stages:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/viewsMoreDetails', async (req, res) => {
    const etudiantEmail = req.query.etudiantEmail // Retrieving from query parameters
    const stageId = req.query.stageId // Retrieving from query parameters
    try {
        let candidatures = await candidature.findOne({
            where: {
                email: etudiantEmail,
                id: stageId,
            },
        })
        if (!candidatures) {
            // Handle the case where no candidature is found
            return res.status(404).send('candidature pas trouvé')
        }
      
        const modifiedcandidature = {
            ...candidatures.toJSON(),
            cv:  candidatures.cv,
            lettre_motivation:  candidatures.lettre_motivation || 'document pas fournis',
            releves_notes: candidatures.releves_notes || 'document pas fournis',
        };
    
  
        const StageData = await stagepostulation.findOne({
            where: {
                stageId: candidatures.id,
                etudiantEmail: candidatures.email,
            },
        })
        const stageDataJSON = StageData.toJSON()
       
        return res.render('partial/encadrementTemplate/viewsMoreDetails', {
            candidature: modifiedcandidature,
            stage: stageDataJSON,
        })
    } catch (error) {
        // Handle errors
        console.error(error)
        return res.status(500).send('Internal Server Error')
    }
  })
  
module.exports = router;