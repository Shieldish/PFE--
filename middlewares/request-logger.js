'use strict';

const logger = require('../logs/logger');

/**
 * HTTP Request Logging Middleware
 * 
 * Logs all incoming HTTP requests with relevant information:
 * - Method and URL
 * - Response status and time
 * - User information (if authenticated)
 * - IP address
 */

/**
 * Creates a request logging middleware
 * @returns {Function} Express middleware
 */
function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to log after response is sent
    res.end = function(...args) {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Build log metadata
      const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };
      
      // Add user info if authenticated
      if (req.userId) {
        logData.userId = req.userId;
        logData.userRole = req.role;
      }
      
      // Log based on status code
      if (res.statusCode >= 500) {
        logger.error('HTTP Request', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
      
      // Call original end function
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

module.exports = requestLogger;
