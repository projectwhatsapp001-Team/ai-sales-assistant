const express = require("express");
const router = express.Router();
const supabase = require("../services/supabaseClient");
const { log } = require("../services/utils");
const { messageQueue } = require("../queues/messageQueue");

// --- GET: Webhook Verification ---
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
});

// --- POST: Webhook Inbox ---
router.post("/", async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    
    if (!message || message.type !== "text") {
      return res.sendStatus(200); // Only process text for now
    }

    const phone = message.from;
    const text = message.text?.body || "";
    const messageId = message.id;
    const phoneNumberId = value.metadata.phone_number_id;
    const customerName = value.contacts?.[0]?.profile?.name || "WhatsApp User";

    // 1. FAST DEDUPLICATION (WhatsApp sends duplicate webhooks)
    const { data: exists } = await supabase
      .from("conversations")
      .select("id")
      .eq("whatsapp_message_id", messageId)
      .maybeSingle();

    if (exists) return res.status(200).send("ALREADY_PROCESSED");

    // 🚀 STEP 1: Fast Ack
    res.status(200).send("EVENT_RECEIVED");

    // 🚀 STEP 2: PUSH TO QUEUE
    await messageQueue.add("processMessage", {
      messageId,
      phone,
      text,
      phoneNumberId,
      customerName
    }, {
      jobId: messageId, // 🛡️ Idempotency at queue level
    });

    log("info", "message_queued", { messageId, phone });

  } catch (error) {
    log("error", "webhook_failed", { error: error.message });
    if (!res.headersSent) res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router;
