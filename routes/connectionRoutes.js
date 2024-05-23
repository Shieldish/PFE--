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
    res.redirect('../connection/login');
  })

  router.get('/protected', authenticate, (req, res) => {
    res.json({ message: 'You are authenticated' });
  });
  
  // Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
 
let NOM;
let EMAIL;

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;


router.post('/register', async function(req, res) {
  try {
    const { nom, prenom, email, password, repeatPassword } = req.body;

    // Check if password and repeatPassword match
    if (password !== repeatPassword) {
      req.flash('error', 'Passwords do not correspond');
      return res.render('../connection/register', { messages: req.flash() });
    }
    


    // Check if email already exists
    const existingUser = await user_registration.findOne({ where: { email } });

    if (existingUser) {
     // return res.status(400).send('Email address already exists');
     req.flash('error', `Error email address : [${email}] already exists , try another address or login instead ! `);
     return res.render('../connection/register', { messages: req.flash() });

     
    }
    
    // Hash the password
   // const hashedPassword = await bcrypt.hash(password, 10);

    // Generate registration token
    const registrationToken = generateRandomToken(100);

    // Create a new user
    const uuid = uuidv4();

    const newUser = await user_registration.create({
      NOM: nom.trim().toUpperCase(),
      PRENOM: prenom.trim(),
      EMAIL: email.trim().toLowerCase(),
      PASSWORD: password,
      TOKEN: registrationToken,
      UUID: uuid
    });
           
    
    // Send registration confirmation email
    await sendUserRegistrationMail(email.toLowerCase().trim(), nom.toUpperCase().trim(), registrationToken).then(()=>{
      NOM=nom.trim().toUpperCase();
      EMAIL=email.trim().toLowerCase();     
      //console.log('Registration confirmation email sent successfully');

      return res.render('../connection/messages/RegisterSMS', { NOM:NOM,EMAIL:EMAIL });
    }) 

    
   // console.log('Registration confirmation email sent successfully');

    //res.status(201).send('User registered successfully, Registration confirmation email sent successfully to : ' + email);
  } catch (error) {
    //console.error('Error registering user:', error);
    //res.status(500).send('An error occurred while registering the user');
    req.flash('error', 'An error occurred while registering the user '+error);
    return res.render('../connection/register', { messages: req.flash() });
  }
});



 router.post('/resendmail', async (req, res) => {
  const { NOM, EMAIL } = req.body;

  // Check if the user's email has been validated
  const userRegistration = await user_registration.findOne({ where: { EMAIL } });

  if (!userRegistration) {
    req.flash('error', 'Unknown error, please try again later!');
    return res.status(404).send({ message: 'User registration not found' });
  }

  if (userRegistration.ISVALIDATED) {
    req.flash('error', 'Your email has already been validated. No need to resend the validation email.');
    return res.status(400).send({ message: 'Email already validated' });
  }

  // Check if the user has requested a validation email within the last 5 minutes

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - (1 * 60 * 1000));

  if (userRegistration.lastEmailSentTime > fiveMinutesAgo) {
    req.flash('error', 'You have already requested a validation email within the last 5 minutes. Please try again later.');
    return res.status(429).send({ message: 'Too many requests. You have already requested a validation email within the last 5 minutes. Please  try again later.!' });
  }

  // Generate a new token and update the user's record
  const registrationToken = generateRandomToken(100);
  userRegistration.TOKEN = registrationToken;
  userRegistration.updatedAt = now;
  await userRegistration.save();

  // Attempt to resend the registration email
  let status;
  try {
    status = await resendRegistrationMail(EMAIL, NOM, registrationToken);
  } catch (error) {
    console.error('Error sending email:', error);
    status = false;
  }

  if (status) {

    console.log('Email sent successfully');
    userRegistration.lastEmailSentTime=now;
    await userRegistration.save();

    req.flash('success', 'Email resent successfully!');
    return res.status(200).send({ message: 'Email resent successfully' });
  } else {
    console.error('Failed to send email');
    req.flash('error', 'Failed to send email. Please try again later.');
    return res.status(500).send({ message: 'Failed to resend email. Please try again later!' });
  }
});
 
