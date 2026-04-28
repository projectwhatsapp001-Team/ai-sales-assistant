const express = require("express");
const router = express.Router();

const axios = require("axios");
const OpenAI = require("openai");
const logger = require("../logger");
const supabase = require("../supabase");

const {
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
  FOLLOW_UP_DELAY_MS,
} = require("../lib/constants");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Webhook verification (ONLY ONE)
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info("Webhook verified");
    return res.status(200).send(challenge);
  }

  res.status(403).json({ error: "Forbidden" });
});

// ✅ Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
      }
    );
  } catch (err) {
    logger.error("WhatsApp send failed: " + err.message);
  }
}

// ✅ Main webhook
router.post("/", async (req, res) => {
  res.sendStatus(200);

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || message.type !== "text") return;

    const customerPhone = message.from;
    const customerMessage = message.text.body;

    logger.info(`Message from ${customerPhone}`);

    const profile = await getProfileByCustomerPhone(customerPhone);
    if (!profile || !isSubscriptionActive(profile)) return;

    const aiSettings = await getAiSettings(profile.id);

    const customer = await findOrCreateCustomer(
      customerPhone,
      profile.id
    );

    const history = await getConversationHistory(
      customer.id,
      profile.id
    );

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: aiSettings.system_prompt || "You are a helpful assistant." },
        ...history,
        { role: "user", content: customerMessage },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE,
    });

    const reply = completion.choices[0].message.content;

    await sendWhatsAppMessage(customerPhone, reply);

    await supabase.from("conversations").insert([
      {
        profile_id: profile.id,
        customer_id: customer.id,
        role: "assistant",
        message: reply,
      },
    ]);

    // ✅ Schedule follow-up if enabled
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

    logger.info("Reply sent successfully");

  } catch (err) {
    logger.error("Webhook error: " + err.message);
  }
});

module.exports = router;