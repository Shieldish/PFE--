const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authenticate = require('../middlewares/auth');
const cookieParser = require('cookie-parser');
const {sendUserRegistrationMail,sendUserResetPasswordMail,resendRegistrationMail}=require('../emails/email');
const user_registration  = require('../controllers/UserRegistration'); // Import UserRegistration model
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const fetch = require('node-fetch');


// Initialize a new instance of LocalStorage
//const localStorage = new LocalStorage('./scratch');
const { userInfo } = require('os');
//const flash = require('flash-message');
require('dotenv').config();

const router = express.Router();
const app=express();

app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json())
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});


router.get(['/', '/login'], (req, res) => {
 
    res.render('../connection/login', { title: 'Login' });
  });

  router.get('/register', (req, res) => {
    res.render('../connection/register', { title: 'register' });
  });

  router.get('/logout', (req , res)=> {
    res.clearCookie('token');
    res.clearCookie('user');



    res.redirect('../connection/login');
  })

  router.get('/protected', authenticate, (req, res) => {
    res.json({ message: 'You are authenticated' });
  });
  
  router.post('/register', async function(req, res) {
    try {
      const { nom, prenom, email, password, repeatPassword } = req.body;
  
      // Vérifiez si le mot de passe et le mot de passe répété correspondent
      if (password !== repeatPassword) {
        req.flash('error', 'Les mots de passe ne correspondent pas');
        return res.render('../connection/register', { messages: req.flash() });
      }
  
      // Regex pour vérifier le format de l'adresse e-mail
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        req.flash('error', 'Adresse e-mail non valide');
        return res.render('../connection/register', { messages: req.flash() });
      }
  
      // Vérifiez si l'email existe déjà
      const existingUser = await user_registration.findOne({ where: { email } });
  
      if (existingUser) {
        req.flash('error', `Erreur : l'adresse e-mail '${email}' existe déjà, essayez une autre adresse ou connectez-vous !`);
        return res.render('../connection/register', { messages: req.flash() });
      }
  
      // Générer un token d'inscription
      const registrationToken = generateRandomToken(100);
  
      // Créer un nouvel utilisateur
      const uuid = uuidv4();
  
      const newUser = await user_registration.create({
        NOM: nom.trim().toUpperCase(),
        PRENOM: prenom.trim(),
        EMAIL: email.trim().toLowerCase(),
        PASSWORD: password,
        TOKEN: registrationToken,
        UUID: uuid
      });
  
      // Envoyer un email de confirmation d'inscription
      await sendUserRegistrationMail(email.toLowerCase().trim(), nom.toUpperCase().trim(), registrationToken).then(() => {
        const NOM = nom.trim().toUpperCase();
        const EMAIL = email.trim().toLowerCase();
  
        return res.render('../connection/messages/RegisterSMS', { NOM, EMAIL });
      });
  
    } catch (error) {
      req.flash('error', `Une erreur s'est produite lors de l'inscription de l'utilisateur: ${error}`);
      return res.render('../connection/register', { messages: req.flash() });
    }
  });
  
  router.post('/resendmail', async (req, res) => {
    const { NOM, EMAIL } = req.body;
  
    // Vérifiez si l'email de l'utilisateur a été validé
    const userRegistration = await user_registration.findOne({ where: { EMAIL } });
  
    if (!userRegistration) {
      req.flash('error', 'Erreur inconnue, veuillez réessayer plus tard !');
      return res.status(404).send({ message: 'Inscription utilisateur introuvable' });
    }
  
    if (userRegistration.ISVALIDATED) {
      req.flash('error', 'Votre e-mail a déjà été validé. Pas besoin de renvoyer l\'e-mail de validation.');
      return res.status(400).send({ message: 'E-mail déjà validé' });
    }
  
    // Vérifiez si l'utilisateur a demandé un e-mail de validation au cours des 5 dernières minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes
  
    if (userRegistration.lastEmailSentTime > fiveMinutesAgo) {
      req.flash('error', 'Vous avez déjà demandé un e-mail de validation au cours des 5 dernières minutes. Veuillez réessayer plus tard.');
      return res.status(429).send({ message: 'Trop de demandes. Vous avez déjà demandé un e-mail de validation au cours des 5 dernières minutes. Veuillez réessayer plus tard.' });
    }
  
    // Générer un nouveau token et mettre à jour l'enregistrement de l'utilisateur
    const registrationToken = generateRandomToken(100);
    userRegistration.TOKEN = registrationToken;
    userRegistration.updatedAt = now;
    await userRegistration.save();
  
    // Tentez de renvoyer l'e-mail d'inscription
    let status;
    try {
      status = await resendRegistrationMail(EMAIL, NOM, registrationToken);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
      status = false;
    }
  
    if (status) {
      console.log('E-mail envoyé avec succès');
      userRegistration.lastEmailSentTime = now;
      await userRegistration.save();
  
      req.flash('success', 'E-mail renvoyé avec succès !');
      return res.status(200).send({ message: 'E-mail renvoyé avec succès' });
    } else {
      console.error('Échec de l\'envoi de l\'e-mail');
      req.flash('error', 'Échec de l\'envoi de l\'e-mail. Veuillez réessayer plus tard.');
      return res.status(500).send({ message: 'Échec du renvoi de l\'e-mail. Veuillez réessayer plus tard !' });
    }
  });
  
  router.get('/confirm-email', async (req, res) => {
    try {
      // Extraire le token des paramètres de la requête
      const TOKEN = req.query.TOKEN;
  
      // Trouver l'enregistrement de l'utilisateur par token
      const userRegistration = await user_registration.findOne({ where: { TOKEN } });
  
      // Si l'enregistrement de l'utilisateur n'est pas trouvé ou si le compte est déjà validé
      if (!userRegistration || userRegistration.ISVALIDATED) {
        req.flash('error', 'Compte déjà activé ou token expiré, essayez de vous connecter à la place !');
        return res.render('../connection/login', { messages: req.flash() });
      }
  
      // Vérifier si le token est expiré
      /* if (userRegistration.expiration_date && userRegistration.expiration_date < new Date()) {
        return res.send('Token expiré');
      } */
  
      // Mettre à jour la colonne ISVALIDATED à true
      userRegistration.ISVALIDATED = true;
      userRegistration.TOKEN = '0';
      await userRegistration.save();
  
      // Répondre avec un message de succès
      return res.render('../connection/login');
    } catch (error) {
     /*  console.error('Erreur:', error);
      res.status(500).send('Erreur Interne du Serveur'); */
      res.render('404.ejs', { error: error.message });
    }
  });
  

  router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
  
 
  
    try {
      // Trouver l'enregistrement de l'utilisateur par email
      const userRegistration = await user_registration.findOne({ where: { email } });
  
      // Si l'enregistrement de l'utilisateur n'est pas trouvé, renvoyer une réponse d'erreur
      if (!userRegistration) {
        return res.status(400).json({ error: "L'adresse e-mail que vous avez fournie n'existe pas. Veuillez réessayer." });
      }
  
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000)); // Changé à 5 minutes
  
      if (userRegistration.lastEmailResetTime > fiveMinutesAgo) {
        if (userRegistration.lastEmailResetSent) {
          return res.status(200).json({ message: 'Trop de requêtes. Les instructions de réinitialisation de mot de passe ont déjà été envoyées.' });
        } else {
          return res.status(429).json({ error: 'Trop de requêtes. Vous avez déjà demandé un e-mail de réinitialisation dans les 5 dernières minutes. Veuillez réessayer plus tard!' });
        }
      }
  
      // Générer un nouveau token de réinitialisation
      const resetToken = generateRandomToken(100);
  
      // Mettre à jour l'enregistrement de l'utilisateur avec le nouveau token de réinitialisation
      userRegistration.TOKEN = resetToken; // Changé en minuscule
      userRegistration.lastEmailResetSent = true;
      userRegistration.lastEmailResetTime = new Date();
      await userRegistration.save();
  
      // Envoyer un e-mail de réinitialisation de mot de passe
      await sendUserResetPasswordMail(email, resetToken);
  
      // Envoyer une réponse de succès
      const message = 'Les instructions de réinitialisation de mot de passe ont été envoyées avec succès à:';
      res.status(200).json({ message: `${message} ` });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail de réinitialisation de mot de passe:', error);
      res.status(500).send('Une erreur est survenue lors de l\'envoi de l\'e-mail de réinitialisation de mot de passe');
    }
  });
  


