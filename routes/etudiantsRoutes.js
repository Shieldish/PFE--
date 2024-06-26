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
const cloudinary = require('cloudinary').v2;
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

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

      console.log(rows)
  
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFolder = 'stockages';
const uploadFolderPath = path.join(__dirname, '..', uploadFolder);

// Create the main upload folder if it doesn't exist
if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch: fetch });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function uploadFileToDropbox(fileBuffer, fileName, mimeType, retryCount = 3) {
    const dropboxPath = `/stockages/${fileName}`;

    for (let attempt = 0; attempt < retryCount; attempt++) {
        try {
            const response = await dbx.filesUpload({
                path: dropboxPath,
                contents: fileBuffer
            });

            const sharedLink = await dbx.sharingCreateSharedLinkWithSettings({
                path: response.result.path_lower,
                settings: { requested_visibility: 'public' }
            });

            return sharedLink.result.url.replace('dl=0', 'raw=1'); // Convert to direct link
        } catch (error) {
            console.error(`Error uploading file to Dropbox (attempt ${attempt + 1}):`, error);
            if (error.status !== 500 || attempt === retryCount - 1) {
                throw error;
            }
        }
    }
}

router.post('/postulate/:id', upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'lettre_motivation', maxCount: 1 },
    { name: 'releves_notes', maxCount: 1 },
]), async (req, res) => {
    const t = await sequelize.transaction();
    const id = req.params.id;

    try {
        const {
            nom, prenom, date_naissance, adresse, telephone, email, niveau_etudes,
            institution, domaine_etudes, section, annee_obtention, experience, experience_description,
            motivation, langues, logiciels, competences_autres, date_debut, duree_stage
        } = req.body;

        const cvUrl = req.files['cv'] ? await uploadFileToDropbox(req.files['cv'][0].buffer, `${email}-${Date.now()}-${req.files['cv'][0].originalname}`, req.files['cv'][0].mimetype) : null;
        const lettreUrl = req.files['lettre_motivation'] ? await uploadFileToDropbox(req.files['lettre_motivation'][0].buffer, `${email}-${Date.now()}-${req.files['lettre_motivation'][0].originalname}`, req.files['lettre_motivation'][0].mimetype) : null;
        const relevesUrl = req.files['releves_notes'] ? await uploadFileToDropbox(req.files['releves_notes'][0].buffer, `${email}-${Date.now()}-${req.files['releves_notes'][0].originalname}`, req.files['releves_notes'][0].mimetype) : null;

        console.log('Files uploaded:', { cvUrl, lettreUrl, relevesUrl });

        const stages = await stage.findByPk(id);
        if (!stages) {
            req.flash('error', 'Stage not found');
            return res.redirect(`/etudiant/postulate/${id}`);
        }

        const candidatures = await candidature.create({
            id, nom, prenom, date_naissance, adresse, telephone, email, niveau_etudes,
            institution, domaine_etudes, section, annee_obtention, experience, experience_description,
            motivation, langues, logiciels, competences_autres, date_debut, duree_stage,
            cv: cvUrl, lettre_motivation: lettreUrl, releves_notes: relevesUrl
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
                console.error('No record found for the provided email');
            }
        }

        const stagepostulations = await stagepostulation.create({
            stageId: id, etudiantID: etudiantID, etudiantName: `${nom} ${prenom}`, etudiantEmail: email,
            etudiantSection: `${niveau_etudes} : ${section}`, etudiantInstitue: institution, stageDomaine: stages.Domaine,
            stageSujet: stages.Libelle, entrepriseName: stages.Nom, entrepriseEmail: stages.CreatedBy, CV: cvUrl
        }, { transaction: t });

        await t.commit();

        req.flash('success', 'Candidature submitted successfully');
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
       // req.flash('info', 'No postulated found');
        return res.status(404).json({ error: 'No postulated found' });
      }
  
      let postulatedJson = postulated.map(postulated => postulated.toJSON());
  
      await normalizeDate(postulatedJson);
  
      postulatedJson = postulatedJson.map(postulatedObj => {
        const modifiedpostulated = { ...postulatedObj };
    /*     modifiedpostulated.CVPath = `/stockages/${postulatedObj.etudiantEmail}/${path.basename(postulatedObj.CV)}`; */
       modifiedpostulated.CVPath =postulatedObj.CV;
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
     /*  const modifiedcandidature = {
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



module.exports = router;