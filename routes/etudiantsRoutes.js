const session = require('express-session');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const Stages=require('../model/stagesModel')
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();

const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use(express.json());

router.get('/', (req, res)=>
{
    return res.render('etudiant')
})

router.get('/All', async (req, res) => {
    try {
      const stages = await Stages.findAll();
      res.json(stages);
    } catch (error) {
      // Handle error
      console.error('Error retrieving stages:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


module.exports = router;