router.get('/reset-password', async (req, res) => {
  // Extract email and token from query parameters
  const { email, token } = req.query;

  // Render the reset password page and pass the email and token to the template
   res.render('../connection/resetpassword',{email:email.toLowerCase() ,token:token}); 
 // res.sendFile(path.join(__dirname, '../connection/resetpassword.ejs')); 
});


router.post('/reseting-password', async (req, res) => {
  const { email, password, confirmPassword, token } = req.body;

     
  // Vérifiez si les mots de passe correspondent
  if (password !== confirmPassword) {
    req.flash('error', 'Les mots de passe ne correspondent pas');
    return res.render('../connection/resetpassword', { email: email.toLowerCase(), token, messages: req.flash() });
  }

  try {
    // Trouver l'utilisateur par email et token
    const user = await user_registration.findOne({ where: { EMAIL: email, TOKEN: token } });

    // Si l'utilisateur n'est pas trouvé ou si le token a expiré
    if (!user || user.TOKEN === '0') {
     
     return res.render('404.ejs', { error: 'Votre token de réinitialisation a expiré' });
    }

    // Générer le sel et hacher le nouveau mot de passe
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mettre à jour le mot de passe de l'utilisateur et réinitialiser le token
    await user_registration.update(
      { PASSWORD: hashedPassword, TOKEN: '0', ISVALIDATED: true }, // Définir le token à '0' pour le marquer comme utilisé
      { where: { EMAIL: email } }
    );

    return res.redirect('../connection/login');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe :', error);
   /*  return res.status(500).json({ error: 'Une erreur est survenue lors de la réinitialisation du mot de passe' }); */
    return  res.render('404.ejs', { error: error.message });
  }
});



