
const express = require('express');
const bodyParser = require('body-parser');
const stage=require('../model/stagesModel')
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const { Op } = require('sequelize');
const router = express.Router();

// [NEW SCHEMA] Import new-schema models for dual-write
const { Stage: NewStage } = require('../model/BusinessModels');
const { Entreprise: NewEntreprise } = require('../model/UserTypeModels');



const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use(express.json());



router.post('/creactionStage', async (req, res) => {
  try {
      // Check if user is logged in and session contains user object
      const user = JSON.parse(req.cookies.user);
      const entreprise = user.EMAIL;

      if (!user || !user.id) {
         
         req.flash('error', 'Utilisateur non authentifié');
         return res.redirect('/Entreprise');
        
      }
        
      // Extract user ID from session
      const createdBy = user.EMAIL;

      // Extract stage data from request body
      const stageData = req.body;

      // Check if stageData object exists and is not null
      if (!stageData) {
          req.flash('error', 'Les données de stages sont manquantes');
          return res.redirect('/Entreprise');
      }

      // Set CreatedBy field in stage data
      stageData.CreatedBy = createdBy;

      // Map form field names (old uppercase) to new DB column names
      const mappedStageData = {
        id: require('uuid').v4(),
        created_by:     createdBy,
        titre:          stageData.Titre || stageData.titre || '',
        domaine:        stageData.Domaine || stageData.domaine || '',
        nom_entreprise: stageData.Nom || stageData.nom_entreprise || '',
        libelle:        stageData.Libelle || stageData.libelle || '',
        description:    stageData.Description || stageData.description || null,
        niveau:         stageData.Niveau || stageData.niveau || '',
        experience:     stageData.Experience || stageData.experience || '',
        langue:         stageData.Langue || stageData.langue || '',
        postes_vacants: parseInt(stageData.PostesVacants || stageData.postes_vacants) || 1,
        telephone:      stageData.Telephone || stageData.telephone || null,
        fax:            stageData.Fax || stageData.fax || null,
        email:          stageData.Email || stageData.email || null,
        email2:         stageData.Email2 || stageData.email2 || null,
        date_debut:     stageData.DateDebut || stageData.date_debut || null,
        date_fin:       stageData.DateFin || stageData.date_fin || null,
        adresse:        stageData.Address || stageData.adresse || null,
        rue:            stageData.Rue || stageData.rue || null,
        ville:          stageData.State || stageData.ville || null,
        code_postal:    stageData.Zip || stageData.code_postal || null,
        is_active:      true,
      };

      // Save stage data to the database (legacy schema)
      const newStage = await stage.create(mappedStageData);

      // [NEW SCHEMA] Also create a record in the new `stage` table linked to the entreprise
      try {
        const entrepriseRecord = await NewEntreprise.findOne({ where: { email: createdBy } });
        if (entrepriseRecord) {
          await NewStage.create({
            entreprise_id: entrepriseRecord.entreprise_id,
            titre: stageData.Titre || stageData.Libelle || null,
            domaine: stageData.Domaine || null,
            description: stageData.Description || null,
            niveau_requis: null, // legacy schema has free-text Niveau; no direct mapping
            experience_requise: stageData.Experience || null,
            langue_requise: stageData.Langue || null,
            postes_vacants: stageData.PostesVacants ? parseInt(stageData.PostesVacants) || 1 : 1,
            date_debut: stageData.DateDebut || null,
            date_fin: stageData.DateFin || null,
            adresse: stageData.Address || stageData.Rue || null,
            ville: stageData.State || null,
            code_postal: stageData.Zip || null,
            contact_email: stageData.Email || stageData.Email2 || createdBy,
            contact_telephone: stageData.Telephone || null,
            is_active: true,
          });
        }
      } catch (newSchemaErr) {
        // New-schema write failure must not break the legacy flow
        console.error('[NEW SCHEMA] Erreur lors de la création du stage (nouveau schéma):', newSchemaErr.message);
      }

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
    const user = JSON.parse(req.cookies.user);
      const entreprise = user.EMAIL;
      if (!user) {
          req.flash('info','Session perdue, veuillez vous reconnecter pour récupérer les données');
          return res.status(401).end();
      }

      const entrepriseEmail = user.EMAIL;

      if (!entrepriseEmail) {
          req.flash('info', 'Session perdue, veuillez vous reconnecter pour récupérer les données');
          return res.status(401).end();
      }

      const allstage = await stage.findAll({ where: { created_by: entrepriseEmail } });

      if (!allstage || allstage.length === 0) {
          req.flash('info', 'Pas de stage trouvé pour l\'utilisateur');
          return res.status(404).end();
      }

      res.json(allstage.map(s => s.toJSON()));
  } catch (error) {
      console.error('Erreur lors de l\'étape de récupération :', error);
      req.flash('error', 'Une erreur s\'est produite lors de la récupération des données stages : ' + error.message);
      res.status(500).end();
  }
});


router.get('/', async (req, res) => {
  try {
      // Check if the user is authenticated and get their email
      const user = JSON.parse(req.cookies.user);
      const entreprise = user.EMAIL;
         if(!user)
            {
                req.flash('info', 'la session est perdue, reconnectez-vous pour récupérer les données  ');
                return res.render('entreprise/index', { stages: [] });
           }

     
      const entrepriseEMAIL=user.EMAIL;
      // Fetch stage for the authenticated user
      if(!entrepriseEMAIL){
        req.flash('info', 'la session est perdue, reconnectez-vous pour récupérer les données ');
        return res.render('entreprise/index', { stages: [] });
      }
      const stages = entrepriseEMAIL ? await stage.findAll({ where: { created_by: entrepriseEMAIL } }) : [];
      const stageJSON = stages.map(s => s.toJSON());
      await normalizeDate(stageJSON);
      return res.render('entreprise/index', { stages: stageJSON });
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

    const formattedDateDebut = (stages.date_debut || stages.DateDebut || new Date()).toString().slice(0, 10);
    const formattedDateFin   = (stages.date_fin   || stages.DateFin   || new Date()).toString().slice(0, 10);
    // Render the edit page with the stage data
    return res.render('entreprise/edit-stage', { data:stages, formattedDateDebut, formattedDateFin });
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
console.log('stageid',stageId)

  try {
    // Example deletion logic using Sequelize with async/await
   const t= await stage.destroy({
      where: {
        id: stageId
      }
    });
    // Send a success response
    console.log(' deleted successfully',t)
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
          return res.status(404).send('candidature introuvable');
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

      return res.render('entreprise/postulant-details', {
          candidature: modifiedcandidature,
          stage: stageDataJSON,
      });
  } catch (error) {
      console.error(error);
      return res.status(500).send('Internal Server Error');
  }
});


router.get('/postulant', async (req, res) => {


  try {
    const user = JSON.parse(req.cookies.user);
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

/* router.post('/deletes/:id', (req, res) => {
  const stageId = req.params.id;

  stage.destroy({ where: { id: stageId } })
    .then(() => res.status(200).send({ success: true }))
    .catch(err => res.status(500).send({ error: 'Failed to delete stage' }));
});



router.delete('/delete1/:id', async (req, res) => {
  const stageId = req.params.id;
  try {
    console.log('id:', stageId);
    await stage.destroy({ where: { id: stageId } });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}); */



module.exports = router;


