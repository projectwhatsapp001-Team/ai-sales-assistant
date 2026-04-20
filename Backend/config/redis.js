const Redis = require("ioredis");
const { log } = require("../services/utils");

// Upstash or managed Redis URL from environment
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

redisConnection.on("error", (err) => {
  log("error", "redis_connection_failed", { error: err.message });
});

module.exports = redisConnection;
