const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const cors = require('cors');
const routes = require('./routes/routes');
const { fetchSidebarItems, connectToDatabase } = require('./model/dbConfig');
const connectionRoutes = require('./routes/connectionRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const UserProfilesRoutes = require('./routes/UserProfilesRoutes');
const entrepriseRoutes = require('./routes/entrepriseRoutes');
const etudiantsRoutes = require('./routes/etudiantsRoutes');
const encadrementRoutes = require('./routes/encadrementRoutes');
const planificationRoutes = require('./routes/planificationRoutes');
const authenticate = require('./middlewares/auth');
const checkRole = require('./middlewares/roles');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const flash = require('connect-flash');
const stage = require('./model/stagesModel');
const { Op } = require('sequelize');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(cookieParser());
app.use(flash());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/stockages', express.static(path.join(__dirname, 'stockages')));

app.use(
    require('express-session')({
        secret: process.env.secretKey,
        resave: false,
        saveUninitialized: false,
    })
);
// Catch-all route for handling 404 errors
// Other route handlers above...

// Catch-all route for handling 404 errors


app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '')));

app.use('/people', authenticate, routes);
app.use('/connection', connectionRoutes);
app.use('/etudiant', authenticate, checkRole(['USER', 'ENTREPRISE', 'ADMIN', 'DEPARTEMENT']), etudiantsRoutes);
app.use('/entreprise', authenticate, checkRole(['ENTREPRISE', 'DEPARTEMENT', 'ADMIN']), entrepriseRoutes);
app.use('/encadrement', authenticate, checkRole(['DEPARTEMENT', 'ADMIN']), encadrementRoutes);
app.use('/planification', authenticate, checkRole(['DEPARTEMENT', 'ADMIN']), planificationRoutes);
app.use('/settings', authenticate, checkRole(['USER', 'ENTREPRISE', 'DEPARTEMENT', 'ADMIN']), UserProfilesRoutes);
app.use('/gestion', authenticate, checkRole(['ADMIN']), databaseRoutes);
app.use('/files', authenticate, checkRole(['ADMIN']), uploadsRoutes);

app.post('/sidebar', authenticate, async (req, res) => {
    try {
        const { lang } = req.body || 'fr';
        const userRole = req.role;
        const sidebarItems = await fetchSidebarItems(lang, userRole);
        res.json(sidebarItems);
    } catch (error) {
        console.error('Erreur lors de la récupération des éléments de la barre latérale:', error);
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

/* app.get(['/', '/home'], authenticate, (req, res) => {
    const user = req.session.user;



    if (user) {
        delete user.PASSWORD;
    }
    res.render('home', { user, userJSON: JSON.stringify(user) });
}); */


 app.get(['/', '/home'], authenticate, async (req, res) => {
  try {
    const stages = await stage.findAll() || [];

    res.render('home', { stages });
  } catch (error) {
    console.error('Error fetching stages:', error);
    res.status(500).render('error', { message: 'An error occurred while fetching data.' });
  }
}); 

app.get('/api/stages', authenticate, async (req, res) => {
    try {
        const stages = await stage.findAll({
            order: [['createdAt', 'DESC']]
        }) || [];
      res.json(stages);
    } catch (error) {
      console.error('Error fetching stages:', error);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  });
app.get(['/favicon.ico', '/sidebar'], (req, res) => {
    res.redirect('/home');
});

app.get('/check-token', authenticateToken, (req, res) => {
    // If this point is reached, the token is valid
    res.status(200).json({ valid: true });
  });
  
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.secretKey, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }


/* app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.redirect('/'); // Redirect to home if query is empty
    }

    // Split the query into individual words (e.g., 'devops engineer' -> ['devops', 'engineer'])
    const queryTerms = query.split(' ').map(term => term.trim());

    try {
        // Perform search across tables
        const jobs = await stage.findAll({
            where: {
                [Op.and]: queryTerms.map(term => ({
                    [Op.or]: [
                        { Titre: { [Op.like]: `%${term}%` } },
                        { Domaine: { [Op.like]: `%${term}%` } },
                        { Libelle: { [Op.like]: `%${term}%` } },
                        { Description: { [Op.like]: `%${term}%` } },
                        { Niveau: { [Op.like]: `%${term}%` } },
                        { Experience: { [Op.like]: `%${term}%` } },
                        { Langue: { [Op.like]: `%${term}%` } },
                        { Address: { [Op.like]: `%${term}%` } },
                        { State: { [Op.like]: `%${term}%` } }
                    ]
                }))
            }
        });

        res.render('searchResults', {
            jobs,
           
            query
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('404.ejs', { error: error.message });
    }
});
 */
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.redirect('/'); // Redirect to home if query is empty
    }

    // Split the query into individual words (e.g., 'gd sfax devops' -> ['gd', 'sfax', 'devops'])
    const queryTerms = query.split(' ').map(term => `%${term.trim()}%`);

    try {
        // Perform search across tables
        const jobs = await stage.findAll({
            where: {
                [Op.or]: queryTerms.map(term => ({
                    [Op.or]: [
                        { Titre: { [Op.like]: term } },
                        { Domaine: { [Op.like]: term } },
                        { Libelle: { [Op.like]: term } },
                        { Description: { [Op.like]: term } },
                        { Niveau: { [Op.like]: term } },
                        { Experience: { [Op.like]: term } },
                        { Langue: { [Op.like]: term } },
                        { Address: { [Op.like]: term } },
                        { State: { [Op.like]: term } },
                        { Nom: { [Op.like]: term } }
                    ]
                }))
            },
            
        });

        res.render('searchResults', {
            jobs,
            applications: [], // Replace with actual application search if needed
            users: [], // Replace with actual user search if needed
            query,
           length:jobs.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('404.ejs', { error: error.message });
    }
});


const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
