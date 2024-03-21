const winston = require('winston');
const path = require('path');

// Define log file paths
const logDir = path.join(__dirname, 'logs');
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

// Create a Winston logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),

    // Error log file transport
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
    }),

    // Combined log file transport
    new winston.transports.File({
      filename: combinedLogPath,
    }),
  ],
});

// Log unhandled exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${reason.stack || reason}`);
});

// Redirect console output to Winston
console.log = (...args) => {
  logger.info(...args);
};
console.error = (...args) => {
  logger.error(...args);
};
console.warn = (...args) => {
  logger.warn(...args);
};

module.exports = logger;