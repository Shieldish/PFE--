'use strict';

const winston = require('winston');
const path = require('path');

/**
 * Enhanced Winston Logger Configuration
 * 
 * Improvements:
 * - Better formatting for development and production
 * - Separate error and combined logs
 * - Colorized console output in development
 * - Proper timestamp formatting
 * - Log rotation ready (can add winston-daily-rotate-file)
 * 
 * Note: Removed console.log override as it's an anti-pattern that can
 * interfere with debugging and third-party libraries.
 */

// Define log file paths
const logDir = path.join(__dirname, 'logs');
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports array
const transports = [
  // Error log file - only errors
  new winston.transports.File({
    filename: errorLogPath,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file - all levels
  new winston.transports.File({
    filename: combinedLogPath,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add console transport with appropriate formatting
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: customFormat,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: customFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
);

logger.rejections.handle(
  new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
);

/**
 * Create a child logger with additional context
 * @param {object} meta - Additional metadata to include in all logs
 * @returns {winston.Logger} Child logger instance
 */
logger.child = (meta) => {
  return logger.child(meta);
};

module.exports = logger;
