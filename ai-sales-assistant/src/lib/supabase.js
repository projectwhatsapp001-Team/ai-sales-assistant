// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing required Supabase environment variables");
  console.error(
    "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env",
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
