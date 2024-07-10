const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const  {connection } = require('../model/dbConfig');
const { sequelize, DataTypes, etudiant } = require('../model/model');
const { Op } = require('sequelize');
const flash = require('connect-flash');
require('dotenv').config();
const stage = require('../model/stagesModel');
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { isAdmin, isUser } = require('../middlewares/roles');
const user_registration = require('../controllers/UserRegistration');
const router = express.Router();
const jwt = require('jsonwebtoken');

const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(flash());
app.use(bodyParser.json());
app.use(express.json());

router.get('/', (req, res)=>
{
    return res.render('etudiant')
})

router.get('/All', async (req, res) => {
    try {
      const { search, sortBy, sortOrder, page, limit, ...filters } = req.query;
      const options = {
        where: filters,
        order: sortBy && sortOrder ? [[sortBy, sortOrder]] : undefined,
        offset: page && limit ? (page - 1) * limit : 0,
        limit: limit ? parseInt(limit) : undefined,
      };
  
      if (search) {
        options.where = {
          ...options.where,
          [Op.or]: [
            // Add search conditions for relevant fields here
            { Domaine: { [Op.like]: `%${search}%` } },
            { Nom: { [Op.like]: `%${search}%` } },
            { Titre: { [Op.like]: `%${search}%` } },
            { Niveau: { [Op.like]: `%${search}%` } },
            { Libelle: { [Op.like]: `%${search}%` } },
            { Description: { [Op.like]: `%${search}%` } },
            { State: { [Op.like]: `%${search}%` } },
            // Add more search conditions as needed
          ],
        };
      }
  
      const { count, rows } = await stage.findAndCountAll(options);
      const totalPages = limit ? Math.ceil(count / limit) : 1;
  
      res.json({
        stages: rows,
        pagination: {
          currentPage: page ? parseInt(page) : 1,
          totalPages,
          totalItems: count,
        },
      });
    } catch (error) {
      console.error('Error retrieving stage:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
/* router.get('/All', async (req, res) => {
    try {
      const stages = await stage.findAll();
      res.json(stages);
    } catch (error) {
      // Handle error
      console.error('Error retrieving stage:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
   */


router.get('/postuler/', async (req , res)=>{
  
    res.render('home');
  
})


const uploadFolder = 'stockages';
const uploadFolderPath = path.join(__dirname, '..', uploadFolder);

// Create the main upload folder if it doesn't exist
if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}

// Multer disk storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const studentEmail = req.body.email; // Get the student's email from the request body
        const studentFolderPath = path.join(uploadFolderPath, studentEmail);

        // Create a folder for the student if it doesn't exist
        if (!fs.existsSync(studentFolderPath)) {
            fs.mkdirSync(studentFolderPath);
        }

        cb(null, studentFolderPath); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Generate unique filenames
    }
});

// Configure multer with the disk storage
const upload = multer({ storage: storage });

