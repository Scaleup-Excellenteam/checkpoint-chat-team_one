import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Determine if we are in production
const isProduction = process.env.NODE_ENV === 'production';

// Define the custom format for console logs.
const consoleLogFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Define different transports (destinations) for the logs.
const transports = [];

// In development, we only want to log to the console with colors.
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        consoleLogFormat
      ),
    })
  );
} else {
  // In production, we log to the console (in JSON format) and to files.
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: combine(timestamp(), json()),
    })
  );
}

const logger = winston.createLogger({
  level: 'info', // The lowest level of message to log.
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions.
});

export default logger;