router.post('/login', async (req, res) => {
  const { email, password } = req.body;



  try {
    const user = await user_registration.findOne({ where: { email } });

    if (!user) {
      req.flash('error', `Adresse e-mail ${email} non trouvée.`);
      return res.render('../connection/login', { messages: req.flash() });
    }

    if (!user.ISVALIDATED) {
      req.flash('info', 'Compte non activé. Veuillez vérifier votre e-mail et confirmer votre inscription avant de vous connecter !');
      return res.render('../connection/login', { messages: req.flash() });
    }
    if (!user.validPassword(password)) {
      req.flash('error', 'Mot de passe incorrect. Veuillez réessayer.');
      return res.render('../connection/login', { messages: req.flash() });
    }
    
    // Mettre à jour les données utilisateur de la session
    req.session.user = user.toJSON();
    
    const token = jwt.sign(
      { userId: user.UUID, email: user.EMAIL, role: user.role },
      process.env.secretKey,
      { expiresIn: '1d' } // 1 day
    );
    
    // Setting the token cookie with secure and sameSite attributes
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,               // Only send over HTTPS
      sameSite: 'Strict'          // Cookie is not sent with cross-site requests
    });
    
    // Setting the user cookie with secure and sameSite attributes
    res.cookie('user', JSON.stringify(user), {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,               // Only send over HTTPS
      sameSite: 'Strict'          // Cookie is not sent with cross-site requests
    });
    

    req.flash('success', 'Connexion réussie !');



    
    // Récupérer returnTo depuis la session ou utiliser la page d'accueil par défaut
    const returnTo = req.session.returnTo || '/';
    console.log('ReturnTo URL:', req.session.returnTo);

    delete req.session.returnTo; // Effacer l'URL de retour stockée
    console.log('ReturnTo URL:', req.session.returnTo);

    res.redirect(returnTo);

  } catch (err) {
    req.flash('error', err.message);
    res.render('../connection/login', { messages: req.flash() });
  }
});

