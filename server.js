
const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const routes = require('./routes/routes');
const connectionRoutes=require('./routes/connectionRoutes')
const uploadsRoutes=require('./routes/uploadsRoutes')
const databaseRoutes=require('./routes/databaseRoutes')
const UserProfilesRoutes=require('./routes/UserProfilesRoutes')
const entrepriseRoutes=require('./routes/entrepriseRoutes')
const etudiantsRoutes=require('./routes/etudiantsRoutes')
const authenticate = require('./middlewares/auth');
const { isAdmin, isUser } = require('./middlewares/roles');

const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const UserRegistrations  = require('./controllers/UserRegistration');
const Stages=require('./model/stagesModel');
const { Candidature, StagePostulation } = require('./model/stagePostulationModel');
const  etudiant =require('./model/model')



/* const logger = require('./logs/logger'); */


const app = express();
app.use(cookieParser());
app.use(flash());
app.use(express.json({ limit: '50mb' })); // For JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the /stockages directory
app.use('/stockages', express.static(path.join(__dirname, 'stockages')));

app.use(session ({
  secret : process.env.secretKey,
  resave: false,
  saveUninitialized: false
}))
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Set static directory for public files
app.use(express.static(path.join(__dirname, '')));

// Parse URL-encoded bodies (as sent by HTML forms)



// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('view cache',false)




// Import routes
app.use('/people',authenticate,routes,);
app.use('/connection',connectionRoutes);
app.use('/files',authenticate,isAdmin,uploadsRoutes);
// Protect /gestion and its subroutes with authenticate middleware
//app.use('/gestion', authenticate, databaseRoutes); 
app.use('/gestion',authenticate,isUser,databaseRoutes); 
app.use('/settings',authenticate,UserProfilesRoutes);
app.use('/entreprise',authenticate,entrepriseRoutes);
app.use('/etudiant',authenticate,etudiantsRoutes);

app.get(['/','/home'], authenticate,(req, res) => {
  const user = req.session.user;
           if(user)
           {
            delete user.PASSWORD;
           }

  res.render('home', { user, userJSON: JSON.stringify(user) });
});

/* app.get('/check-update', async (req, res) => {
  try {
    if (req.session.user) {
      const latestUserData = await UserRegistrations.findOne({ where: { UUID: req.session.user.UUID } });

      // Update session user data
      req.session.user = latestUserData.toJSON();
      
      // Update cookies with the latest user data
      res.cookie('user', JSON.stringify(user), { maxAge: 24 * 60 * 60 * 1000 });

      res.json(latestUserData);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 */

app.get('/postulate/:id', async (req , res)=>{
  const id = req.params.id;
  const Onestage = await Stages.findByPk(id);
  if(Onestage){
      res.render('postuler',{stage:Onestage})
  }else{
    res.render('404')
  }

}) 

app.get('/postulant_detail/:etudiantEmail', async (req, res) => {
  const etudiantEmail = req.params.etudiantEmail;
  try {
      let candidature = await Candidature.findOne({
          where: {
              email: etudiantEmail
          }
      });

      if (!candidature) {
          // Handle the case where no candidature is found
          return res.status(404).send('Candidature not found');
      }

      const modifiedCandidature = {
          ...candidature.toJSON(),
          cv: `/stockages/${candidature.email}/${path.basename(candidature.cv)}`,
          lettre_motivation: `/stockages/${candidature.email}/${path.basename(candidature.lettre_motivation)}`,
          releves_notes: `/stockages/${candidature.email}/${path.basename(candidature.releves_notes)}`
      };
      const StageData= await StagePostulation.findOne({
        where : {
        stageId : candidature.id,
        etudiantEmail : candidature.email

        }
      })

      const stageDataJSON = StageData.toJSON();

      return res.render('postulant_details', {
          candidature: modifiedCandidature , stage: stageDataJSON
      });
  } catch (error) {
      // Handle errors
      console.error(error);
      return res.status(500).send('Internal Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
