// Backend/supabase.js
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Hard fail — never create client with empty strings
if (!url || !key) {
  console.error(
    "❌ Cannot create Supabase client: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
