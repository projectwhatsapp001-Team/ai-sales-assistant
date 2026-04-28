// Backend/routes/followups.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const logger = require("../logger");

// GET /api/followups
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select(
        "*, customers(full_name, phone_number), orders(items, total_amount)",
      )
      .eq("profile_id", req.profileId) // ← only this user's follow-ups
      .order("created_at", { ascending: false });

    if (error) throw error;

    const normalized = (data || []).map((f) => ({
      ...f,
      scheduled_for: f.scheduled_at,
      type: f.type || "abandoned_cart",
      message: f.message_preview || "",
    }));

    res.json(normalized);
  } catch (err) {
    logger.error(`GET /followups: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/followups/:id/send
router.patch("/:id/send", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("profile_id", req.profileId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/followups/:id/cancel
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .update({ status: "cancelled" })
      .eq("id", req.params.id)
      .eq("profile_id", req.profileId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
