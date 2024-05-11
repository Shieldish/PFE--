const session = require('express-session')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const ejs = require('ejs')
const zlib = require('node:zlib');
const routes = require('./routes/routes')
const {connection, fetchSidebarItems,main} = require('./model/dbConfig');
const connectionRoutes = require('./routes/connectionRoutes')
const uploadsRoutes = require('./routes/uploadsRoutes')
const databaseRoutes = require('./routes/databaseRoutes')
const UserProfilesRoutes = require('./routes/UserProfilesRoutes')
const entrepriseRoutes = require('./routes/entrepriseRoutes')
const etudiantsRoutes = require('./routes/etudiantsRoutes')
const encadrementRoutes=require('./routes/encadrementRoutes')
const planificationRoutes= require('./routes/planificationRoutes')
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
/*  app.use((req, res, next) => {
  res.status(404).render('404');
});  */
// Parse URL-encoded bodies (as sent by HTML forms)

// Set EJS as the view engine**
app.set('view engine', 'ejs')
app.set('view cache', false)

// Import routes
app.use('/people', authenticate, routes)
app.use('/connection', connectionRoutes)
app.use('/files', authenticate, isAdmin, uploadsRoutes)
app.use('/gestion', authenticate, isUser, databaseRoutes)
app.use('/settings', authenticate, UserProfilesRoutes)
app.use('/entreprise',authenticate, entrepriseRoutes)
app.use('/etudiant',authenticate, etudiantsRoutes)
app.use('/encadrement',authenticate, encadrementRoutes)
app.use('/planification',authenticate, planificationRoutes)





main();

// Call the fetchSidebarItems function in an Express route
app.post('/sidebar', async (req, res) => {
  const language = req.body.lang || 'en'; // Default to English if no language is provided

  try {
    const sidebarItems = await fetchSidebarItems(language);
    res.json(sidebarItems); // Sending sidebarItems to the frontend as JSON
  } catch (error) {
    res.status(500).send(error);
  }
});

// Usage of fetchSidebarItems function
/* app.post('/sidebar', (req, res) => {
  const language = req.body.lang || 'en'; // Default to English if no language is provided

  fetchSidebarItems(language, connection, (error, sidebarItems) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(sidebarItems); // Sending sidebarItems to the frontend as JSON
    }
  });
});
 */


app.get('/postulate/:id', async (req, res) => {
    const id = req.params.id
    const Onestage = await stage.findByPk(id)
    if (Onestage) {
        res.render('postuler', { stage: Onestage })
    } else {
        res.render('404')
    }
})

app.get(['/', '/home'], authenticate, (req, res) => {
  const user = req.session.user
  if (user) {
      delete user.PASSWORD
  }

  res.render('home', { user, userJSON: JSON.stringify(user) })
})

app.get(['/favicon.ico','/sidebar'], (req, res) => {
  res.redirect('/home');
});

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})
