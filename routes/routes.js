// routes.js
const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../middlewares/auth');
const { isAdmin, isUser } = require('../middlewares/roles');
const router = express.Router();


 
module.exports = router;
