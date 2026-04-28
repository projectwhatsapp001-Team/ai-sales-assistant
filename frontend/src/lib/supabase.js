// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only warn at build time, check at runtime
if (import.meta.env.DEV) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be set in .env for development",
    );
  }
}

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Graceful fallback for build time - will fail at runtime if not configured
  console.warn("⚠️ Supabase not configured - auth features will not work");
}

export { supabase };
