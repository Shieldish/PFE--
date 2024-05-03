const session = require('express-session')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const ejs = require('ejs')
const zlib = require('node:zlib');
const routes = require('./routes/routes')
const connection = require('./model/dbConfig');
const connectionRoutes = require('./routes/connectionRoutes')
const uploadsRoutes = require('./routes/uploadsRoutes')
const databaseRoutes = require('./routes/databaseRoutes')
const UserProfilesRoutes = require('./routes/UserProfilesRoutes')
const entrepriseRoutes = require('./routes/entrepriseRoutes')
const etudiantsRoutes = require('./routes/etudiantsRoutes')
const authenticate = require('./middlewares/auth')
const { isAdmin, isUser } = require('./middlewares/roles')

const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const user_registration = require('./controllers/UserRegistration')
const stage = require('./model/stagesModel')
const {
    candidature,
    stagepostulation,
} = require('./model/stagePostulationModel')
const etudiant = require('./model/model')

/* const logger = require('./logs/logger'); */

const app = express()
app.use(cookieParser())
app.use(flash())
app.use(express.json({ limit: '50mb' })) // For JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve static files from the /stockages directory
app.use('/stockages', express.static(path.join(__dirname, 'stockages')))

app.use(
    session({
        secret: process.env.secretKey,
        resave: false,
        saveUninitialized: false,
    })
)
app.use((req, res, next) => {
    res.locals.messages = req.flash()
    next()
})

// Set views directory
app.set('views', path.join(__dirname, 'views'))

// Set static directory for public files
app.use(express.static(path.join(__dirname, '')))
/* app.use((req, res, next) => {
  res.status(404).render('404');
}); */
// Parse URL-encoded bodies (as sent by HTML forms)

// Set EJS as the view engine
app.set('view engine', 'ejs')
app.set('view cache', false)

// Import routes
app.use('/people', authenticate, routes)
app.use('/connection', connectionRoutes)
app.use('/files', authenticate, isAdmin, uploadsRoutes)
// Protect /gestion and its subroutes with authenticate middleware
//app.use('/gestion', authenticate, databaseRoutes);
app.use('/gestion', authenticate, isUser, databaseRoutes)
app.use('/settings', authenticate, UserProfilesRoutes)
app.use('/entreprise', authenticate, entrepriseRoutes)
app.use('/etudiant', etudiantsRoutes)

app.get(['/', '/home'], authenticate, (req, res) => {
    const user = req.session.user
    if (user) {
        delete user.PASSWORD
    }

    res.render('home', { user, userJSON: JSON.stringify(user) })
})

// Define fetchSidebarItems function
const fetchSidebarItems = (lang, connection, callback) => {
  
  const sidebarSql = `
    SELECT
      s.id,
      s.name_${lang} AS name,
      s.link,
      s.icon,
      s.parent_id
    FROM sidebar_items s
    ORDER BY s.parent_id, s.id
  `;

  connection.query(sidebarSql, (sidebarErr, sidebarResults) => {
    if (sidebarErr) {
      console.error('Error fetching sidebar items:', sidebarErr);
      if (typeof callback === 'function') {
        callback('Error fetching sidebar items', null);
      }
      return;
    }

    // Build the sidebar items structure
    const sidebarItems = sidebarResults.reduce((acc, item) => {
      if (item.parent_id === null) {
        acc.push({
          id: item.id,
          name: item.name,
          link: item.link,
          icon: item.icon,
          children: []
        });
      } else {
        const parent = acc.find(i => i.id === item.parent_id);
        if (parent) {
          parent.children.push({
            id: item.id,
            name: item.name,
            link: item.link,
            icon: item.icon
          });
        }
      }
      return acc;
    }, []);

    //console.log("Sidebar Items : =>", sidebarItems);
    if (typeof callback === 'function') {
      callback(null, sidebarItems);
    }
  });
};

// Usage of fetchSidebarItems function
app.post('/sidebar', (req, res) => {
  const language = req.body.lang || 'en'; // Default to English if no language is provided
  
  fetchSidebarItems(language, connection, (error, sidebarItems) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(sidebarItems); // Sending sidebarItems to the frontend as JSON
    }
  });
});


app.get('/postulate/:id', async (req, res) => {
    const id = req.params.id
    const Onestage = await stage.findByPk(id)
    if (Onestage) {
        res.render('postuler', { stage: Onestage })
    } else {
        res.render('404')
    }
})

app.get('/sidebar', (req, res) => {
  res.redirect('/home');
});

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})