/* router.post('/postulates/:id', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'lettre_motivation', maxCount: 1 },
  { name: 'releves_notes', maxCount: 1 }
]), async (req, res) => {
  const t = await sequelize.transaction();
  const id = req.params.id;

  try {
      // Extract form data from request body
      const {
          nom,
          prenom,
          date_naissance,
          adresse,
          telephone,
          email,
          niveau_etudes,
          institution,
          domaine_etudes,
          section,
          annee_obtention,
          experience,
          experience_description,
          motivation,
          langues,
          logiciels,
          competences_autres,
          date_debut,
          duree_stage
      } = req.body;

      // Extract file paths from request files
      const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
      const lettrePath = req.files['lettre_motivation'] ? req.files['lettre_motivation'][0].path : null;
      const relevesPath = req.files['releves_notes'] ? req.files['releves_notes'][0].path : null;


      console.log( "Verificateur :",req.body , cvPath,lettrePath,relevesPath)

      // Find the stage by ID
      const stages = await stage.findByPk(id);

      if (!stages) {
          return res.status(404).json({ error: 'Stage not found' });
      }

      // Create a new instance of the candidature model
      const candidatures = await candidature.create({
          id,
          nom,
          prenom,
          date_naissance,
          adresse,
          telephone,
          email,
          niveau_etudes,
          institution,
          domaine_etudes,
          section,
          annee_obtention,
          experience,
          experience_description,
          motivation,
          langues,
          logiciels,
          competences_autres,
          date_debut,
          duree_stage,
          cv: cvPath,
          lettre_motivation: lettrePath,
          releves_notes: relevesPath
      }, { transaction: t });

      // Retrieve or determine etudiantID
      let etudiantID;
      const etudiantData = await etudiant.findOne({ where: { EMAIL: email }, attributes: ['ID'] });
      if (etudiantData) {
          etudiantID = etudiantData.ID;
      } else {
          const userRegistrationData = await user_registration.findOne({ where: { EMAIL: email }, attributes: ['UUID'] });
          if (userRegistrationData) {
              etudiantID = userRegistrationData.UUID;
          } else {
              console.error('No record found for the provided email');
              return res.status(404).json({ error: 'No record found for the provided email' });
          }
      }

      // Create the stage postulation entry
      const stagepostulations = await stagepostulation.create({
          stageId: id,
          etudiantID: etudiantID,
          etudiantName: `${nom} ${prenom}`,
          etudiantEmail: email,
          etudiantSection: `${niveau_etudes} : ${section}`,
          etudiantInstitue: institution,
          stageDomaine: stages.Domaine,
          stageSujet: stages.Libelle,
          entrepriseName: stages.Nom,
          entrepriseEmail: stages.CreatedBy,
          CV: cvPath
      }, { transaction: t });

      // Commit the transaction
      await t.commit();

      // Send success response
      return res.status(200).json({ message: 'Candidature submitted successfully' });

  } catch (err) {
      // Rollback the transaction in case of error
      await t.rollback();
      console.error('Error submitting candidature:', err);
      return res.status(500).json({ error: `An error occurred while submitting the candidature: ${err.message}` });
  }
}); */
router.post('/postulates/:id', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'lettre_motivation', maxCount: 1 },
  { name: 'releves_notes', maxCount: 1 }
]), async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction();

    const id = req.params.id;

    // Extract form data from request body
    const {
      nom,
      prenom,
      date_naissance,
      adresse,
      telephone,
      email,
      niveau_etudes,
      institution,
      domaine_etudes,
      section,
      annee_obtention,
      experience,
      experience_description,
      motivation,
      langues,
      logiciels,
      competences_autres,
      date_debut,
      duree_stage
    } = req.body;

    // Extract file paths from request files
    const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
    const lettrePath = req.files['lettre_motivation'] ? req.files['lettre_motivation'][0].path : null;
    const relevesPath = req.files['releves_notes'] ? req.files['releves_notes'][0].path : null;

    // Find the stage by ID
    const stages = await stage.findByPk(id, { transaction: t });

    if (!stages) {
      await t.rollback();
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Create a new instance of the candidature model
    const candidatures = await candidature.create({
      id,
      nom,
      prenom,
      date_naissance,
      adresse,
      telephone,
      email,
      niveau_etudes,
      institution,
      domaine_etudes,
      section,
      annee_obtention,
      experience,
      experience_description,
      motivation,
      langues,
      logiciels,
      competences_autres,
      date_debut,
      duree_stage,
      cv: cvPath,
      lettre_motivation: lettrePath,
      releves_notes: relevesPath
    }, { transaction: t });

    // Retrieve or determine etudiantID
    let etudiantID;
    const etudiantData = await etudiant.findOne({ where: { EMAIL: email }, attributes: ['ID'], transaction: t });
    if (etudiantData) {
      etudiantID = etudiantData.ID;
    } else {
      const userRegistrationData = await user_registration.findOne({ where: { EMAIL: email }, attributes: ['UUID'], transaction: t });
      if (userRegistrationData) {
        etudiantID = userRegistrationData.UUID;
      } else {
        await t.rollback();
        console.error('No record found for the provided email');
        return res.status(404).json({ error: 'No record found for the provided email' });
      }
    }

    // Create the stage postulation entry
    const stagepostulations = await stagepostulation.create({
      stageId: id,
      etudiantID: etudiantID,
      etudiantName: `${nom} ${prenom}`,
      etudiantEmail: email,
      etudiantSection: `${niveau_etudes} : ${section}`,
      etudiantInstitue: institution,
      stageDomaine: stages.Domaine,
      stageSujet: stages.Libelle,
      entrepriseName: stages.Nom,
      entrepriseEmail: stages.CreatedBy,
      CV: cvPath
    }, { transaction: t });

    // Commit the transaction
    await t.commit();

    // Send success response
    return res.status(200).json({ message: 'Candidature submitted successfully' });

  } catch (err) {
    // Rollback the transaction in case of error
    if (t) await t.rollback();

    console.error('Error submitting candidature:', err);
    return res.status(500).json({ error: `An error occurred while submitting the candidature: ${err.message}` });
  }
});

