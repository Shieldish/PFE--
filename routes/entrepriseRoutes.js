
const express = require('express');
const bodyParser = require('body-parser');
const stage=require('../model/stagesModel')
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const { Op } = require('sequelize');
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
         
         req.flash('error', 'Utilisateur non authentifié');
         return res.redirect('/Entreprise');
        
      }
          console.log(req.session.user)
      // Extract user ID from session
      const createdBy = req.session.user.EMAIL;

      // Extract stage data from request body
      const stageData = req.body;

      // Check if stageData object exists and is not null
      if (!stageData) {
          req.flash('error', 'Les données de scène sont manquantes');
          return res.redirect('/Entreprise');
      }

      // Set CreatedBy field in stage data
      stageData.CreatedBy = createdBy;

      // Save stage data to the database
      const newStage = await stage.create(stageData);

      // Respond with success message and redirect
      req.flash('success', 'Nouvelle étape ajoutée avec succès.');
      return res.redirect('/Entreprise');
  } catch (error) {
      // Handle any errors
      console.error("Erreur lors de l'enregistrement des données de STAGE:", error);
      req.flash('error', 'Une erreur s\'est produite lors de l\'enregistrement des données de STAGE:'+error.message);
      return res.redirect('/Entreprise');
  }
});



router.get('/stages', async (req, res) => {
  try {
      const user = req.session.user;
      if (!user) {
          req.flash('info','Session perdue, veuillez vous reconnecter pour récupérer les données');
          return res.status(401).end();
      }

      const entrepriseEmail = user.EMAIL;

      if (!entrepriseEmail) {
          req.flash('info', 'Session perdue, veuillez vous reconnecter pour récupérer les données');
          return res.status(401).end();
      }

      const allstage = await stage.findAll({ where: { Createdby: entrepriseEmail } });

      if (!allstage || allstage.length === 0) {
          req.flash('info', 'Pas de stage trouvé pour l\'utilisateur');
          return res.status(404).end();
      }

      res.json(allstage);
  } catch (error) {
      console.error('Erreur lors de l\'étape de récupération :', error);
      req.flash('error', 'Une erreur s\'est produite lors de la récupération des données stages : ' + error.message);
      res.status(500).end();
  }
});


router.get('/', async (req, res) => {
  try {
      // Check if the user is authenticated and get their email
      const  user = req.session.user;
         if(!user)
            {
                req.flash('info', 'la session est perdue, reconnectez-vous pour récupérer les données  ');
                return res.render('Entreprise', { stages: [] });
           }

     
      const entrepriseEMAIL=user.EMAIL;
      // Fetch stage for the authenticated user
      if(!entrepriseEMAIL){
        req.flash('info', 'la session est perdue, reconnectez-vous pour récupérer les données ');
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
      req.flash('error', 'Une erreur s\'est produite lors de la récupération des données de Stages: ' + error.message);
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
    return res.render('partial/entrepriseTemplate/edit', { data:stages, formattedDateDebut, formattedDateFin });
  } 
  catch (error) {
    // Handle any errors
    console.error('Error fetching stage:', error);
    req.flash('error','Une erreur s\'est produite lors de la récupération des données stages : ' + error.message);
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
    req.flash('info', `Stage avec  id : ${stageId} Supprimé avec succès`);
    return res.redirect('/entreprise');
  } catch (err) {
    // Send an error response if deletion fails
    console.error('Erreur lors de la suppression du  stage:', err);
    req.flash('error', `Erreur lors de la suppression du stage avec l'identifiant: ${stageId}: ${err.message}`);
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
          req.flash('error', 'Une erreur s\'est produite lors de la mise à jour des données: ' + error.message);
          return res.redirect('/entreprise');
        }

        try {
          stage.update(updatedData, {
            where: {
              id: id
            }
          }).then(function () {
            req.flash('success', 'Stages mise à jour avec succès !');
            return res.redirect('/entreprise');
          });
          
        } catch (error) {
          req.flash('error', 'Une erreur s\'est produite lors de la mise à jour des données:' + error.message);
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
          req.flash('error', 'Stage pas trouvé');
          return res.status(400).json({ error: 'Stage pas trouvé' });
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
          req.flash('error', 'Décision non mise à jour');
          return res.status(400).json({ error: 'Décision non mise à jour' });
      }

      // Flash success message and redirect to the page showing postulant details
      req.flash('success', 'La décision est mise à jour');
      return res.redirect('partial/entrepriseTemplate/postulant_detail' + stageEmail);
  } catch (error) {
      // If any error occurs, handle it and return an error response
      req.flash('error', 'Error: ' + error.message);
      return res.status(500).json({ error: 'Error: ' + error.message });
  }
});

