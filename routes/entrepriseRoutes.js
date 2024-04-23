// routes.js
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


router.get('/', (req,res)=>{

   return  res.render('Entreprise');
})

router.post('/creactionStage', async (req, res) => {
    try {
      const stageData = req.body;
  
      // Save stage data to the database
      const newStage = await Stages.create(stageData);
  
      // Respond with the created stage data
    
      req.flash('success', 'new stages successfully added.');
     // res.status(201).json(newStage);
     return  res.redirect('/Entreprise');
    } catch (error) {
      // Handle any errors
      console.error("Error saving stage data:", error);
     /*  res.status(500).json({ error: "An error occurred while saving stage data" }); */
      req.flash('error', 'An error occurred while saving stage data '+error);
      return  res.redirect('/Entreprise');
    }

      
  });

  router.get('/stages', async (req, res) => {
    try {
        // Fetch all stages from the database
        const allStages = await Stages.findAll();

        // Send the stages as JSON response
        res.json(allStages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
module.exports = router;
