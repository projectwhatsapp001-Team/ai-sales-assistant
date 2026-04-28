// Backend/routes/conversations.js
// All routes protected by auth middleware in server.js
// req.profileId is set by auth middleware — users only see their own data
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const logger = require("../logger");

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// GET /api/conversations — list all conversations for THIS user only
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customers(full_name, phone_number)")
      .eq("profile_id", req.profileId) // ← only this user's data
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by customer — return latest message per customer
    const seen = new Set();
    const grouped = [];
    for (const row of data || []) {
      if (!row.customer_id || seen.has(row.customer_id)) continue;
      seen.add(row.customer_id);
      // Provide fallback if customer is null (deleted but conversation exists)
      const customerData = row.customers || {
        full_name: "Unknown",
        phone_number: "",
      };
      grouped.push({
        id: row.id,
        customer_id: row.customer_id,
        customers: customerData,
        status: row.status,
        last_message: row.message,
        needs_human: row.needs_human || false,
        time: formatTimeAgo(row.created_at),
        unread: row.is_read ? 0 : 1,
        created_at: row.created_at,
      });
    }

    res.json(grouped);
  } catch (err) {
    logger.error(`GET /conversations: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conversations/thread/:customerId
router.get("/thread/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customers(full_name, phone_number)")
      .eq("customer_id", customerId)
      .eq("profile_id", req.profileId) // ← security: must belong to this user
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    const messages = (data || []).map((row) => ({
      id: row.id,
      from: row.role === "assistant" ? "ai" : "customer",
      text: row.message,
      time: new Date(row.created_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: row.status,
      created_at: row.created_at,
    }));

    res.json({
      customer_id: customerId,
      customers: data?.[0]?.customers || null,
      messages,
    });
  } catch (err) {
    logger.error(`GET /conversations/thread: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conversations/:id
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customers(full_name, phone_number)")
      .eq("id", req.params.id)
      .eq("profile_id", req.profileId) // ← security check
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (err) {
    logger.error(`GET /conversations/:id: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/conversations/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .update({ is_read: true })
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

// PATCH /api/conversations/:id/handoff
router.patch("/:id/handoff", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .update({ needs_human: true })
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
