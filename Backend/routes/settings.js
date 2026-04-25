// backend/routes/settings.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// GET ai_settings for a profile
router.get("/ai/:profileId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("profile_id", req.params.profileId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH (upsert) ai_settings
router.patch("/ai/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("ai_settings")
      .upsert(
        { profile_id: profileId, ...updates },
        { onConflict: "profile_id" },
      )
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH profile info (business name, phone, etc.)
router.patch("/profile/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
