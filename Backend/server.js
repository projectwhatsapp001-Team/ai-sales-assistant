// Backend/server.js
require("dotenv").config();
const validateEnv = require("./middleware/validateEnv");
validateEnv();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
    });
    logger.info("✅ Sentry initialized");
  } catch (err) {
    logger.warn(`Sentry init failed: ${err.message}`);
  }
}

const app = express();

const allowedOrigins = [
  process.env.APP_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, process.env.NODE_ENV !== "production");
      if (allowedOrigins.includes(origin)) return cb(null, true);
      logger.warn(`CORS blocked: ${origin}`);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Raw body MUST come before express.json for Paystack webhook
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests" },
  }),
);
const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many AI requests" },
});

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

const auth = require("./middleware/auth");

// Public routes
app.use("/api/billing/webhook", require("./routes/billing"));
app.use("/api/webhook", require("./routes/webhook"));
app.use("/api/billing", require("./routes/billing"));

// Protected routes — auth middleware applied
app.use("/api/conversations", auth, require("./routes/conversations"));
app.use("/api/orders", auth, require("./routes/orders"));
app.use("/api/followups", auth, require("./routes/followups"));
app.use("/api/settings", auth, require("./routes/settings"));
// Stream has explicit auth inside its own route
app.use("/api/stream", streamLimiter, require("./routes/stream"));

app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  }),
);
app.get("/", (_req, res) =>
  res.json({ name: "SalesBot API", status: "running" }),
);

app.use((err, req, res, _next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);
  if (process.env.SENTRY_DSN) {
    try {
      require("@sentry/node").captureException(err);
    } catch (_) {}
  }
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`✅ SalesBot backend running on 0.0.0.0:${PORT}`);
  logger.info(
    `   Env: ${process.env.NODE_ENV || "development"} | Origins: ${allowedOrigins.join(", ")}`,
  );
});

module.exports = app;
