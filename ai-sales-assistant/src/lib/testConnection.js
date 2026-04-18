import { supabase } from "./supabase";

async function testConnection() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Supabase connection FAILED:", error.message);
  } else {
    console.log("Supabase connection SUCCESS:", data);
  }
}

testConnection();