router.get('/profiles', (req, res) => {
       if(req.cookies.user)
       {
        const user = JSON.parse(req.cookies.user);

        const NOM = user.NOM;
        const PRENOM= user.PRENOM;
        const EMAIL=user.EMAIL;
    
    const userInfo = {
      NOM :NOM,
      PRENOM:PRENOM,
      EMAIL:EMAIL
    }
  
    res.json(userInfo)
       } 
});

function generateRandomToken(length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .replace(/[^a-zA-Z0-9]/g, (match) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return chars[Math.floor(Math.random() * chars.length)];
    });
}

router.post('/loging', async (req, res) => {
  const { email, password } = req.body;



  try {
    const user = await user_registration.findOne({ where: { EMAIL: email } });

    if (!user) {
      return res.status(401).json({ success: false, message: `Adresse e-mail ${email} non trouvée.` });
    }

    if (!user.ISVALIDATED) {
      return res.status(403).json({ success: false, message: 'Compte non activé. Veuillez vérifier votre e-mail et confirmer votre inscription avant de vous connecter !' });
    }

    if (!user.validPassword(password)) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect. Veuillez réessayer.' });
    }

  

    const token = jwt.sign(
      { userId: user.UUID, email: user.EMAIL, role: user.role },
      process.env.secretKey,
      { expiresIn: '10y' } // 10 years
    );
    
    // Setting the token cookie with a very long max age (e.g., 10 years)
    res.cookie('token', token, { httpOnly: true, maxAge: 10 * 365 * 24 * 60 * 60 * 1000 }); // 10 years
    
    // Setting the user cookie with a very long max age (e.g., 10 years)
    res.cookie('user', JSON.stringify(user), { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 }); // 10 years
    
    

    // Retourner le token et les données utilisateur dans la réponse
    res.status(200).json({
      success: true,
      message: 'Connexion réussie !',
      token,
      userData: { userData: user },
      user: { id: user.UUID, email: user.EMAIL, role: user.role }
    });

  } catch (err) {
    console.error('Erreur de connexion :', err);
    res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.' });
  }
});

router.post('/registration', async function (req, res) {
  try {
    const { nom, prenom, email, password, repeatPassword } = req.body;

;

    // Check if password and repeatPassword match
    if (password !== repeatPassword) {
      return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas' });
    }

    // Check if email already exists
    const existingUser = await user_registration.findOne({ where: { EMAIL: email } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Erreur : L'adresse e-mail '${email}' existe déjà. Essayez une autre adresse ou connectez-vous au lieu !`,
      });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
   
      return res.status(400).json({
        success: false,
        message: `Erreur : '${email}' n'est pas une Adresse e-mail  valide!`,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate registration token
    const registrationToken = generateRandomToken(100);

    // Create a new user
    const uuid = uuidv4();

    const newUser = await user_registration.create({
      NOM: nom.trim().toUpperCase(),
      PRENOM: prenom.trim(),
      EMAIL: email.trim().toLowerCase(),
      PASSWORD: hashedPassword, // Updated to use hashed password
      TOKEN: registrationToken,
      UUID: uuid,
    });

    // Send registration confirmation email
    await sendUserRegistrationMail(email.toLowerCase().trim(), nom.toUpperCase().trim(), registrationToken);

    // On successful registration
    return res.status(201).json({
      success: true,
      message: 'Utilisateur enregistré avec succès. Un e-mail de confirmation a été envoyé.',
      user: {
        nom: nom.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      },
    });

  } catch (error) {
    // Log error for debugging purposes
    console.error('Erreur lors de l\'inscription de l\'utilisateur :', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'inscription de l\'utilisateur.',
      error: error.message,
    });
  }
});



  module.exports = router;