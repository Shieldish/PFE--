const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const user_registration = require('../controllers/UserRegistration');
const router = express.Router();
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

router.get('/', async (req, res) => {


    try {
      const user = JSON.parse(req.cookies.user);
      const email = user.EMAIL;
    if (req.cookies.user) {
     
  

      // Fetch user data from database
      const userData = await user_registration.findOne({ where: { email } });

      if (userData) {
        req.flash('success', 'Données récupérées avec succès');
        return res.render('UserSettingsProfiles', { userData: userData, messages: req.flash() });
      } else {
        req.flash('error', 'Données utilisateur non trouvées');
        return res.render('UserSettingsProfiles', { userData: null, messages: req.flash() });
      }
    } else {
      req.flash('error', 'Session utilisateur non trouvée');
      return res.render('UserSettingsProfiles', { userData: null, messages: req.flash() });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur :', error.message);
    req.flash('error', 'Une erreur est survenue lors de la récupération des données utilisateur. Veuillez réessayer plus tard.');
    return res.render('UserSettingsProfiles', { userData: null, messages: req.flash() });
  }
});

router.get('/expo/:UUID', async (req, res) => {
  const { UUID } = req.params;

  if (UUID) {
    console.log(UUID);

    try {
      const userData = await user_registration.findOne({ where: { UUID } });

      if (userData) {
        return res.status(200).json({
          success: true,
          message: 'Données récupérées avec succès',
          data: userData,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Données utilisateur non trouvées. Veuillez réessayer plus tard. Si le problème persiste, déconnectez-vous et reconnectez-vous !',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur :', error);
      return res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de la récupération des données utilisateur. Veuillez réessayer plus tard. Si le problème persiste, déconnectez-vous et reconnectez-vous !',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié. Veuillez vous reconnecter !",
    });
  }
});

router.post('/updateUserData', async (req, res) => {
  const { EMAIL, ...otherFields } = req.body;
  const UUID = otherFields.UUID;

  try {
    const { PASSWORD, PASSWORD2, ...fieldsWithoutPasswords } = otherFields;

    if (PASSWORD && PASSWORD2) {
      if (PASSWORD !== PASSWORD2) {
        req.flash('error', 'Les mots de passe ne correspondent pas, veuillez réessayer.');
        return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
      }
      if (PASSWORD.length < 8 || PASSWORD2.length < 8) {
        req.flash('info', 'Le mot de passe est trop faible, il doit contenir au moins 8 caractères, veuillez réessayer.');
        return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
      }
    }

    delete fieldsWithoutPasswords.PASSWORD2;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(PASSWORD, salt);
    fieldsWithoutPasswords.PASSWORD = hashedPassword;

    const existingUser = await user_registration.findOne({ where: { EMAIL } });
    if (!existingUser) {
      req.flash('error', `Utilisateur avec l'email (${EMAIL}) non trouvé.`);
      return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
    }

    const existingUUID = await user_registration.findOne({ where: { UUID } });
    if (!existingUUID) {
      req.flash('error', `Utilisateur avec l'UUID fourni (${UUID}) non trouvé.`);
      return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
    }

    await user_registration.update(fieldsWithoutPasswords, { where: { EMAIL } });

    const updatedUserData = await user_registration.findOne({ where: { EMAIL } });
    if (updatedUserData) {
      const userData = updatedUserData.toJSON();
      req.session.user = userData;
      req.flash('success', 'Profil mis à jour avec succès.');
      return res.render('UserSettingsProfiles', { userData, messages: req.flash() });
    }

    req.flash('error', `Une erreur est survenue lors de la recherche des données utilisateur ${EMAIL}.`);
    return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    req.flash('error', `Une erreur est survenue lors de la mise à jour : ${error.message}`);
    return res.render('UserSettingsProfiles', { userData: req.session.user, messages: req.flash() });
  }
});

router.post('/updateUserData2', async (req, res) => {
  const { EMAIL, ...otherFields } = req.body;
  const UUID = otherFields.UUID;

  try {
    const { PASSWORD, PASSWORD2, ...fieldsWithoutPasswords } = otherFields;

    if (PASSWORD && PASSWORD2) {
      if (PASSWORD !== PASSWORD2) {
        return res.status(400).json({
          success: false,
          message: 'Les mots de passe ne correspondent pas, veuillez réessayer.',
        });
      }
      if (PASSWORD.length < 8 || PASSWORD2.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe est trop faible, il doit contenir au moins 8 caractères, veuillez réessayer.',
        });
      }

      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(PASSWORD, salt);
      fieldsWithoutPasswords.PASSWORD = hashedPassword;
    }

    const existingUser = await user_registration.findOne({ where: { EMAIL } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `Utilisateur avec l'email (${EMAIL}) non trouvé.`,
      });
    }

    const existingUUID = await user_registration.findOne({ where: { UUID } });
    if (!existingUUID) {
      return res.status(404).json({
        success: false,
        message: `Utilisateur avec l'UUID fourni (${UUID}) non trouvé.`,
      });
    }

    await user_registration.update(fieldsWithoutPasswords, { where: { EMAIL } });

    const updatedUserData = await user_registration.findOne({ where: { EMAIL } });
    if (updatedUserData) {
      const userData = updatedUserData.toJSON();
      req.session.user = userData;
      return res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès.',
        data: userData,
      });
    }

    return res.status(500).json({
      success: false,
      message: `Une erreur est survenue lors de la recherche des données utilisateur ${EMAIL}.`,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    return res.status(500).json({
      success: false,
      message: `Une erreur est survenue lors de la mise à jour : ${error.message}`,
    });
  }
});

module.exports = router;
