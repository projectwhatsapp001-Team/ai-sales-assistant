const crypto = require("crypto");

/**
 * PRODUCTION UTILITY: Structured Logger
 */
function log(level, event, data = {}) {
  console.log(JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data
  }));
}

/**
 * PRODUCTION UTILITY: Normalizer for consistent matching
 */
const normalize = (str) => (str || "").toLowerCase().trim().replace(/[^a-z0-9 ]/g, "");

/**
 * PRODUCTION UTILITY: Smart Retry with Exponential Backoff
 */
async function withRetry(fn, options = { maxRetries: 2, initialDelay: 500 }) {
  let attempt = 0;
  while (attempt <= options.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const status = error.response?.status || error.status;
      const isRetryable = status >= 500 || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      
      if (!isRetryable || attempt === options.maxRetries) throw error;
      
      const delay = options.initialDelay * Math.pow(2, attempt);
      log("warn", "retry_attempt", { attempt: attempt + 1, delay, error: error.message });
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
}

/**
 * PRODUCTION UTILITY: Generate Idempotency Key
 */
function generateIdempotencyKey(customerId, text) {
  const hash = crypto.createHash("sha256").update(customerId + text).digest("hex");
  return hash.substring(0, 32);
}

module.exports = {
  log,
  normalize,
  withRetry,
  generateIdempotencyKey
};
