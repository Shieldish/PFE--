const session = require('express-session');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const stage=require('../model/stagesModel')
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const { Op } = require('sequelize');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();

router.get('/', async (req,res)=>{
    return res.render('Encadrement')
})


router.get('/AllStages', async (req, res) => {
    try {
        const allStages = await stagepostulation.findAll({
            attributes: { exclude: ['stageId', 'etudiantID'] }
        });
        res.json(allStages);
    } catch (error) {
        console.error('Error fetching all stages:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;