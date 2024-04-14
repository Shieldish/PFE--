
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
const authenticate = require('./middlewares/auth');
const { isAdmin, isUser } = require('./middlewares/roles');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid');
//const logger = require('./logs/logger');


const app = express();
app.use(cookieParser());
app.use(flash());
app.use(express.json({ limit: '50mb' })); // For JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/files',authenticate,isUser,uploadsRoutes);
// Protect /gestion and its subroutes with authenticate middleware
//app.use('/gestion', authenticate, databaseRoutes); 
app.use('/gestion',authenticate,isUser,databaseRoutes); 
app.use('/settings',authenticate,UserProfilesRoutes);

app.get(['/','/home'], authenticate,(req, res) => {
  const user = req.session.user;
  res.render('home', { user, userJSON: JSON.stringify(user) });
});



/* 
// Your application code herelogger.info('Application started');
console.log('This message will be logged to the console and combined.log');
console.error('This error will be logged to the console, error.log, and combined.log');  */

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
