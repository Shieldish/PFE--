'use strict';

/**
 * Application Constants
 * 
 * Centralized location for all application-wide constants.
 * This improves maintainability and reduces magic numbers/strings throughout the codebase.
 */

// ── Authentication & Security ─────────────────────────────────────────────────
const AUTH = {
  // JWT token expiration times
  JWT_EXPIRATION: '1d', // 1 day for regular sessions
  JWT_EXPIRATION_REMEMBER: '7d', // 7 days for "remember me"
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Token lengths
  REGISTRATION_TOKEN_LENGTH: 100,
  RESET_TOKEN_LENGTH: 100,
  
  // Session configuration
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  SESSION_MAX_AGE_REMEMBER: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  // Connection/auth endpoints
  CONNECTION: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // Reduced from 200 for better security
  },
  
  // Search endpoints
  SEARCH: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 60, // Reduced from 300
  },
  
  // Email resend
  EMAIL_RESEND: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 3,
  },
  
  // Password reset
  PASSWORD_RESET: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
};

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// ── User Roles ────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  SUPERVISOR: 'SUPERVISOR',
  COMPANY: 'COMPANY',
  
  // Legacy roles (for backward compatibility)
  LEGACY: {
    USER: 'USER',
    DEPARTEMENT: 'DEPARTEMENT',
    ENTREPRISE: 'ENTREPRISE',
  },
};

// Role migration mapping
const ROLE_MIGRATION_MAP = {
  USER: 'STUDENT',
  DEPARTEMENT: 'SUPERVISOR',
  ENTREPRISE: 'COMPANY',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  SUPERVISOR: 'SUPERVISOR',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
};

// ── File Upload ───────────────────────────────────────────────────────────────
const FILE_UPLOAD = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
};

// ── Email Configuration ───────────────────────────────────────────────────────
const EMAIL = {
  RESEND_COOLDOWN_MS: 5 * 60 * 1000, // 5 minutes
  RESET_COOLDOWN_MS: 5 * 60 * 1000, // 5 minutes
};

// ── Database ──────────────────────────────────────────────────────────────────
const DATABASE = {
  // Connection pool settings
  POOL: {
    MAX: 10,
    MIN: 2,
    ACQUIRE: 30000, // 30 seconds
    IDLE: 10000, // 10 seconds
  },
  
  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 5,
    DELAY_MS: 5000, // 5 seconds
  },
};

// ── HTTP Status Codes ─────────────────────────────────────────────────────────
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// ── Validation Patterns ───────────────────────────────────────────────────────
const VALIDATION = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// ── Error Messages ────────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect',
  ACCOUNT_NOT_ACTIVATED: 'Compte non activé. Veuillez vérifier votre e-mail',
  EMAIL_NOT_FOUND: 'Adresse e-mail non trouvée',
  UNAUTHORIZED: 'Non autorisé. Veuillez vous connecter',
  ACCESS_DENIED: 'Accès refusé',
  
  // Registration
  EMAIL_EXISTS: 'Cette adresse e-mail existe déjà',
  INVALID_EMAIL: 'Adresse e-mail non valide',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Trop de requêtes. Veuillez réessayer plus tard',
  
  // General
  INTERNAL_ERROR: 'Une erreur interne est survenue',
  VALIDATION_ERROR: 'Erreur de validation des données',
};

// ── Success Messages ──────────────────────────────────────────────────────────
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie',
  REGISTRATION_SUCCESS: 'Inscription réussie. Vérifiez votre e-mail',
  EMAIL_SENT: 'E-mail envoyé avec succès',
  PASSWORD_RESET: 'Mot de passe réinitialisé avec succès',
};

module.exports = {
  AUTH,
  RATE_LIMITS,
  PAGINATION,
  ROLES,
  ROLE_MIGRATION_MAP,
  FILE_UPLOAD,
  EMAIL,
  DATABASE,
  HTTP_STATUS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
