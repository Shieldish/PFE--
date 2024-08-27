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
const { Op, literal, fn, col ,Sequelize} = require('sequelize');

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

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '')));

// Route Definitions
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



app.get(['/', '/home'], authenticate, async (req, res) => {
    try {
        const stages = await stage.findAll() || [];
        res.render('home', { stages });
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching data.' });
    }
});

app.get('/about', async( req,res)=>{
    res.render('About');
})

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

/*  app.get(['/favicon.ico', '/sidebar'], (req, res) => {
    res.redirect('/home');
});  */

app.get('/check-token', authenticateToken, (req, res) => {
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const queryTerms = query.split(' ').map(term => term.trim());

    try {
        const relevanceScore = queryTerms.map((term, index) => `
            (CASE
                WHEN Titre LIKE :term${index} THEN 10
                WHEN Domaine LIKE :term${index} THEN 8
                WHEN Libelle LIKE :term${index} THEN 7
                WHEN Description LIKE :term${index} THEN 5
                WHEN Niveau LIKE :term${index} THEN 4
                WHEN Experience LIKE :term${index} THEN 4
                WHEN Langue LIKE :term${index} THEN 3
                WHEN Address LIKE :term${index} THEN 2
                WHEN State LIKE :term${index} THEN 2
                WHEN Nom LIKE :term${index} THEN 1
                ELSE 0
            END)
        `).join(' + ');

        const { count, rows: jobs } = await stage.findAndCountAll({
            attributes: {
                include: [
                    [literal(`(${relevanceScore})`), 'relevance']
                ]
            },
            where: {
                [Op.or]: queryTerms.flatMap((term, index) => [
                    { Titre: { [Op.like]: `%${term}%` } },
                    { Domaine: { [Op.like]: `%${term}%` } },
                    { Libelle: { [Op.like]: `%${term}%` } },
                    { Description: { [Op.like]: `%${term}%` } },
                    { Niveau: { [Op.like]: `%${term}%` } },
                    { Experience: { [Op.like]: `%${term}%` } },
                    { Langue: { [Op.like]: `%${term}%` } },
                    { Address: { [Op.like]: `%${term}%` } },
                    { State: { [Op.like]: `%${term}%` } },
                    { Nom: { [Op.like]: `%${term}%` } }
                ])
            },
            order: [
                [literal('relevance'), 'DESC']
            ],
            limit: limit,
            offset: offset,
            replacements: queryTerms.reduce((acc, term, index) => ({ ...acc, [`term${index}`]: `%${term}%` }), {})
        });

        const totalPages = Math.ceil(count / limit);

        res.render('searchResults', {
            jobs,
            applications: [],
            users: [],
            query,
            length: count,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('404.ejs', { error: error.message });
    }
}); */

const ITEMS_PER_PAGE = 10;

app.get('/search', async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    
    if (!query) {
        return res.redirect('/'); // Redirect to home if query is empty
    }

    const queryTerms = query.split(' ').map(term => `%${term.trim()}%`);

    try {
        const { count, rows: jobs } = await stage.findAndCountAll({
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
            attributes: {
                include: [
                    [
                        Sequelize.literal(`
                            (
                                (CASE WHEN "Titre" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Domaine" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Libelle" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Description" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Niveau" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Experience" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Langue" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Address" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "State" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END) +
                                (CASE WHEN "Nom" LIKE '${queryTerms[0]}' THEN 1 ELSE 0 END)
                            )
                        `),
                        'relevanceScore'
                    ]
                ]
            },
            order: [[Sequelize.literal('relevanceScore'), 'DESC']],
            limit: ITEMS_PER_PAGE,
            offset: (page - 1) * ITEMS_PER_PAGE
        });

        const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

        res.render('searchResults', {
            jobs,
            query,
            length: count,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('404.ejs', { error: error.message });
    }
});

// Catch-all 404 route should be defined last
app.use((req, res, next) => {
    res.status(404).render('404', { error: req.originalUrl });
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
