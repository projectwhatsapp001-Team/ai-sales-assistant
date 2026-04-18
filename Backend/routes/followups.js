const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// GET all follow-ups
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select(
        `*, customers(full_name, phone_number), orders(items, total_amount)`,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH mark follow-up as sent
router.patch("/:id/send", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
