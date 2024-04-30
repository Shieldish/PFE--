const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('../model/dbConfig');
const { sequelize, DataTypes } = require('../model/model');
const flash = require('connect-flash');

const Stages = require('../model/stagesModel');
const { Candidature, StagePostulation } = require('../model/stagePostulationModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { isAdmin, isUser } = require('../middlewares/roles');
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
      const stages = await Stages.findAll();
      res.json(stages);
    } catch (error) {
      // Handle error
      console.error('Error retrieving stages:', error);
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

        const stage = await Stages.findByPk(id);
        console.log( stage.CreatedBy)
        if (!stage) {

            req.flash('error', 'Stage not found');

            return res.redirect(`/etudiant/postulate/${id}`);
        }

        // Create a new instance of the Candidature model
        const candidature = await Candidature.create({
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

        const stagePostulation = await StagePostulation.create({
            stageId: id,
            etudiantName: nom + ' ' + prenom,
            etudiantEmail: email,
            etudiantInstitue: institution,
            stageDomaine: stage.Domaine,
            stageSujet: stage.Libelle,
            entrepriseName: stage.Nom,
            entrepriseEmail: stage.CreatedBy,
            CV: cvPath
        }, { transaction: t });
      
        await t.commit();

        req.flash('success', 'Candidature submitted successfully');
        return res.redirect(`/etudiant`);

       // res.status(200).json({ message: 'Candidature submitted successfully' });
    } catch (err) {
        await t.rollback();
        console.error('Error submitting candidature:', err);
        req.flash('Error', 'An error occurred while submitting the candidature :' +err.message);
        return res.redirect(`/postulate/${id}`);
        //res.status(500).json({ message: `An error occurred while submitting the candidature: ${err.message}` });
    }
});


router.get('/check-email', async (req, res) => {
    const email = req.query.email;
    const stageId = req.query.stageId;

    try {
        // Check if there is a stage with the given stageId and etudiantEmail
        const stage = await StagePostulation.findOne({
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


module.exports = router;