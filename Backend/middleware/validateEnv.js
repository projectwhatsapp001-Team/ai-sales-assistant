// Backend/middleware/validateEnv.js
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "WHATSAPP_VERIFY_TOKEN",
  "PAYSTACK_SECRET_KEY",
];

const VALID_NODE_ENVS = ["development", "production", "test"];

module.exports = function validateEnv() {
  const missing = REQUIRED.filter(
    (k) => !process.env[k] || process.env[k].trim() === "",
  );

  if (missing.length > 0) {
    console.error("\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:");
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error("\nAdd these to your .env file and restart.\n");
    process.exit(1);
  }

  // Validate NODE_ENV is a known value
  const env = process.env.NODE_ENV;
  if (env && !VALID_NODE_ENVS.includes(env)) {
    console.warn(
      `⚠️  NODE_ENV="${env}" is not standard. Use: development | production | test`,
    );
    // Normalise common mistakes
    if (env === "prod") process.env.NODE_ENV = "production";
  }

  // Supabase URL must not be empty string (client would be created with "")
  if (
    process.env.SUPABASE_URL === "" ||
    process.env.SUPABASE_SERVICE_ROLE_KEY === ""
  ) {
    console.error(
      "❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is an empty string.",
    );
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
};
