const express = require('express');
const bodyParser = require('body-parser');
const { createConnection, closeConnection } = require('../model/mysql');
const { enseignant, encadrant, etudiant } = require('../model/model');
const { v4: uuidv4 } = require('uuid');
const user_registration = require('../controllers/UserRegistration');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

let filteredArrayGlobal;
let countGlobal;

router.get('/', async (req, res) => {
  try {
    const connection = await createConnection();
    const [results] = await connection.query('SHOW TABLES');

    const tablesToRemove = ['sidebar_items', 'stage', 'stagepostulation', 'candidature', 'soutenance'];
    const tables = results.map(row => ({ Tables_in_fss: row[`Tables_in_${connection.config.database}`] }))
      .filter(table => !tablesToRemove.includes(table['Tables_in_fss']));

    res.render('index', { tables });
  } catch (err) {
    req.flash('error', 'Erreur lors de la récupération des noms de table');
    res.render('index', { messages: req.flash() });
  }
});

router.get('/:tableName', async (req, res) => {
  const tableName = req.params.tableName;

  try {
    const connection = await createConnection();
    const [results] = await connection.query(`SELECT * FROM ${tableName}`);

    let count = results.length;
    const keysToRemove = ['PASSWORD', 'TOKEN', 'UUID', 'lastEmailSentTime', 'lastEmailResetSent', 'lastEmailResetTime'];

    const filteredArray = results.map(obj => {
      keysToRemove.forEach(key => delete obj[key]);
      return obj;
    });

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
      if (obj.DATE) {
        obj.DATE = new Date(obj.DATE).toLocaleString('fr-FR', {
          month: 'long',
          day: '2-digit',
          year: 'numeric'
        });
      }
    });

    req.flash('success', `Données récupérées avec succès depuis la table ${tableName}`);
    filteredArrayGlobal = filteredArray;
    countGlobal = count;
    res.render('crud', { data: filteredArrayGlobal, tableName, count: countGlobal });
  } catch (err) {
    req.flash('error', `Erreur lors de la récupération des données de la table ${tableName}`);
    res.render('crud', { messages: req.flash() });
  }
});

router.post('/:tableName/add', async (req, res) => {
  const tableName = req.params.tableName;
  const { EMAIL, ...otherFields } = req.body;
  const email = EMAIL.trim();

  try {
    const Model = getModelFromTableName(tableName);

    if (!Model) {
      req.flash('error', `Modèle introuvable pour la table ${tableName}`);
      return res.redirect(`/gestion/${tableName}`);
    }

    const existingUser = await Model.findOne({ where: { EMAIL: email } });
    if (existingUser) {
      req.flash('error', `Utilisateur avec l'email ${EMAIL} existe déjà`);
      return res.redirect(`/gestion/${tableName}`);
    }

    otherFields.UUID = uuidv4();
    delete otherFields.createdAt;

    await Model.create({
      EMAIL,
      ...otherFields
    });

    req.flash('success', 'Entrée ajoutée avec succès.');
    return res.redirect(`/gestion/${tableName}`);
  } catch (err) {
    console.error(`Erreur lors de la création de l'entrée dans la table ${tableName}:`, err);
    req.flash('error', `Erreur lors de la création de l'entrée ${tableName}: ${err}`);
    return res.redirect(`/gestion/${tableName}`);
  }
});

router.post('/:tableName/update/:email', async (req, res) => {
  const tableName = req.params.tableName;
  const { EMAIL, ...otherFields } = req.body;

  try {
    const Model = getModelFromTableName(tableName);

    if (!Model) {
      req.flash('error', `Modèle introuvable pour la table ${tableName}`);
      return res.redirect(`/gestion/${tableName}`);
    }

    delete otherFields.createdAt;
    delete otherFields.updatedAt;
    delete otherFields.id;

    for (let key in otherFields) {
      if (otherFields[key] === '') {
        delete otherFields[key];
      }
    }

    await Model.update(otherFields, {
      where: { EMAIL }
    });

    req.flash('success', `Données mises à jour avec succès dans la table: ${tableName}`);
    return res.redirect(`/gestion/${tableName}`);
  } catch (err) {
    console.error(`Erreur lors de la mise à jour des données dans la table ${tableName}:`, err);
    req.flash('error', `Erreur lors de la mise à jour de l'entrée dans ${tableName}: ${err}`);
    return res.redirect(`/gestion/${tableName}`);
  }
});

router.get('/:tableName/delete/:email', async (req, res) => {
  const tableName = req.params.tableName;
  const email = req.params.email;

  try {
    const connection = await createConnection();
    await connection.query(`DELETE FROM ${tableName} WHERE EMAIL=?`, [email]);

    req.flash('info', `Données de ${email} supprimées avec succès de la table: ${tableName}`);
    res.redirect(`/gestion/${tableName}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression des données de la table ${tableName}:`, error);
    req.flash('error', `Erreur lors de la suppression de l'entrée de la table ${tableName}: ${error}`);
    res.redirect(`/gestion/${tableName}`);
  }
});

function getModelFromTableName(tableName) {
  switch (tableName) {
    case 'enseignant':
      return enseignant;
    case 'encadrant':
      return encadrant;
    case 'user_registration':
      return user_registration;
    case 'user_registrations':
      return user_registration;
    case 'etudiant':
      return etudiant;
    default:
      return null;
  }
}

module.exports = router;
