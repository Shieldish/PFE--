const session = require('express-session');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const Stages=require('../model/stagesModel')
const StagePostulation=require('../model/stagePostulationModel');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();



const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use(express.json());


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
      const user = req.session.user;
      if (!user) {
          req.flash('info', 'Session lost, please reconnect to fetch data');
          return res.status(401).end();
      }

      const entrepriseEmail = user.EMAIL;

      if (!entrepriseEmail) {
          req.flash('info', 'Session lost, please reconnect to fetch data');
          return res.status(401).end();
      }

      const allStages = await Stages.findAll({ where: { Createdby: entrepriseEmail } });

      if (!allStages || allStages.length === 0) {
          req.flash('info', 'No stages found for the user');
          return res.status(404).end();
      }

      res.json(allStages);
  } catch (error) {
      console.error('Error fetching stages:', error);
      req.flash('error', 'An error occurred while fetching stages data: ' + error.message);
      res.status(500).end();
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

       await  normalizeDate(stagesJSON)

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

router.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Fetch the stage with the given ID
    const stage = await Stages.findByPk(id); 

    delete stage.CreatedBy;
    delete stage.CreatedBy;
    delete stage.updatedAt;
    delete stage.createdAt;

    const formattedDateDebut = stage.DateDebut.toISOString().slice(0, 10);
      const formattedDateFin = stage.DateFin.toISOString().slice(0, 10);
    // Render the edit page with the stage data
    return res.render('edit', { data:stage, formattedDateDebut, formattedDateFin });
  } 
  catch (error) {
    // Handle any errors
    console.error('Error fetching stage:', error);
    req.flash('error', 'An error occurred while fetching stage data: ' + error.message);
    return res.redirect('/entreprise');
  }
         
});

router.delete('/delete/:id', async (req, res) => {
  const stageId = req.params.id;
  try {
    // Example deletion logic using Sequelize with async/await
    await Stages.destroy({
      where: {
        id: stageId
      }
    });
    // Send a success response
    console.log(' deleted successfully')
    req.flash('info', `Stage with id : ${stageId} deleted successfully`);
    return res.redirect('/entreprise');
  } catch (err) {
    // Send an error response if deletion fails
    console.error('Error deleting stage:', err);
    req.flash('error', `Error deleting stage with id : ${stageId}: ${err.message}`);
    return res.redirect('/entreprise');
  }
});


router.post('/edit/:id', function (req, res) {
  const id = req.params.id;
  const updatedData = req.body; 
  console.log(updatedData); 

  for (let key in updatedData) {
    if (updatedData[key] === '') {
        delete updatedData[key];
    }
  }

        const existStages= Stages.findByPk(id);

        if(!existStages)
        {
          req.flash('error', 'An error occurred while updating stage data: ' + error.message);
          return res.redirect('/entreprise');
        }

        try {
          Stages.update(updatedData, {
            where: {
              id: id
            }
          }).then(function () {
            req.flash('success', 'Stage updated successfully!');
            return res.redirect('/entreprise');
          });
          
        } catch (error) {
          req.flash('error', 'An error occurred while updating stage data: ' + error.message);
          return res.redirect('/entreprise');
          
        }
});

async function normalizeDate(filteredArray)
{
  filteredArray.forEach(obj => {
    if (obj.createdAt) {
        obj.createdAt = new Date(obj.createdAt).toLocaleString('fr-FR', { 
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    if (obj.updatedAt) {
        obj.updatedAt = new Date(obj.updatedAt).toLocaleString('fr-FR', { 
            month: 'long',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    if (obj.DateDebut) {
      obj.DateDebut = new Date(obj.DateDebut).toLocaleString('fr-FR', { 
          month: 'long',
          day: '2-digit',
          year: 'numeric',
         // hour: '2-digit',
         // minute: '2-digit',
         // second: '2-digit'
      });
  }
  if (obj.DateFin) {
    obj.DateFin = new Date(obj.DateFin).toLocaleString('fr-FR', { 
        month: 'long',
        day: '2-digit',
        year: 'numeric',
       // hour: '2-digit',
       // minute: '2-digit',
       // second: '2-digit'
    });
}
});
}


module.exports = router;
