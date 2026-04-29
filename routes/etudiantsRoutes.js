
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, DataTypes, etudiant } = require('../model/model');
const { Op, fn, col } = require('sequelize');
const flash = require('connect-flash');
require('dotenv').config();
const stage = require('../model/stagesModel');
const { candidature, stagepostulation } = require('../model/stagePostulationModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const user_registration = require('../controllers/UserRegistration');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const stream = require('stream');
const { Readable } = stream;
const app = express();

// [NEW SCHEMA] Import new-schema models for dual-write
const { Candidature: NewCandidature, Stage: NewStage } = require('../model/BusinessModels');
const { Etudiant: NewEtudiant } = require('../model/UserTypeModels');

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(flash());
app.use(bodyParser.json());
app.use(express.json());

router.get('/', (req, res)=>
{
    return res.render('etudiant/index')
})

router.get('/All', async (req, res) => {
    try {
      const { search, sortBy, sortOrder, page, limit, Domaine, Nom, Titre, Address, State } = req.query;

      // Map old uppercase filter names to new lowercase DB column names
      const where = {};
      if (Domaine) where.domaine = Domaine;
      if (Nom)     where.nom_entreprise = Nom;
      if (Titre)   where.titre = Titre;
      if (Address || State) where.adresse = Address || State;

      const sortByMap = { createdAt: 'created_at', updatedAt: 'updated_at', Domaine: 'domaine', Titre: 'titre', Nom: 'nom_entreprise' };
      const resolvedSortBy = sortByMap[sortBy] || sortBy || 'created_at';

      const options = {
        where,
        order: [[resolvedSortBy, sortOrder || 'DESC']],
        offset: page && limit ? (page - 1) * limit : 0,
        limit: limit ? parseInt(limit) : undefined,
      };
  
      if (search) {
        options.where = {
          ...options.where,
          [Op.or]: [
            { domaine:        { [Op.like]: `%${search}%` } },
            { nom_entreprise: { [Op.like]: `%${search}%` } },
            { titre:          { [Op.like]: `%${search}%` } },
            { niveau:         { [Op.like]: `%${search}%` } },
            { libelle:        { [Op.like]: `%${search}%` } },
            { ville:          { [Op.like]: `%${search}%` } },
            { adresse:        { [Op.like]: `%${search}%` } },
            { experience:     { [Op.like]: `%${search}%` } },
            { langue:         { [Op.like]: `%${search}%` } },
          ],
        };
      }
  
      const { count, rows } = await stage.findAndCountAll(options);
      const totalPages = limit ? Math.ceil(count / limit) : 1;
  
      res.json({
        stages: rows.map(r => r.toJSON()),
        pagination: {
          currentPage: page ? parseInt(page) : 1,
          totalPages,
          totalItems: count,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'étape de récupération :', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });
  

router.get('/postuler/', async (req , res)=>{
  
    res.render('pages/home');
  
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
const upload = multer({ storage: multer.memoryStorage() });



function initializeDriveClient() {
  // Ensure GOOGLE_CREDENTIALS is defined
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not defined');
  }
 

  // Parse the JSON string from the environment variable
  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch (err) {
    throw new Error('Failed to parse GOOGLE_CREDENTIALS: ' + err.message);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  return google.drive({ version: 'v3', auth });
}


async function uploadFileToDrive(driveClient, fileObject, fileName) {

/*   console.log('Uploading file:', fileName);
  console.log('File size:', fileObject.size);
  console.log('File mimetype:', fileObject.mimetype); */

  return new Promise((resolve, reject) => {
    const fileStream = new Readable();
    fileStream.push(fileObject.buffer);
    fileStream.push(null);

    const media = {
      mimeType: fileObject.mimetype,
      body: fileStream,
    };

    driveClient.files.create(
      {
        requestBody: {
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_STORAGES], // Replace with your folder ID
        },
        media: media,
        fields: 'id,webViewLink',
      },
      (err, file) => {
        if (err) {
          console.error('Erreur lors du téléchargement du fichier:', err);
          reject(err);
        } else {
          resolve(file.data);
        }
      }
    );
  });
}


router.post('/postulates/:id', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'lettre_motivation', maxCount: 1 },
  { name: 'releves_notes', maxCount: 1 }
]), async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction();

    const id = req.params.id;
    const driveClient = initializeDriveClient();

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
/*     const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
    const lettrePath = req.files['lettre_motivation'] ? req.files['lettre_motivation'][0].path : null;
    const relevesPath = req.files['releves_notes'] ? req.files['releves_notes'][0].path : null; */
    const cvFile = req.files['cv'] ? await uploadFileToDrive(driveClient, req.files['cv'][0], `CV_${email}_${Date.now()}`) : null;
    const lettreFile = req.files['lettre_motivation'] ? await uploadFileToDrive(driveClient, req.files['lettre_motivation'][0], `LM_${email}_${Date.now()}`) : null;
    const relevesFile = req.files['releves_notes'] ? await uploadFileToDrive(driveClient, req.files['releves_notes'][0], `RN_${email}_${Date.now()}`) : null;
    




    // Find the stage by ID
    const stages = await stage.findByPk(id, { transaction: t });

    if (!stages) {
      await t.rollback();
      return res.status(404).json({ error: 'Stage  introuvable' });
    }

    // Create a new instance of the candidature model
    const candidatures = await candidature.create({
      stage_id: id,
      etudiant_id: 0, // will be resolved below; placeholder
      nom,
      prenom,
      date_naissance: date_naissance || null,
      adresse: adresse || null,
      telephone: telephone || null,
      email,
      niveau_etudes: niveau_etudes || '',
      institution: institution || '',
      domaine_etudes: domaine_etudes || '',
      section: section || null,
      experience_description: experience_description || null,
      motivation: motivation || null,
      langues: langues || null,
      logiciels: logiciels || null,
      competences_autres: competences_autres || null,
      cv_url: cvFile ? cvFile.webViewLink : null,
      lettre_motivation_url: lettreFile ? lettreFile.webViewLink : null,
      releves_notes_url: relevesFile ? relevesFile.webViewLink : null,
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
        console.error('Aucun enregistrement trouvé pour l\'e-mail fourni');
        return res.status(404).json({ error: 'Aucun enregistrement trouvé pour l\'e-mail fourni' });
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
      CV:  cvFile ? cvFile.webViewLink : null,
    }, { transaction: t });

    // Commit the transaction
    await t.commit();

    // [NEW SCHEMA] Also create a record in the new `candidature` table with snapshot fields
    // This runs outside the legacy transaction so a failure here does not roll back the legacy write
    try {
      const newEtudiantRecord = await NewEtudiant.findOne({ where: { uuid: etudiantID } })
        || await NewEtudiant.findOne({ where: { nom, prenom } });
      const newStageRecord = await NewStage.findOne({ where: { titre: stages.Titre || stages.Libelle } });

      if (newEtudiantRecord && newStageRecord) {
        await NewCandidature.create({
          stage_id: newStageRecord.stage_id,
          etudiant_id: newEtudiantRecord.etudiant_id,
          status: 'EN_ATTENTE',
          etudiant_nom: nom,
          etudiant_prenom: prenom,
          etudiant_email: email,
          etudiant_departement: domaine_etudes || null,
          etudiant_specialite: section || null,
          cv_path: cvFile ? cvFile.webViewLink : null,
          lettre_motivation_path: lettreFile ? lettreFile.webViewLink : null,
          releves_notes_path: relevesFile ? relevesFile.webViewLink : null,
          motivation_letter: motivation || null,
        });
      }
    } catch (newSchemaErr) {
      // Unique constraint violation = duplicate application; log but don't fail
      if (newSchemaErr.name === 'SequelizeUniqueConstraintError') {
        console.warn('[NEW SCHEMA] Candidature en double ignorée (nouveau schéma):', email, id);
      } else {
        console.error('[NEW SCHEMA] Erreur lors de la création de la candidature (nouveau schéma):', newSchemaErr.message);
      }
    }

    // Send success response
    return res.status(200).json({ message: 'Candidature soumise avec succès' });

  } catch (err) {
    // Rollback the transaction in case of error
    if (t) await t.rollback();

    console.error('Erreur lors de la soumission de la candidature :', err);
    return res.status(500).json({ error: `Une erreur s'est produite lors de la soumission de la candidature: ${err.message}` });
  }
});

 router.post('/postulate/:id', upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'lettre_motivation', maxCount: 1 },
    { name: 'releves_notes', maxCount: 1 }
]), async (req, res) => {
    const t = await sequelize.transaction();
    const id = req.params.id;
    const driveClient = initializeDriveClient();

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
/*         const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
        const lettrePath = req.files['lettre_motivation'] ? req.files['lettre_motivation'][0].path : null;
        const relevesPath = req.files['releves_notes'] ? req.files['releves_notes'][0].path : null; */
        const cvFile = req.files['cv'] ? await uploadFileToDrive(driveClient, req.files['cv'][0], `CV_${email}_${Date.now()}`) : null;
        const lettreFile = req.files['lettre_motivation'] ? await uploadFileToDrive(driveClient, req.files['lettre_motivation'][0], `LM_${email}_${Date.now()}`) : null;
        const relevesFile = req.files['releves_notes'] ? await uploadFileToDrive(driveClient, req.files['releves_notes'][0], `RN_${email}_${Date.now()}`) : null;
    
    

        const stages = await stage.findByPk(id);

 /*            console.log(stages)
            console.log(req.body)
            console.log(req.files) */

      
        if (!stages) {
            req.flash('error', 'Stage not found');
            return res.redirect(`/etudiant/application/${id}`);
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
            cv: cvFile ? cvFile.webViewLink : null,
           lettre_motivation: lettreFile ? lettreFile.webViewLink : null,
           releves_notes: relevesFile ? relevesFile.webViewLink : null
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
                console.error('Aucun enregistrement trouvé pour l\'e-mail fourni');
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
            CV:  cvFile ? cvFile.webViewLink : null,
        }, { transaction: t });
        

        await t.commit();

        // [NEW SCHEMA] Also create a record in the new `candidature` table with snapshot fields
        // Runs outside the legacy transaction so a failure here does not roll back the legacy write
        try {
          const newEtudiantRecord = await NewEtudiant.findOne({ where: { uuid: etudiantID } })
            || await NewEtudiant.findOne({ where: { nom, prenom } });
          const newStageRecord = await NewStage.findOne({ where: { titre: stages.Titre || stages.Libelle } });

          if (newEtudiantRecord && newStageRecord) {
            await NewCandidature.create({
              stage_id: newStageRecord.stage_id,
              etudiant_id: newEtudiantRecord.etudiant_id,
              status: 'EN_ATTENTE',
              etudiant_nom: nom,
              etudiant_prenom: prenom,
              etudiant_email: email,
              etudiant_departement: domaine_etudes || null,
              etudiant_specialite: section || null,
              cv_path: cvFile ? cvFile.webViewLink : null,
              lettre_motivation_path: lettreFile ? lettreFile.webViewLink : null,
              releves_notes_path: relevesFile ? relevesFile.webViewLink : null,
              motivation_letter: motivation || null,
            });
          }
        } catch (newSchemaErr) {
          // Unique constraint violation = duplicate application; log but don't fail
          if (newSchemaErr.name === 'SequelizeUniqueConstraintError') {
            console.warn('[NEW SCHEMA] Candidature en double ignorée (nouveau schéma):', email, id);
          } else {
            console.error('[NEW SCHEMA] Erreur lors de la création de la candidature (nouveau schéma):', newSchemaErr.message);
          }
        }

        req.flash('success', 'candidature soumise avec succès');
        return res.redirect(`/etudiant`);
    } catch (err) {
        await t.rollback();
        console.error('Erreur lors de la soumission de la candidature:', err);
        req.flash('error', `Une erreur s'est produite lors de la soumission de la candidature: ${err.message}`);
        return res.redirect(`/etudiant/application/${id}`);
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
          
        if (stage) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du courrier électronique:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

router.get('/stage_postuler', async (req, res) => {
    try {
      const user = JSON.parse(req.cookies.user);
     
      if (!user) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
  
      const etudiants = user.EMAIL; 
     
  
      if (!etudiants) {
        req.flash('error', 'Une erreur s\'est produite lors de la récupération des données postulées');
        return res.status(400).json({ error: 'Une erreur s\'est produite lors de la récupération des données postulées' });
      }
  
     

      let etudiantID = await etudiant.findOne({ where: { EMAIL: etudiants }, attributes: ['ID'] });
      if (!etudiantID) {
          etudiantID = await user_registration.findOne({ where: { EMAIL: etudiants }, attributes: ['UUID'] });
      }
  
      if (!etudiantID) {
        req.flash('error', 'Une erreur s\'est produite lors de la récupération des données postulées');
        return res.status(400).json({ error: 'Une erreur s\'est produite lors de la récupération des données postulées' });
      }
  
      const etudiantIdValue = etudiantID.ID ? etudiantID.ID : etudiantID.UUID;
  
  
   const postulated = await stagepostulation.findAll({
        where: {
          etudiantID: etudiantIdValue
        },
        order: [['postulatedAt', 'DESC']] // Sorting by postulatedAt in descending order
      });
    
  
      if (postulated.length === 0) {
       // req.flash('info', 'No postulated found');
        return res.status(200).json({ postulant: [] });
      }

      let postulatedJson = postulated.map(postulated => postulated.toJSON());
  
      await normalizeDate(postulatedJson);
  
      postulatedJson = postulatedJson.map(postulatedObj => {
        const modifiedpostulated = { ...postulatedObj };
    /*     modifiedpostulated.CVPath = `/stockages/${postulatedObj.etudiantEmail}/${path.basename(postulatedObj.CV)}`; */
    modifiedpostulated.CVPath =postulatedObj.CV;
        return modifiedpostulated;
      });
  
   
  
      return res.status(200).json({ postulant: postulatedJson });
    } catch (error) {
      console.log(error);
      req.flash('error', 'Une erreur s\'est produite lors de la récupération des données postulées : ' + error.message);
      return res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données postulées' });
    }
  }); 


  router.get('/stage_postuler2', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
  
  
  
      if (!authHeader) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
  
      const token = authHeader.split(' ')[1];
  
   
  
      if (!token) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
  
      const JWT_SECRET = process.env.secretKey; // Ensure this matches the environment variable in your .env file
  
      let etudiants;
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        etudiants = decoded.email;
        req.userId = decoded.userId;
        req.role=decoded.role
     
      } catch (err) {
        console.error('JWT Verification Error:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      // Now check the value of 'etudiants' to ensure it's valid before querying the database
      if (!etudiants) {
        return res.status(401).json({ error: 'Jeton invalide. E-mail introuvable dans le jeton décodé.' });
      }
  
      const etudiantID = await etudiant.findOne({ where: { EMAIL: etudiants }, attributes: ['ID'] }) ||
                         await user_registration.findOne({ where: { EMAIL: etudiants }, attributes: ['UUID'] });
  
      if (!etudiantID) {
        return res.status(400).json({ error: 'Une erreur s\'est produite lors de la récupération des données postulées' });
      }
  
      const etudiantIdValue = etudiantID.ID ? etudiantID.ID : etudiantID.UUID;
     
  
      const postulated = await stagepostulation.findAll({
        where: {
          etudiantID: etudiantIdValue
        },
        order: [['postulatedAt', 'DESC']] // Sorting by postulatedAt in descending order
      });
  
      if (postulated.length === 0) {
        return res.status(200).json({ postulant: [] });
      }

      let postulatedJson = postulated.map(postulated => postulated.toJSON());
  
      await normalizeDate(postulatedJson);
  
      postulatedJson = postulatedJson.map(postulatedObj => {
        const modifiedpostulated = { ...postulatedObj };
  /*       modifiedpostulated.CVPath = `/stockages/${postulatedObj.etudiantEmail}/${path.basename(postulatedObj.CV)}`; */
         modifiedpostulated.CVPath =postulatedObj.CV;
        return modifiedpostulated;
      });
  
     
  
      return res.status(200).json({ postulant: postulatedJson });
    } catch (error) {
      console.error('Erreur lors de la récupération des données postulées :', error);
      return res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données postulées' });
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
      return res.render('etudiant/candidatures', {
          candidature: modifiedcandidature,
          stage: stageDataJSON,
      });
  } catch (error) {
      console.error(error);
      return res.status(500).send('Erreur interne du serveur');
  }
});


