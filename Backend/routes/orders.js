// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// GET all orders
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, customers(full_name, phone_number)`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, customers(full_name, phone_number)`)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
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
