const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// GET all conversations
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`*, customers(full_name, phone_number)`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single conversation by ID
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`*, customers(full_name, phone_number)`)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
