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
    res.render('Planification')
})

module.exports = router;