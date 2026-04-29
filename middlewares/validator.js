'use strict';

const { VALIDATION, ERROR_MESSAGES } = require('../config/constants');

/**
 * Input Validation Utilities
 * 
 * Provides reusable validation functions for common input types.
 * Helps prevent injection attacks and ensures data integrity.
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return VALIDATION.EMAIL_REGEX.test(email.trim());
}

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid
 */
function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  return VALIDATION.UUID_REGEX.test(uuid);
}

/**
 * Sanitizes string input by trimming and removing dangerous characters
 * @param {string} input - Input string
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeString(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Optionally convert to uppercase
  if (options.uppercase) {
    sanitized = sanitized.toUpperCase();
  }
  
  // Optionally convert to lowercase
  if (options.lowercase) {
    sanitized = sanitized.toLowerCase();
  }
  
  // Optionally limit length
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validatePassword(password, options = {}) {
  const errors = [];
  const minLength = options.minLength || 8;
  const requireUppercase = options.requireUppercase !== false;
  const requireLowercase = options.requireLowercase !== false;
  const requireNumbers = options.requireNumbers !== false;
  const requireSpecial = options.requireSpecial || false;
  
  if (!password || typeof password !== 'string') {
    errors.push('Le mot de passe est requis');
    return { valid: false, errors };
  }
  
  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }
  
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Express middleware to validate request body fields
 * @param {object} schema - Validation schema
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // Check required fields
      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`Le champ '${field}' est requis`);
        continue;
      }
      
      // Skip validation if field is optional and not provided
      if (!rules.required && !value) {
        continue;
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`Le champ '${field}' doit être de type ${rules.type}`);
      }
      
      // Email validation
      if (rules.email && !isValidEmail(value)) {
        errors.push(ERROR_MESSAGES.INVALID_EMAIL);
      }
      
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Le champ '${field}' doit contenir au moins ${rules.minLength} caractères`);
      }
      
      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Le champ '${field}' ne peut pas dépasser ${rules.maxLength} caractères`);
      }
      
      // Custom validation function
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors,
      });
    }
    
    next();
  };
}

/**
 * Sanitizes all string fields in request body
 * @returns {Function} Express middleware
 */
function sanitizeBody() {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = sanitizeString(value);
        }
      }
    }
    next();
  };
}

module.exports = {
  isValidEmail,
  isValidUUID,
  sanitizeString,
  validatePassword,
  validateBody,
  sanitizeBody,
};