router.post('/postulate/:id', upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'lettre_motivation', maxCount: 1 },
    { name: 'releves_notes', maxCount: 1 }
]), async (req, res) => {
    const t = await sequelize.transaction();
    const id = req.params.id;
    try {
        // Get the form data
        const {
            nom,
            prenom,
            date_naissance,
            adresse,
            telephone,
            email,
            niveau_etudes,
            institution,
            domaine_etudes,
            section,
            annee_obtention,
            experience,
            experience_description,
            motivation,
            langues,
            logiciels,
            competences_autres,
            date_debut,
            duree_stage
        } = req.body;


        // Get the file paths
        const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
        const lettrePath = req.files['lettre_motivation'] ? req.files['lettre_motivation'][0].path : null;
        const relevesPath = req.files['releves_notes'] ? req.files['releves_notes'][0].path : null;

        const stages = await stage.findByPk(id);

            console.log(stages)
            console.log(req.body)
            console.log(req.files)

      
        if (!stages) {
            req.flash('error', 'Stage not found');
            return res.redirect(`/etudiant/postulate/${id}`);
        }

        // Create a new instance of the candidature model
        const candidatures = await candidature.create({
            id,
            nom,
            prenom,
            date_naissance,
            adresse,
            telephone,
            email,
            niveau_etudes,
            institution,
            domaine_etudes,
            section,
            annee_obtention,
            experience,
            experience_description,
            motivation,
            langues,
            logiciels,
            competences_autres,
            date_debut,
            duree_stage,
            cv: cvPath,
            lettre_motivation: lettrePath,
            releves_notes: relevesPath
        }, { transaction: t });

        let etudiantID;
        const etudiantData = await etudiant.findOne({ where: { EMAIL: email }, attributes: ['ID'] });
        if (etudiantData) {
            etudiantID = etudiantData.ID;
        } else {
            const userRegistrationData = await user_registration.findOne({ where: { EMAIL: email }, attributes: ['UUID'] });
            if (userRegistrationData) {
                etudiantID = userRegistrationData.UUID;
            } else {
                // Handle the case when no record is found for the email
                // For example, you can throw an error or set a default value
                console.error('No record found for the provided email');
                // throw new Error('No record found for the provided email');
                // etudiantID = someDefaultValue;
            }
        }
        
        const stagepostulations = await stagepostulation.create({
            stageId: id,
            etudiantID: etudiantID,
            etudiantName: `${nom} ${prenom}`,
            etudiantEmail: email,
            etudiantSection: `${niveau_etudes} : ${section}`,
            etudiantInstitue: institution,
            stageDomaine: stages.Domaine,
            stageSujet: stages.Libelle,
            entrepriseName: stages.Nom,
            entrepriseEmail: stages.CreatedBy,
            CV: cvPath
        }, { transaction: t });
        

        await t.commit();

        req.flash('success', 'candidature submitted successfully');
        return res.redirect(`/etudiant`);
    } catch (err) {
        await t.rollback();
        console.error('Error submitting candidature:', err);
        req.flash('error', `An error occurred while submitting the candidature: ${err.message}`);
        return res.redirect(`/postulate/${id}`);
    }
});



