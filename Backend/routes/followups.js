// backend/routes/followups.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

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

    // Normalize field names to match frontend expectations
    const normalized = (data || []).map((f) => ({
      ...f,
      scheduled_for: f.scheduled_at,
      type: f.type || "abandoned_cart",
      message: f.message_preview || f.message || "",
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH cancel follow-up
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .update({ status: "cancelled" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
