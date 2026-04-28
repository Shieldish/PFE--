'use strict';

const logger = require('../logs/logger');
const { normalizeRole } = require('./auth');

/**
 * Role-checking middleware factory.
 *
 * Accepts an array of allowed roles using either the old naming convention
 * (USER, DEPARTEMENT, ENTREPRISE) or the new ENUM values
 * (STUDENT, TEACHER, SUPERVISOR, COMPANY, ADMIN).
 *
 * Both sets are normalised before comparison so that routes defined with old
 * role names continue to work during the transition period.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * @param {string[]} roles - Allowed role names (old or new)
 * @returns {Function} Express middleware
 */
const checkRole = (roles) => {
  // Normalise the allowed-roles list once at middleware creation time
  const normalizedAllowed = roles.map(r => normalizeRole(r));

  return (req, res, next) => {
    const userRole = req.role; // already normalised by auth middleware

    if (!userRole) {
      req.flash('error', 'Vous devez être connecté pour accéder à cette page');
      return res.redirect('/connection/login');
    }

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    logger.warn(`Access denied: ${req.method} ${req.path}`);
    req.flash('error', 'Erreur (403) : Accès refusé');
    return res.render('pages/access-denied', { messages: req.flash() });
  };
};

module.exports = checkRole;