router.get('/check-email', async (req, res) => {
    const email = req.query.email;
    const stageId = req.query.stageId;

    try {
        // Check if there is a stage with the given stageId and etudiantEmail
        const stage = await stagepostulation.findOne({
            where: {
                stageId: stageId,
                etudiantEmail: email
            }
        });
               console.log("Stage existe",stage)
        // If stage is found, it means the email already exists for that stage
        if (stage) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/stage_postuler', async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const etudiants = req.session.user.EMAIL; 
     
  
      if (!etudiants) {
        req.flash('error', 'An error occurred while fetching postulated data');
        return res.status(400).json({ error: 'An error occurred while fetching postulated data' });
      }
  
     

      let etudiantID = await etudiant.findOne({ where: { EMAIL: etudiants }, attributes: ['ID'] });
      if (!etudiantID) {
          etudiantID = await user_registration.findOne({ where: { EMAIL: etudiants }, attributes: ['UUID'] });
      }
  
      if (!etudiantID) {
        req.flash('error', 'An error occurred while fetching postulated data');
        return res.status(400).json({ error: 'An error occurred while fetching postulated data' });
      }
  
      const etudiantIdValue = etudiantID.ID ? etudiantID.ID : etudiantID.UUID;
      console.log(etudiantIdValue);
  
   const postulated = await stagepostulation.findAll({
        where: {
          etudiantID: etudiantIdValue
        },
        order: [['postulatedAt', 'DESC']] // Sorting by postulatedAt in descending order
      });
    
  
      if (postulated.length === 0) {
       // req.flash('info', 'No postulated found');
        return res.status(404).json({ error: 'No postulated found' });
      }
  
      let postulatedJson = postulated.map(postulated => postulated.toJSON());
  
      await normalizeDate(postulatedJson);
  
      postulatedJson = postulatedJson.map(postulatedObj => {
        const modifiedpostulated = { ...postulatedObj };
        modifiedpostulated.CVPath = `/stockages/${postulatedObj.etudiantEmail}/${path.basename(postulatedObj.CV)}`;
        return modifiedpostulated;
      });
  
      console.log(postulatedJson);
  
      return res.status(200).json({ postulant: postulatedJson });
    } catch (error) {
      console.log(error);
      req.flash('error', 'An error occurred while fetching postulated data: ' + error.message);
      return res.status(500).json({ error: 'An error occurred while fetching postulated data' });
    }
  }); 


  router.get('/stage_postuler2', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
  
      console.log('Authorization Header:', authHeader);
  
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const token = authHeader.split(' ')[1];
  
      console.log('JWT Token:', token);
  
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const JWT_SECRET = process.env.secretKey; // Ensure this matches the environment variable in your .env file
  
      let etudiants;
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        etudiants = decoded.email;
        req.userId = decoded.userId;
        req.role=decoded.role
        console.log('Decoded Email:',etudiants);
        console.log('userId',  req.userId);
        console.log('role',req.role)
      } catch (err) {
        console.error('JWT Verification Error:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      // Now check the value of 'etudiants' to ensure it's valid before querying the database
      if (!etudiants) {
        return res.status(401).json({ error: 'Invalid token. Email not found in decoded token.' });
      }
  
      const etudiantID = await etudiant.findOne({ where: { EMAIL: etudiants }, attributes: ['ID'] }) ||
                         await user_registration.findOne({ where: { EMAIL: etudiants }, attributes: ['UUID'] });
  
      if (!etudiantID) {
        return res.status(400).json({ error: 'An error occurred while fetching postulated data' });
      }
  
      const etudiantIdValue = etudiantID.ID ? etudiantID.ID : etudiantID.UUID;
      console.log('Etudiant ID:', etudiantIdValue);
  
      const postulated = await stagepostulation.findAll({
        where: {
          etudiantID: etudiantIdValue
        },
        order: [['postulatedAt', 'DESC']] // Sorting by postulatedAt in descending order
      });
  
      if (postulated.length === 0) {
        return res.status(404).json({ error: 'No postulated found' });
      }
  
      let postulatedJson = postulated.map(postulated => postulated.toJSON());
  
      await normalizeDate(postulatedJson);
  
      postulatedJson = postulatedJson.map(postulatedObj => {
        const modifiedpostulated = { ...postulatedObj };
        modifiedpostulated.CVPath = `/stockages/${postulatedObj.etudiantEmail}/${path.basename(postulatedObj.CV)}`;
        return modifiedpostulated;
      });
  
      console.log('Postulated Data:', postulatedJson);
  
      return res.status(200).json({ postulant: postulatedJson });
    } catch (error) {
      console.error('Error fetching postulated data:', error);
      return res.status(500).json({ error: 'An error occurred while fetching postulated data' });
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
router.get('/candidatures', async (req, res) => {
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
          return res.status(404).send('candidature not found')
      }
      const modifiedcandidature = {
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
      }

      const StageData = await stagepostulation.findOne({
          where: {
              stageId: candidatures.id,
              etudiantEmail: candidatures.email,
          },
      })
      const stageDataJSON = StageData.toJSON()
      return res.render('candidatures', {
          candidature: modifiedcandidature,
          stage: stageDataJSON,
      })
  } catch (error) {
      // Handle errors
      console.error(error)
      return res.status(500).send('Internal Server Error')
  }
})


