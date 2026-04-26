// Backend/routes/settings.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const logger = require("../logger");

// GET /api/settings/ai/:profileId
router.get("/ai/:profileId", async (req, res) => {
  try {
    // Security: profileId in URL must match the authenticated user's profileId
    if (req.params.profileId !== req.profileId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("profile_id", req.profileId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json(data || {});
  } catch (err) {
    logger.error(`GET /settings/ai: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/settings/ai/:profileId
router.patch("/ai/:profileId", async (req, res) => {
  try {
    if (req.params.profileId !== req.profileId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const allowed = [
      "persona_name",
      "persona_tone",
      "system_prompt",
      "auto_mode",
      "auto_followup",
      "language",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from("ai_settings")
      .upsert(
        { profile_id: req.profileId, ...updates },
        { onConflict: "profile_id" },
      )
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error(`PATCH /settings/ai: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/settings/profile/:profileId
router.patch("/profile/:profileId", async (req, res) => {
  try {
    if (req.params.profileId !== req.profileId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const allowed = [
      "business_name",
      "phone_number",
      "industry",
      "currency",
      "timezone",
      "full_name",
      "email",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.profileId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error(`PATCH /settings/profile: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
