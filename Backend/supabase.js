// backend/supabase.js
// ── Shared Supabase client for all backend routes ────────────
// Uses the SERVICE ROLE key (not anon) so backend can bypass RLS
// Required by: stream.js, webhook.js, and all route files

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("Make sure your .env file has both variables set.");
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
