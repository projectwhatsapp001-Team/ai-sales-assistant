const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "./Backend/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: profiles, error } = await supabase.from("profiles").select("*");
  console.log("Profiles:", profiles);
  if (error) console.error("Error:", error);
}

check();
