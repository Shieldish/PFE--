const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const cors = require('cors'); // Import the cors module
const routes = require('./routes/routes');
const {  fetchSidebarItems, main ,connectToDatabase} = require('./model/dbConfig');
const connectionRoutes = require('./routes/connectionRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const UserProfilesRoutes = require('./routes/UserProfilesRoutes');
const entrepriseRoutes = require('./routes/entrepriseRoutes');
const etudiantsRoutes = require('./routes/etudiantsRoutes');
const encadrementRoutes = require('./routes/encadrementRoutes');
const planificationRoutes = require('./routes/planificationRoutes');
const authenticate = require('./middlewares/auth');
const checkRole =  require('./middlewares/roles');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const user_registration = require('./controllers/UserRegistration');
const stage = require('./model/stagesModel');
const {
    candidature,
    stagepostulation,
} = require('./model/stagePostulationModel');
const etudiant = require('./model/model');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    //maxAge: 600 
  }));

app.use(cookieParser());
app.use(flash());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/stockages', express.static(path.join(__dirname, 'stockages')));

app.use(
    session({
        secret: process.env.secretKey,
        resave: false,
        saveUninitialized: false,
    })
);

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


/* app.set('views', path.join(__dirname, 'views')); */
app.use(express.static(path.join(__dirname, '')));
/* app.set('view engine', 'ejs'); */
app.set('view cache', false);


app.use('/people', authenticate, routes);
app.use('/connection', connectionRoutes);

app.use('/etudiant', authenticate, checkRole(['USER','ENTREPRISE', 'ADMIN', 'DEPARTEMENT']), etudiantsRoutes);
app.use('/entreprise', authenticate, checkRole(['ENTREPRISE', 'DEPARTEMENT', 'ADMIN']), entrepriseRoutes);
app.use('/encadrement', authenticate, checkRole(['DEPARTEMENT', 'ADMIN']), encadrementRoutes);
app.use('/planification', authenticate, checkRole(['DEPARTEMENT', 'ADMIN']), planificationRoutes);
app.use('/settings', authenticate, checkRole(['USER', 'ENTREPRISE', 'DEPARTEMENT', 'ADMIN']), UserProfilesRoutes);
app.use('/gestion', authenticate, checkRole(['ADMIN']), databaseRoutes);
app.use('/files', authenticate, checkRole(['ADMIN']), uploadsRoutes);






app.post('/sidebar', authenticate, async (req, res) => {
    try {
      const { lang } = req.body || 'fr';
      const userRole = req.role; // Assuming you have the user's role available in the request object
      const sidebarItems = await fetchSidebarItems(lang, userRole);
      res.json(sidebarItems);
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments de la barre latérale :', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('/postulate/:id', async (req, res) => {
    const id = req.params.id;
    const Onestage = await stage.findByPk(id);
    if (Onestage) {
        res.render('postuler', { stage: Onestage });
    } else {
        res.render('404');
    }
});

app.get(['/', '/home'], authenticate, (req, res) => {
    const user = req.session.user;
    main()
    if (user) {
      delete user.PASSWORD;
    }
    res.render('home', { user, userJSON: JSON.stringify(user) });
  });
  
/*   app.post('/sidebar', authenticate, async (req, res) => {
    try {
      const { lang } = req.body || 'fr';
      const userRole = req.role; // Assuming you have the user's role available in the request object
      const sidebarItems = await fetchSidebarItems(lang, userRole);
      res.json(sidebarItems);
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments de la barre latérale :', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
 */
app.get(['/favicon.ico', '/sidebar'], (req, res) => {
    res.redirect('/home');
});

const PORT = process.env.PORT || 3000;
/* app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); */

const startServer = async () => {
    try {
      await connectToDatabase();
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      process.exit(1); // Exit the process with an error code
    }
  };
  
  startServer();