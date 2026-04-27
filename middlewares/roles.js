'use strict';

const logger = require('../logs/logger');

const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.role;

    if (!userRole) {
      req.flash('error', 'Vous devez être connecté pour accéder à cette page');
      return res.redirect('/connection/login');
    }

    if (roles.includes(userRole)) {
      return next();
    }

    logger.warn(`Access denied: ${req.method} ${req.path}`);
    req.flash('error', 'Erreur (403) : Accès refusé');
    return res.render('pages/access-denied', { messages: req.flash() });
  };
};

module.exports = checkRole;
