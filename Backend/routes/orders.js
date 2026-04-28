// Backend/routes/orders.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const logger = require("../logger");

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "delivered",
  "cancelled",
];

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(full_name, phone_number)")
      .eq("profile_id", req.profileId) // ← only this user's orders
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error(`GET /orders: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(full_name, phone_number)")
      .eq("id", req.params.id)
      .eq("profile_id", req.profileId) // ← security check
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Order not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .eq("profile_id", req.profileId) // ← can only update own orders
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Order not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
