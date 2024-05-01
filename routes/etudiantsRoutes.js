const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const { sequelize, DataTypes, etudiant } = require('../model/model');
const flash = require('connect-flash');

const stage = require('../model/stagesModel');
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { isAdmin, isUser } = require('../middlewares/roles');
const user_registration = require('../controllers/UserRegistration');
const router = express.Router();

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
      const stages = await stage.findAll();
      res.json(stages);
    } catch (error) {
      // Handle error
      console.error('Error retrieving stage:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


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
        console.log(stages.CreatedBy)
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

        let etudiantID = await etudiant.findOne({ where: { EMAIL: email }, attributes: ['ID'] });
        if (!etudiantID) {
            etudiantID = await user_registration.findOne({ where: { EMAIL: email }, attributes: ['UUID'] });
        }

        const stagepostulations = await stagepostulation.create({
            stageId: id,
            etudiantID: etudiantID.ID ? etudiantID.ID : etudiantID.UUID,
            etudiantName: `${nom} ${prenom}`,
            etudiantEmail: email,
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
               console.log(stage)
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
        }
      });
  
      if (postulated.length === 0) {
        req.flash('error', 'No postulated found');
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


module.exports = router;