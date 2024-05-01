const session = require('express-session');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const stage=require('../model/stagesModel')
const { candidature, stagepostulation } = require('../model/stagePostulationModel');

const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();



const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use(express.json());



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
      const newStage = await stage.create(stageData);

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

      const allstage = await stage.findAll({ where: { Createdby: entrepriseEmail } });

      if (!allstage || allstage.length === 0) {
          req.flash('info', 'No stage found for the user');
          return res.status(404).end();
      }

      res.json(allstage);
  } catch (error) {
      console.error('Error fetching stage:', error);
      req.flash('error', 'An error occurred while fetching stage data: ' + error.message);
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
      // Fetch stage for the authenticated user
      if(!entrepriseEMAIL){
        req.flash('info', 'the session is lost , reconnect to fetch data  ');
        return res.render('Entreprise', { stages: [] });
      }
      const stages = entrepriseEMAIL ? await stage.findAll({ where: { Createdby: entrepriseEMAIL } }) : [];

      // Convert stage array to JSON
    
      const stageJSON = stages.map(stages => stages.toJSON());

       await  normalizeDate(stageJSON)

      
      // Render the page with the fetched stage
      return res.render('Entreprise', { stages: stageJSON });
  } catch (error) {
      // Handle any errors
      console.error('Error fetching stage:', error);
      req.flash('error', 'An error occurred while fetching stage data: ' + error.message);
    return  res.redirect('/entreprise');
  }
});

router.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Fetch the stage with the given ID
    const stages = await stage.findByPk(id); 

    delete stages.CreatedBy;
    delete stages.CreatedBy;
    delete stages.updatedAt;
    delete stages.createdAt;

    const formattedDateDebut = stages.DateDebut.toISOString().slice(0, 10);
      const formattedDateFin = stages.DateFin.toISOString().slice(0, 10);
    // Render the edit page with the stage data
    return res.render('edit', { data:stages, formattedDateDebut, formattedDateFin });
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
    await stage.destroy({
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

        const existstage= stage.findByPk(id);

        if(!existstage)
        {
          req.flash('error', 'An error occurred while updating stage data: ' + error.message);
          return res.redirect('/entreprise');
        }

        try {
          stage.update(updatedData, {
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
       // hour: '2-digit',postulatedAt
       // minute: '2-digit',
       // second: '2-digit'
    });
}
if (obj.postulatedAt) {
  obj.postulatedAt = new Date(obj.postulatedAt).toLocaleString('fr-FR', { 
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
  });
}
});
}

router.get('/postulant', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let entreprise = req.session.user.EMAIL;

  if (!entreprise) {
    req.flash('error', 'An error occurred while fetching postulant data: ' + error.message);
    return res.status(400).json({ error: 'An error occurred while fetching postulant data' });
  }

  try {
    const postulant = await stagepostulation.findAll({
      where: {
        entrepriseEmail: entreprise
      }
    });

    if (postulant.length == 0) {
      req.flash('error', 'No postulant found');
      return res.status(404).json({ error: 'No postulant found' });
    }

    let postulantJson = postulant.map(postulant => postulant.toJSON());

    await normalizeDate(postulantJson);

    // Assuming postulant is an array of postulant objects
    postulantJson = postulantJson.map(postulantObj => {
      const modifiedPostulant = { ...postulantObj };
      modifiedPostulant.CVPath = `/stockages/${postulantObj.etudiantEmail}/${path.basename(postulantObj.CV)}`; // Construct the CV path
      return modifiedPostulant;
    });

    console.log(postulantJson);

    return res.status(200).json({ postulant: postulantJson });
  } catch (error) {
    console.log(error);
    req.flash('error', 'An error occurred while fetching postulant data: ' + error.message);
    return res.status(500).json({ error: 'An error occurred while fetching postulant data' });
  }
});

router.get('/postulant_detail', async (req, res) => {
  const etudiantEmail = req.query.etudiantEmail;
  const stageId = req.query.stageId;
  try {
      const candidatures = await candidature.findOne({
          where: {
              email: etudiantEmail,
              id: stageId
          }
      });
      /* res.json(candidature); */
      return res.render('postulant_details', { candidature:candidatures });
  } catch (error) {
      // Handle errors
  }
});


router.post('/decision', async (req, res) => {
  try {
      const { decision, stageId, stageEmail } = req.body;

      // Find the stage postulation with the given stageId and stageEmail
      const existingStage = await stagepostulation.findOne({
          where: {
              stageId: stageId,
              etudiantEmail: stageEmail
          }
      });

      // If the stage postulation doesn't exist, return an error
      if (!existingStage) {
          req.flash('error', 'Stage not found');
          return res.status(400).json({ error: 'Stage not found' });
      }

      // Update the decision status of the stage postulation
      const updateDecision = await stagepostulation.update({
          status: decision
      }, {
          where: {
              stageId: stageId,
              etudiantEmail: stageEmail
          }
      });

      // If the decision update fails, return an error
      if (!updateDecision) {
          req.flash('error', 'Decision not updated');
          return res.status(400).json({ error: 'Decision not updated' });
      }

      // Flash success message and redirect to the page showing postulant details
      req.flash('success', 'Decision is updated');
      return res.redirect('/admin/postulant_detail/' + stageEmail);
  } catch (error) {
      // If any error occurs, handle it and return an error response
      req.flash('error', 'Error: ' + error.message);
      return res.status(500).json({ error: 'Error: ' + error.message });
  }
});


module.exports = router;
