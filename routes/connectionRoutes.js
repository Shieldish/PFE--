const $ = require('jquery');
global.jQuery = $;
const express = require('express');
const session = require('express-session');
const path = require('path');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const cookieParser = require('cookie-parser');
const {sendUserRegistrationMail,sendUserResetPasswordMail,sendUserLoginInfoMail}=require('../utils/emailUtils');
const UserRegistration  = require('../controllers/UserRegistration'); // Import UserRegistration model
const flash = require('connect-flash');
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
 
let NAME;
let EMAIL;
router.post('/register', async function(req, res) {
  try {
    const { nom, prenom, email, password, repeatPassword } = req.body;

    // Check if password and repeatPassword match
    if (password !== repeatPassword) {
      req.flash('error', 'Passwords do not correspond');
      return res.render('../connection/register', { messages: req.flash() });
    }
    


    // Check if email already exists
    const existingUser = await UserRegistration.findOne({ where: { email } });

    if (existingUser) {
     // return res.status(400).send('Email address already exists');
      req.flash('error', 'Email address already exists');
      return res.render('../connection/register', { messages: req.flash() });
    }

    // Hash the password
   // const hashedPassword = await bcrypt.hash(password, 10);

    // Generate registration token
    const registrationToken = generateRegistrationToken(email);

    // Create a new user
    const newUser = await UserRegistration.create({
      NOM: nom.trim().toUpperCase(),
      PRENOM: prenom.trim(),
      EMAIL: email.trim().toLowerCase(),
      PASSWORD: password,
      TOKEN: registrationToken
    });
           

    // Send registration confirmation email
    await sendUserRegistrationMail(email.toLowerCase().trim(), nom.toUpperCase().trim(), registrationToken).then(()=>{
      NAME=nom.trim().toUpperCase();
      EMAIL=email.trim().toLowerCase();
      return res.render('../connection/messages', { NAME:NAME,EMAIL:EMAIL });
    })

    
    console.log('Registration confirmation email sent successfully');

    //res.status(201).send('User registered successfully, Registration confirmation email sent successfully to : ' + email);
  } catch (error) {
    //console.error('Error registering user:', error);
    //res.status(500).send('An error occurred while registering the user');
    req.flash('error', 'An error occurred while registering the user '+error);
    return res.render('../connection/register', { messages: req.flash() });
  }
});

router.get('/confirm-email', async (req, res) => {
  try {
    // Extract token from the query parameters
    const TOKEN = req.query.TOKEN;

    // Find user registration by token
    const userRegistration = await UserRegistration.findOne({ where: { TOKEN } });

    // If user registration not found or account already validated
    if (!userRegistration || userRegistration.ISVALIDATED) {
      return res.send('Account already activated or token expired');
    }

    // Check if token is expired
/*     if (userRegistration.expiration_date && userRegistration.expiration_date < new Date()) {
      return res.send('Token expired');
    } */

    // Update isvalidated column to true
    await userRegistration.update({ ISVALIDATED: true , TOKEN :'0'});

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
    const userRegistration = await UserRegistration.findOne({ where: { email } });

    // If user registration not found, send error response
    if (!userRegistration) {
      return res.status(400).json({ error: "The email address you provided doesn't exist. Please try again." });
    }

    // Generate a new reset token
    const resetToken = generateResetToken(email);

    // Update the user registration record with the new reset token
    userRegistration.TOKEN = resetToken;
    await userRegistration.save();

    // Send reset password email
    await sendUserResetPasswordMail(email, resetToken);
    
    // Send success response
    const message = 'Password reset instructions successfully sent to:';
    res.status(200).json({ message: `${message} ` });  /* ${email} */
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
  console.log(data);

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not correspond');
   // return res.render('../connection/register', { messages: req.flash() });
   return res.render('../connection/resetpassword',{email:email.toLowerCase() ,token:token,messages: req.flash()}); //, { messages: req.flash() }
  }
  

  try {
    // Find the user by email and token
    const user = await UserRegistration.findOne({ where: { EMAIL: email, TOKEN: token } });

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
    await UserRegistration.update(
      { PASSWORD: hashedPassword, TOKEN: '0',ISVALIDATED:true }, // Set token to '0' to mark it as used
      { where: { EMAIL: email } }
    );

    return  res.redirect('../connection/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'An error occurred while resetting the password' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserRegistration.findOne({ where: { email } });

    if (!user) {
      req.flash('error', 'Email not found');
      return res.render('../connection/login', { messages: req.flash() });
    }
    if(!user.ISVALIDATED){
      
      req.flash('info', ' Account not activated. Please check your email and confirm your registration before logging in.!');
      return res.render('../connection/login', { messages: req.flash() });
    }

    if (!user.validPassword(password)) {
      req.flash('error', 'Invalid password');
      return res.render('../connection/login', { messages: req.flash() });
    }
    

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.secretKey, { expiresIn: '1d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    req.flash('success', 'Login successful!');
    res.redirect('/home');
  } catch (err) {
    req.flash('error', err.message);
    res.render('../connection/login', { messages: req.flash() });
  }
});


function generateRegistrationToken(email) {
  return jwt.sign({ email }, process.env.secretKey, { expiresIn: '1d' }); // Expires in 1 
  
}// 
function generateResetToken(email) {
  const hash = crypto.createHash('sha256');
  hash.update(email);
  hash.push(crypto.randomBytes(32).toString('hex'))
  const secretKey = crypto.randomBytes(16).toString('hex');
  const resetToken = hash.digest('hex');
  return secretKey+resetToken;
}

  module.exports = router;