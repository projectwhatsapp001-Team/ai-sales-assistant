// Backend/lib/validate.js
const {
  MAX_SYSTEM_PROMPT_LENGTH,
  VALID_PLAN_IDS,
  VALID_PERSONA_TONES,
} = require("./constants");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Must start with optional +, then 7-15 digits only
const PHONE_RE = /^\+?[0-9]{7,15}$/;

function validateEmail(email) {
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return "A valid email address is required";
  }
  return null;
}

function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return "Phone number is required";
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (!PHONE_RE.test(cleaned)) return "Invalid phone number format";
  return null;
}

function validatePlanId(planId) {
  if (!planId || !VALID_PLAN_IDS.includes(planId)) {
    return `Invalid plan. Must be one of: ${VALID_PLAN_IDS.join(", ")}`;
  }
  return null;
}

function validateMessage(message) {
  if (!message || typeof message !== "string") return "Message is required";
  if (message.trim() === "") return "Message cannot be empty or whitespace";
  return null;
}

function validateSystemPrompt(prompt) {
  if (!prompt) return null; // optional
  if (typeof prompt !== "string") return "System prompt must be a string";
  if (prompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return `System prompt too long. Max ${MAX_SYSTEM_PROMPT_LENGTH} characters`;
  }
  return null;
}

// Validate Paystack authorization_url before redirecting
function validatePaystackUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return [
      "paystack.com",
      "checkout.paystack.com",
      "standard.paystack.com",
    ].some((host) => parsed.hostname.endsWith(host));
  } catch {
    return false;
  }
}

module.exports = {
  validateEmail,
  validatePhone,
  validatePlanId,
  validateMessage,
  validateSystemPrompt,
  validatePaystackUrl,
};