router.get('/candidatures2', async (req, res) => {
  const etudiantEmail = req.query.etudiantEmail; // Retrieving from query parameters
  const stageId = req.query.stageId; // Retrieving from query parameters
  
  try {
      let candidatures = await candidature.findOne({
          where: {
              email: etudiantEmail,
              id: stageId,
          },
      });

      if (!candidatures) {
          return res.status(404).json({ error: 'Candidature not found' });
      }

      const modifiedcandidature = {
          ...candidatures.toJSON(),
          cv: `/stockages/${candidatures.email}/${path.basename(candidatures.cv)}`,
          lettre_motivation: candidatures.lettre_motivation
              ? `/stockages/${candidatures.email}/${path.basename(candidatures.lettre_motivation)}`
              : 'document pas fournis',
          releves_notes: candidatures.releves_notes
              ? `/stockages/${candidatures.email}/${path.basename(candidatures.releves_notes)}`
              : 'document pas fournis',
      };

      const StageData = await stagepostulation.findOne({
          where: {
              stageId: candidatures.id,
              etudiantEmail: candidatures.email,
          },
      });

      if (!StageData) {
          return res.status(404).json({ error: 'Stage data not found' });
      }

      const stageDataJSON = StageData.toJSON();

      // Send JSON response with data

      console.log("modifiedcandidature",modifiedcandidature)
      console.log("stageDataJSON",stageDataJSON)

      res.status(200).json({
          candidature: modifiedcandidature,
          stage: stageDataJSON,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/stages/byIds', async (req, res) => {
  const { ids } = req.body;
  try {
    // Ensure ids is an array
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }

    // Fetch jobs by IDs from the database
    const jobs = await stage.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    // Map the jobs to plain objects
    const plainJobs = jobs.map(job => job.toJSON());
    
    console.log("Jobs found:", plainJobs);
     
    res.json(plainJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;