router.get('/confirm-email', async (req, res) => {
  try {
    // Extract token from the query parameters
    const TOKEN = req.query.TOKEN;

    // Find user registration by token
    const userRegistration = await user_registration.findOne({ where: { TOKEN } });

    // If user registration not found or account already validated
    if (!userRegistration || userRegistration.ISVALIDATED) { 
      
      req.flash('error', 'Account already activated or token expired , try to login instead !');
      return res.render('../connection/login', { messages: req.flash() });
    }

    // Check if token is expired
/*     if (userRegistration.expiration_date && userRegistration.expiration_date < new Date()) {
      return res.send('Token expired');
    } */

    // Update isvalidated column to true
    userRegistration.ISVALIDATED=true;
    userRegistration.TOKEN='0';
    userRegistration.save();
   // await user_registration.update({ ISVALIDATED: true , TOKEN :'0'});

    // Respond with success message
    return res.render('../connection/login');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user registration record by email
    const userRegistration = await user_registration.findOne({ where: { email } });

    // If user registration not found, send error response
    if (!userRegistration) {
      return res.status(400).json({ error: "The email address you provided doesn't exist. Please try again." });
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000)); // Changed to 5 minutes

    if (userRegistration.lastEmailResetTime > fiveMinutesAgo) {
      if (userRegistration.lastEmailResetSent) {
      
        return res.status(200).json({ message:'  Too many requests. Password reset instructions already sent to :'});
      }
      else {
        return res.status(429).json({ error: ', Too many requests. You have already requested a reset email within the last 5 minutes. Please try again later!' });
      }
    } 

    // Generate a new reset token
    const resetToken = generateRandomToken(100);

    // Update the user registration record with the new reset token
    userRegistration.TOKEN = resetToken; // Changed to lowercase
    userRegistration.lastEmailResetSent = true;
    userRegistration.lastEmailResetTime = new Date();
    await userRegistration.save();

    // Send reset password email
    await sendUserResetPasswordMail(email, resetToken);

    // Send success response
    const message = 'Password reset instructions successfully sent to:';
    res.status(200).json({ message: `${message} ` });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    res.status(500).send('An error occurred while sending reset password email');
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
  const { email, password,confirmPassword, token } = req.body;
  const data=req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not correspond');
   // return res.render('../connection/register', { messages: req.flash() });
   return res.render('../connection/resetpassword',{email:email.toLowerCase() ,token:token,messages: req.flash()}); //, { messages: req.flash() }
  }
  

  try {
    // Find the user by email and token
    const user = await user_registration.findOne({ where: { EMAIL: email, TOKEN: token } });

    // If user not found or token is expired
    if (!user || user.TOKEN === '0') {
      return  res.send('Your reset token is expired' );
    }

    // Generate salt
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password and reset token
    await user_registration.update(
      { PASSWORD: hashedPassword, TOKEN: '0',ISVALIDATED:true }, // Set token to '0' to mark it as used
      { where: { EMAIL: email } }
    );

    return  res.redirect('../connection/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'An error occurred while resetting the password' });
  }
});

/* router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await user_registration.findOne({ where: { email } });

    if (!user) {
      req.flash('error', `Email address ${email} not found.`);
      return res.render('../connection/login', { messages: req.flash() });
    }
    
    if (!user.ISVALIDATED) {
      req.flash('info', 'Account not activated. Please check your email and confirm your registration before logging in!');
      return res.render('../connection/login', { messages: req.flash() });
    }

    if (!user.validPassword(password)) {
      req.flash('error', 'Incorrect password. Please try again.');
      return res.render('../connection/login', { messages: req.flash() });
    }
    
    // Update session user data
    req.session.user = user.toJSON();
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.secretKey, { expiresIn: '1d' });
    
    // Update cookies with token and user data
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('user', JSON.stringify(user), { maxAge: 24 * 60 * 60 * 1000 });

    req.flash('success', 'Login successful!');
    
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo; // Clear the stored return URL
    res.redirect(returnTo);

  } catch (err) {
    req.flash('error', err.message);
    res.render('../connection/login', { messages: req.flash() });
  }
});
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await user_registration.findOne({ where: { email } });

    if (!user) {
      req.flash('error', `Email address ${email} not found.`);
      return res.render('../connection/login', { messages: req.flash() });
    }

    if (!user.ISVALIDATED) {
      req.flash('info', 'Account not activated. Please check your email and confirm your registration before logging in!');
      return res.render('../connection/login', { messages: req.flash() });
    }
    if (!user.validPassword(password)) {
      req.flash('error', 'Incorrect password. Please try again.');
      return res.render('../connection/login', { messages: req.flash() });
    }
    
    
    // Update session user data
    req.session.user = user.toJSON();
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.secretKey, { expiresIn: '1d' });
    
    // Update cookies with token and user data
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('user', JSON.stringify(user), { maxAge: 24 * 60 * 60 * 1000 });

    req.flash('success', 'Login successful!');
    
    // Retrieve returnTo from session or default to home
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo; // Clear the stored return URL
    res.redirect(returnTo);

  } catch (err) {
    req.flash('error', err.message);
    res.render('../connection/login', { messages: req.flash() });
  }
});

// In your backend route
router.get('/profiles', (req, res) => {
  const userInfo = req.session.user;

  res.json(userInfo)
     
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

  module.exports = router;