router.get('/candidatures2', async (req, res) => {
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
          return res.status(404).json({ error: 'Candidature introuvable' });
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
      if (!StageData) {
          return res.status(404).json({ error: 'Données de stages sont introuvables' });
      }
      res.status(200).json({
          candidature: modifiedcandidature,
          stage: StageData.toJSON(),
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});


router.post('/stages/byIds', async (req, res) => {
  const { ids } = req.body;
  try {
    // Ensure ids is an array
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'les identifiants doivent être un tableau' });
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
    
    res.json(plainJobs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});


router.get('/application/:id', async (req, res) => {
  try {
    const id = req.params.id;
   

    const exist = await stage.findByPk(id);

    if (!exist) {
      return res.render('pages/404', { error: 'Le stage auquel vous voulez postuler est introuvable' });
    }

    // Pass the stage information to the template
    res.render('etudiant/postuler-maintenant', { stage: exist.toJSON() });

  } catch (error) {
    console.log('error', error);
    res.render('pages/404', { error: 'Une erreur est survenue lors du chargement de la page' });
  }
});



router.post('/domaine-suggest', async (req, res) => {
  try {
      const { domaine } = req.body;
      
      // Find similar domaines and order them randomly
      const similarDomaines = await stage.findAll({
          where: { domaine: { [Op.like]: `%${domaine}%` } },
          raw: true,
          order: fn('RAND')
      });

   
      // Return the result as a JSON response
      res.json({ success: true, domaines: similarDomaines }); 

  } catch (error) {
      console.error('Error:', error);
      res.json({ success: false, message: 'An error occurred while fetching similar domaines.' });
  }
});

router.get('/postulate/:id', async (req, res) => {
  const id = req.params.id;
  const Onestage = await stage.findByPk(id);
  if (Onestage) {
      res.render('etudiant/postuler', { stage: Onestage.toJSON() });
  } else {
      res.render('pages/404');
  }
});

module.exports = router;