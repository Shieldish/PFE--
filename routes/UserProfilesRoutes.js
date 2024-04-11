const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const UserRegistration  = require('../controllers/UserRegistration');
const router = express.Router();
const app=express();
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(bodyParser.json())
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

let data
router.get('/',async (req, res) => {
       if(req.session.user)
       {
          let user = req.session.user;
          let email = user.EMAIL;
          const userData = await UserRegistration.findOne({ where: {email } });
          if(userData)
          { 
            data=userData

             req.flash('success','Data was retrieve successfully')
            return res.render('UserSettingsProfiles', { userData , messages: req.flash() }); 
           
          }
          else {
            userData=null
            req.flash('error', 'An error occurred while retrieving user data. Please try again later. If the problem persists, log out and log in again! ');
            return res.render('UserSettingsProfiles', {userData, messages: req.flash() });
          }
          
       }   
        userData=null
        req.flash('error', 'An error occurred while retrieving user data. Please try again later. If the problem persists, log out and log in again! ');
        return res.render('UserSettingsProfiles', {userData, messages: req.flash() });
});


router.post('/updateUserData', async (req, res) => {
    
    const { EMAIL, ...otherFields } = req.body;
    
    const p1 = otherFields.PASSWORD;
    const p2 = otherFields.PASSWORD2;

    if (p1 && p2) {
        if (p1 !== p2) {
            req.flash('error', 'Passwords do not match, please try again.');
            return res.render('UserSettingsProfiles', { userData: data, messages: req.flash() });
        }
        if (p1.length < 8 || p2.length < 8) {
            req.flash('info', 'Password is too weak, it must be at least 8 characters long, please try again.');
            return res.render('UserSettingsProfiles', { userData: data, messages: req.flash() });
        }
    }

    delete otherFields.PASSWORD2;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(p1, salt);
    otherFields.PASSWORD = hashedPassword;
    
    await UserRegistration.update(
        otherFields,
        { where: { EMAIL: EMAIL } }
    );

    // Optionally, you can fetch updated user data after the update and send it to the frontend
    const updatedUserData = await UserRegistration.findOne({ where: { EMAIL: EMAIL } });

     
    // Redirect or render the page as needed
    userData=updatedUserData.toJSON();
    req.session.user=userData;

        req.flash('success', 'Edited profiles is updated successfully . ');
        return res.render('UserSettingsProfiles', {userData, messages: req.flash() });
});


module.exports = router;