// backend/routes/conversations.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// GET all conversations (grouped by customer — latest message per customer)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`*, customers(full_name, phone_number)`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by customer_id — return latest message per customer
    const seen = new Set();
    const grouped = [];
    for (const row of data || []) {
      if (!row.customer_id || seen.has(row.customer_id)) continue;
      seen.add(row.customer_id);
      grouped.push({
        id: row.id,
        customer_id: row.customer_id,
        customers: row.customers,
        status: row.status,
        last_message: row.message,
        needs_human: row.needs_human || false,
        time: formatTimeAgo(row.created_at),
        unread: 0,
        created_at: row.created_at,
      });
    }

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET full thread for a customer (for ConversationsPage chat view)
// Required by SSE streaming — stream.js reads this to build context
router.get("/thread/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from("conversations")
      .select(`*, customers(full_name, phone_number)`)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true })
      .limit(Number(limit));

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
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark conversation as needs_human
router.patch("/:id/handoff", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .update({ needs_human: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark conversation as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ──────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

module.exports = router;
