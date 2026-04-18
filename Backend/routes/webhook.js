const express = require("express");
const router = express.Router();

// WhatsApp webhook verification (required by Meta)
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
});

// WhatsApp incoming messages (backend dev will expand this)
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("📨 Incoming WhatsApp message:", JSON.stringify(body, null, 2));
    // TODO: Backend dev processes message and triggers AI reply here
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