router.get('/postulant_detail', async (req, res) => {
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
          return res.status(404).send('candidature introuvable')
      }
    /*   const modifiedcandidature = {
          ...candidatures.toJSON(),
          cv: `/stockages/${candidatures.email}/${path.basename(
              candidatures.cv
          )}`,
          lettre_motivation: candidatures.lettre_motivation
              ? `/stockages/${candidatures.email}/${path.basename(
                    candidatures.lettre_motivation
                )}`
              : 'document pas fournis',
          releves_notes: candidatures.releves_notes
              ? `/stockages/${candidatures.email}/${path.basename(
                    candidatures.releves_notes
                )}`
              : 'document pas fournis',
      } */

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
     
      return res.render('partial/entrepriseTemplate/postulant_details', {
          candidature: modifiedcandidature,
          stage: stageDataJSON,
      })
  } catch (error) {
      // Handle errors
      console.error(error)
      return res.status(500).send('Internal Server Error')
  }
})


router.get('/postulant', async (req, res) => {


  try {
    const user = req.session.user;
    const entreprise = user.EMAIL;
    if(!entreprise)
    {
      return res.status(401).json({ error: 'Non autorisé' });
    }


    const { search, page = 1, pageSize = 1000, sortBy = 'postulatedAt', sortOrder = 'DESC', filters } = req.query;

    const where = {
      entrepriseEmail: entreprise,
    };

    if (search && search.trim() !== '') {
      where[Op.or] = [
        { etudiantName: { [Op.like]: '%' + search + '%' } },
        { etudiantInstitue: { [Op.like]: '%' + search + '%' } },
        { stageDomaine: { [Op.like]: '%' + search + '%' } },
        { stageSujet: { [Op.like]: '%' + search + '%' } },
        { status: { [Op.like]: '%' + search + '%' } },
      ];
    }

    if (Array.isArray(filters) && filters.length > 0) {
      const filterConditions = filters.map(filter => {
        const [column, value] = filter.split(':');
        return { [column]: { [Op.like]: `%${value}%` } };
      });
      where[Op.or] = filterConditions;
    }

    const order = [[sortBy, sortOrder]];

    const { count, rows: postulant } = await stagepostulation.findAndCountAll({
      where,
      order,
      limit: parseInt(pageSize),
      offset: (page - 1) * parseInt(pageSize),
    });

    const totalPages = Math.ceil(count / parseInt(pageSize));

    // Modify postulant objects as needed
    const postulantJson = postulant.map(postulantObj => ({
      id: postulantObj.id,
      stageId: postulantObj.stageId,
      etudiantID: postulantObj.etudiantID,
      etudiantName: postulantObj.etudiantName,
      etudiantInstitue: postulantObj.etudiantInstitue,
      etudiantEmail: postulantObj.etudiantEmail,
      stageDomaine: postulantObj.stageDomaine,
      stageSujet: postulantObj.stageSujet,
      entrepriseName: postulantObj.entrepriseName,
      entrepriseEmail: postulantObj.entrepriseEmail,
      status: postulantObj.status,
      CV: postulantObj.CV,
      postulatedAt: postulantObj.postulatedAt,
      CVPath: postulantObj.CV
    }));

    //await normalizeDate(postulantJson)
  
    return res.status(200).json({
      totalItems: count,
      totalPages,
      currentPage: page,
      postulant: postulantJson
    });
  } catch (error) {
    console.error('Error fetching postulant data:', error);
    req.flash('error', 'Une erreur s\'est produite lors de la récupération des données du postulant : ' + error.message);
    return res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du postulant : ' + error.message });
  }
});


module.exports = router;


