// Backend/routes/webhook.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const OpenAI = require("openai");
const logger = require("../logger");
const supabase = require("../supabase");
const {
  getProfile,
  getProfileByCustomerPhone,
  getAiSettings,
  getConversationHistory,
  findOrCreateCustomer,
  isSubscriptionActive,
} = require("../lib/profile");
const {
  OPENAI_MODEL,
  OPENAI_MAX_TOKENS,
  OPENAI_TEMPERATURE,
  OPENAI_TIMEOUT_MS,
  WHATSAPP_TIMEOUT_MS,
  FOLLOW_UP_DELAY_MS,
  PURCHASE_KEYWORDS,
} = require("../lib/constants");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: OPENAI_TIMEOUT_MS,
});

function hasPurchaseIntent(message) {
  const lower = message.toLowerCase();
  return PURCHASE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (
    !token ||
    !phoneId ||
    token === "placeholder" ||
    phoneId === "placeholder"
  ) {
    logger.warn("WhatsApp credentials not configured — skipping send");
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: WHATSAPP_TIMEOUT_MS,
      },
    );
    logger.info(`WhatsApp sent to ${to}`);
  } catch (err) {
    // Log full error details internally but don't crash
    logger.error(
      `WhatsApp send failed: ${err.response?.data?.error?.message || err.message}`,
    );
  }
}

// GET — Meta webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    logger.info("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }
  logger.error("Webhook verification failed");
  res.status(403).json({ error: "Forbidden" });
});

// POST — incoming messages
router.post("/", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;
    if (!body || body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!Array.isArray(messages) || messages.length === 0) return;

    const incomingMsg = messages[0];
    if (!incomingMsg || incomingMsg.type !== "text") return;

    // Validate text body exists
    if (!incomingMsg.text || typeof incomingMsg.text.body !== "string") return;

    const customerPhone = incomingMsg.from;
    const customerMessage = incomingMsg.text.body.trim();

    if (!customerPhone || !customerMessage) return;

    logger.info(`Incoming message from ${customerPhone}`);

    // ── Get profile & check subscription (parallel) ────────
    let profile, aiSettings;
    try {
      // Try to find profile by customer phone (existing customer)
      profile = await getProfileByCustomerPhone(customerPhone);
      if (!profile) {
        logger.warn(`No profile found for customer phone ${customerPhone}`);
        return;
      }
    } catch (err) {
      logger.error(`getProfile failed: ${err.message}`);
      return;
    }

    if (!isSubscriptionActive(profile)) {
      logger.warn(`Subscription inactive for profile ${profile.id}`);
      return;
    }

    try {
      aiSettings = await getAiSettings(profile.id);
    } catch (err) {
      logger.error(`getAiSettings failed: ${err.message}`);
      return;
    }

    if (!aiSettings.auto_mode) {
      try {
        const customer = await findOrCreateCustomer(customerPhone, profile.id);
        await supabase.from("conversations").insert({
          profile_id: profile.id,
          customer_id: customer.id,
          role: "user",
          message: customerMessage,
          status: "browsing",
        });
      } catch (err) {
        logger.error(`Save message (auto-mode off) failed: ${err.message}`);
      }
      return;
    }

    // ── Find/create customer ───────────────────────────────
    let customer;
    try {
      customer = await findOrCreateCustomer(customerPhone, profile.id);
    } catch (err) {
      logger.error(`findOrCreateCustomer failed: ${err.message}`);
      return;
    }

    const intentDetected = hasPurchaseIntent(customerMessage);
    const messageStatus = intentDetected ? "buying" : "browsing";

    // ── Save incoming + get history in parallel ────────────
    let history = [];
    try {
      const insertResult = await supabase.from("conversations").insert({
        profile_id: profile.id,
        customer_id: customer.id,
        role: "user",
        message: customerMessage,
        status: messageStatus,
      });
      if (insertResult.error) {
        logger.error(
          `Failed to save incoming message: ${insertResult.error.message}`,
        );
        return;
      }
      history = await getConversationHistory(customer.id, profile.id);
    } catch (err) {
      logger.error(`Save/history failed: ${err.message}`);
      return;
    }

    // ── Build system prompt safely ─────────────────────────
    const systemPrompt =
      (aiSettings.system_prompt || "").trim() ||
      `You are ${aiSettings.persona_name || "Betty"}, a ${aiSettings.persona_tone || "friendly"} AI sales assistant.`;

    // ── Call OpenAI with timeout ───────────────────────────
    let aiReply;
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: customerMessage },
        ],
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: OPENAI_TEMPERATURE,
      });
      aiReply = completion.choices?.[0]?.message?.content;
      if (typeof aiReply === "string") aiReply = aiReply.trim();
      if (!aiReply) {
        logger.error("OpenAI returned empty response");
        return;
      }
    } catch (err) {
      logger.error(`OpenAI failed: ${err.message}`);
      return; // Don't save empty reply
    }

    // ── Send + save reply ──────────────────────────────────
    await sendWhatsAppMessage(customerPhone, aiReply);
    try {
      const saveResult = await supabase.from("conversations").insert({
        profile_id: profile.id,
        customer_id: customer.id,
        role: "assistant",
        message: aiReply,
        status: messageStatus,
      });
      if (saveResult.error) {
        logger.error(`Failed to save AI reply: ${saveResult.error.message}`);
      }
    } catch (err) {
      logger.error(`Save AI reply failed: ${err.message}`);
    }

    // ── Create order if intent detected ────────────────────
    if (intentDetected) {
      try {
        const { data: existingOrder, error: queryErr } = await supabase
          .from("orders")
          .select("id")
          .eq("customer_id", customer.id)
          .eq("status", "pending")
          .maybeSingle();
        if (queryErr) {
          logger.error(`Order query failed: ${queryErr.message}`);
        } else if (!existingOrder) {
          const insertResult = await supabase.from("orders").insert({
            profile_id: profile.id,
            customer_id: customer.id,
            items: [{ name: "Item from WhatsApp", quantity: 1 }],
            total_amount: 0,
            status: "pending",
            notes: "Auto-detected purchase intent",
          });
          if (insertResult.error) {
            logger.error(
              `Failed to create order: ${insertResult.error.message}`,
            );
          }
        }
      } catch (err) {
        logger.error(`Order creation failed: ${err.message}`);
      }
    }

    // ── Schedule follow-up (atomic delete+insert) ──────────
    if (aiSettings.auto_followup) {
      try {
        const scheduledAt = new Date(
          Date.now() + FOLLOW_UP_DELAY_MS,
        ).toISOString();
        // Delete existing pending first, then insert — best-effort atomicity
        await supabase
          .from("follow_ups")
          .delete()
          .eq("customer_id", customer.id)
          .eq("status", "pending");
        await supabase.from("follow_ups").insert({
          profile_id: profile.id,
          customer_id: customer.id,
          scheduled_at: scheduledAt,
          status: "pending",
          message_preview: "Scheduled follow-up",
        });
      } catch (err) {
        logger.error(`Follow-up scheduling failed: ${err.message}`);
      }
    }

    logger.info(`Webhook processed for ${customerPhone}`);
  } catch (err) {
    logger.error(`Webhook top-level error: ${err.message}`, {
      stack: err.stack,
    });
  }
});

module.exports = router;
