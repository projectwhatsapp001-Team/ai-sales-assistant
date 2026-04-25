// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// ── Sentry v8 compatible setup ────────────────────────────────
// Sentry v8+ removed Sentry.Handlers — init is enough
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.2,
    });
    logger.info("✅ Sentry initialized");
  } catch (err) {
    logger.warn(`Sentry failed to initialize: ${err.message}`);
  }
}

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.APP_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ── Raw body for Paystack webhook (BEFORE express.json) ───────
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Global rate limiter ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// ── Strict rate limiter for AI stream ─────────────────────────
const streamLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: "Too many AI requests. Slow down." },
});

// ── Request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/followups", require("./routes/followups"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/stream", streamLimiter, require("./routes/stream"));
app.use("/api/webhook", require("./routes/webhook"));

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`);

  // Report to Sentry if available
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = require("@sentry/node");
      Sentry.captureException(err);
    } catch (_) {}
  }

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`✅ SalesBot backend running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`   Allowed origins: ${allowedOrigins.join(", ")}`);
});

module.exports = app;
