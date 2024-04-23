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


/* router.get('/', (req,res)=>{
     let stages=[];
   return  res.render('Entreprise', { stages: stages });
}) */

router.post('/creactionStage', async (req, res) => {
  try {
      // Check if user is logged in and session contains user object
      if (!req.session.user || !req.session.user.id) {
         
         req.flash('error', 'User not authenticated');
         return res.redirect('/Entreprise');
        
      }
          console.log(req.session.user)
      // Extract user ID from session
      const createdBy = req.session.user.EMAIL;

      // Extract stage data from request body
      const stageData = req.body;

      // Check if stageData object exists and is not null
      if (!stageData) {
          req.flash('error', 'Stage data is missing');
          return res.redirect('/Entreprise');
      }

      // Set CreatedBy field in stage data
      stageData.CreatedBy = createdBy;

      // Save stage data to the database
      const newStage = await Stages.create(stageData);

      // Respond with success message and redirect
      req.flash('success', 'New stage successfully added.');
      return res.redirect('/Entreprise');
  } catch (error) {
      // Handle any errors
      console.error("Error saving stage data:", error);
      req.flash('error', 'An error occurred while saving stage data :'+error.message);
      return res.redirect('/Entreprise');
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
       /*  res.status(500).json({ error: 'Internal server error' }); */
       req.flash('error', 'An error occurred while fetching stages data '+error);
    }
});
router.get('/', async (req, res) => {
  try {
      // Check if the user is authenticated and get their email
      const  user = req.session.user;
         if(!user)
            {
                req.flash('info', 'the session is lost , reconnect to fetch data  ');
                return res.render('Entreprise', { stages: [] });
           }

     
      const entrepriseEMAIL=user.EMAIL;
      // Fetch stages for the authenticated user
      if(!entrepriseEMAIL){
        req.flash('info', 'the session is lost , reconnect to fetch data  ');
        return res.render('Entreprise', { stages: [] });
      }
      const stages = entrepriseEMAIL ? await Stages.findAll({ where: { Createdby: entrepriseEMAIL } }) : [];

      // Convert stages array to JSON
    
      const stagesJSON = stages.map(stage => stage.toJSON());
      console.log(stagesJSON)
      // Render the page with the fetched stages
      return res.render('Entreprise', { stages: stagesJSON });
  } catch (error) {
      // Handle any errors
      console.error('Error fetching stages:', error);
      req.flash('error', 'An error occurred while fetching stages data: ' + error.message);
    return  res.redirect('/entreprise');
  }
});

router.get('/edit_stages/:id', async (req, res) => {
         
});




module.exports = router;
