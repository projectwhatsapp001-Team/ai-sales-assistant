// backend/logger.js
// ── Centralized logger (replaces all console.log calls) ──────
// In production: writes to logs/combined.log + logs/error.log
// In development: pretty prints to console with colors

const winston = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ── Custom log format ─────────────────────────────────────────
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

const isProd = process.env.NODE_ENV === "production";

const transports = [
  new winston.transports.Console({
    format: isProd ? prodFormat : devFormat,
  }),
];

// In production, also write to files
if (isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  );
}

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  transports,
  // Don't crash on uncaught exceptions — just log them
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

module.exports = logger;
