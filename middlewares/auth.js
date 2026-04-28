'use strict';

const jwt = require('jsonwebtoken');

/**
 * Role mapping for backward compatibility during schema transition.
 *
 * Old roles (stored in legacy user_registration table or issued in existing JWTs):
 *   USER        → STUDENT
 *   DEPARTEMENT → SUPERVISOR
 *   ENTREPRISE  → COMPANY
 *   ADMIN       → ADMIN  (unchanged)
 *
 * New roles (stored in redesigned user_registration table):
 *   STUDENT, TEACHER, SUPERVISOR, COMPANY, ADMIN
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
const ROLE_MIGRATION_MAP = {
  USER:        'STUDENT',
  DEPARTEMENT: 'SUPERVISOR',
  ENTREPRISE:  'COMPANY',
  // New roles pass through unchanged
  STUDENT:     'STUDENT',
  TEACHER:     'TEACHER',
  SUPERVISOR:  'SUPERVISOR',
  COMPANY:     'COMPANY',
  ADMIN:       'ADMIN',
};

/**
 * Normalise a role value to the new ENUM set.
 * Returns the canonical new role, or the original value if unknown.
 *
 * @param {string} role - Role value from JWT or database
 * @returns {string} Canonical role name
 */
function normalizeRole(role) {
  if (!role) return role;
  return ROLE_MIGRATION_MAP[role.toUpperCase()] || role.toUpperCase();
}

/**
 * JWT authentication middleware.
 *
 * Reads the `token` cookie, verifies it, and attaches `req.userId` and
 * `req.role` to the request.  The role is normalised to the new ENUM values
 * so that downstream role-checking middleware always sees canonical names,
 * regardless of whether the JWT was issued before or after the schema migration.
 */
const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    const ignorePaths = ['/favicon.ico', '/sidebar'];

    if (!ignorePaths.includes(req.originalUrl)) {
      req.session.returnTo = req.originalUrl;
    }

    return res.redirect('/connection/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.secretKey);
    req.userId = decoded.userId;
    // Normalise role so both old and new role names work transparently
    req.role = normalizeRole(decoded.role);
    next();
  } catch (err) {
    res.redirect('/connection/login');
  }
};

module.exports = authenticate;
module.exports.normalizeRole = normalizeRole;
module.exports.ROLE_MIGRATION_MAP = ROLE_MIGRATION_MAP;
