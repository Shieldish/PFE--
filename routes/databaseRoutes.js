const express = require('express');
const bodyParser = require('body-parser');
const { enseignant, encadrant, etudiant,entreprise, sequelize } = require('../model/model');
const { v4: uuidv4 } = require('uuid');
const user_registration = require('../controllers/UserRegistration');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

let filteredArrayGlobal;
let countGlobal;

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await sequelize.getQueryInterface().showAllTables();
    const tablesToRemove = ['sidebar_items', 'stage', 'stagepostulation', 'candidature', 'soutenance'];
    const filteredTables = tables.filter(table => !tablesToRemove.includes(table));

    res.render('index', { tables: filteredTables.map(table => ({ Tables_in_fss: table })) });
  } catch (err) {
    req.flash('error', 'Erreur lors de la récupération des noms de table');
    res.render('index', { messages: req.flash() });
  }
});

// Get data from a specific table
router.get('/:tableName', async (req, res) => {
  const tableName = req.params.tableName;

  try {
    const Model = getModelFromTableName(tableName);
    if (!Model) {
      req.flash('error', `Modèle introuvable pour la table ${tableName}`);
      return res.redirect('/');
    }

    const results = await Model.findAll();

    const count = results.length;
    const keysToRemove = ['PASSWORD', 'TOKEN', 'UUID', 'lastEmailSentTime', 'lastEmailResetSent', 'lastEmailResetTime'];

    const filteredArray = results.map(obj => {
      const data = obj.toJSON();
      keysToRemove.forEach(key => delete data[key]);
      return data;
    });

    filteredArray.forEach(obj => {
      if (obj.createdAt) obj.createdAt = formatDate(obj.createdAt);
      if (obj.updatedAt) obj.updatedAt = formatDate(obj.updatedAt);
      if (obj.DATE) obj.DATE = formatDate(obj.DATE, 'date');
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

// Add a new entry to a table
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

// Update an entry in a table
router.post('/:tableName/update/:email', async (req, res) => {
  const tableName = req.params.tableName;
  const { EMAIL, ...otherFields } = req.body;

  try {
    const Model = getModelFromTableName(tableName);

    if (!Model) {
      req.flash('error', `Modèle introuvable pour la table ${tableName}`);
      return res.redirect(`/gestion/${tableName}`);
    }

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

// Delete an entry from a table
router.get('/:tableName/delete/:email', async (req, res) => {
  const tableName = req.params.tableName;
  const email = req.params.email;

  try {
    const Model = getModelFromTableName(tableName);

    if (!Model) {
      req.flash('error', `Modèle introuvable pour la table ${tableName}`);
      return res.redirect(`/gestion/${tableName}`);
    }

    await Model.destroy({
      where: { EMAIL: email }
    });

    req.flash('info', `Données de ${email} supprimées avec succès de la table: ${tableName}`);
    res.redirect(`/gestion/${tableName}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression des données de la table ${tableName}:`, error);
    req.flash('error', `Erreur lors de la suppression de l'entrée de la table ${tableName}: ${error}`);
    res.redirect(`/gestion/${tableName}`);
  }
});

// Utility function to map table names to Sequelize models
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
    case 'entreprise':
      return entreprise;
    default:
      return null;
  }
}

// Utility function to format dates
function formatDate(date, type = 'datetime') {
  const options = {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    ...(type === 'datetime' && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
  return new Date(date).toLocaleString('fr-FR', options);
}

module.exports = router;
