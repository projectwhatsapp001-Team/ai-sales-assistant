// backend/routes/webhook.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const OpenAI = require("openai");
const supabase = require("../supabase");
const logger = require("../logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

const PURCHASE_KEYWORDS = [
  "buy",
  "order",
  "purchase",
  "want to get",
  "how much",
  "price",
  "cost",
  "i'll take",
  "add to",
  "checkout",
  "pay",
  "payment",
  "deliver",
  "shipping",
];

function hasPurchaseIntent(message) {
  const lower = message.toLowerCase();
  return PURCHASE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sendWhatsAppMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );
    logger.info(`WhatsApp message sent to ${to}`);
  } catch (err) {
    logger.error(
      `WhatsApp send error: ${err.response?.data?.error?.message || err.message}`,
    );
  }
}

async function findOrCreateCustomer(phone, profileId) {
  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("phone_number", phone)
    .eq("profile_id", profileId)
    .single();
  if (existing) return existing;

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({ phone_number: phone, profile_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return newCustomer;
}

async function getConversationHistory(customerId, profileId) {
  const { data } = await supabase
    .from("conversations")
    .select("role, message")
    .eq("customer_id", customerId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(10);
  return (data || []).map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.message,
  }));
}

async function getAiSettings(profileId) {
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("profile_id", profileId)
    .single();
  return (
    data || {
      persona_name: "Betty",
      persona_tone: "friendly",
      system_prompt: "You are Betty, a friendly AI sales assistant.",
      auto_mode: true,
      auto_followup: true,
    }
  );
}

async function getProfile() {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)
    .single();
  return data;
}

// GET — webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("WhatsApp Webhook verified by Meta");
    res.status(200).send(challenge);
  } else {
    logger.error("Webhook verification failed — token mismatch");
    res.status(403).json({ error: "Verification failed" });
  }
});

// POST — incoming messages
router.post("/", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return;

    const incomingMsg = messages[0];
    if (incomingMsg.type !== "text") return;

    const customerPhone = incomingMsg.from;
    const customerMessage = incomingMsg.text.body;

    // Sanitize — don't log full message content in production
    logger.info(
      `Incoming WhatsApp message from ${customerPhone} (${customerMessage.length} chars)`,
    );

    const profile = await getProfile();
    if (!profile) {
      logger.error("No profile found");
      return;
    }

    // Check if account is active/trial valid
    const now = new Date();
    const trialEndsAt = profile.trial_ends_at
      ? new Date(profile.trial_ends_at)
      : null;
    const isPaid = ["starter", "pro"].includes(profile.plan);
    const isInTrial = trialEndsAt && now < trialEndsAt;

    if (!isPaid && !isInTrial) {
      logger.warn(
        `Profile ${profile.id} subscription expired — not processing message`,
      );
      return;
    }

    const aiSettings = await getAiSettings(profile.id);
    if (!aiSettings.auto_mode) {
      const customer = await findOrCreateCustomer(customerPhone, profile.id);
      await supabase.from("conversations").insert({
        profile_id: profile.id,
        customer_id: customer.id,
        role: "user",
        message: customerMessage,
        status: "browsing",
      });
      logger.info("Auto-mode off — message saved, no reply sent");
      return;
    }

    const customer = await findOrCreateCustomer(customerPhone, profile.id);
    const intentDetected = hasPurchaseIntent(customerMessage);
    const messageStatus = intentDetected ? "buying" : "browsing";

    await supabase.from("conversations").insert({
      profile_id: profile.id,
      customer_id: customer.id,
      role: "user",
      message: customerMessage,
      status: messageStatus,
    });

    const history = await getConversationHistory(customer.id, profile.id);
    const systemPrompt =
      aiSettings.system_prompt ||
      `You are ${aiSettings.persona_name}, a ${aiSettings.persona_tone} AI sales assistant.`;

    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: customerMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0]?.message?.content?.trim();
    if (!aiReply) {
      logger.error("OpenAI returned empty response");
      return;
    }

    await sendWhatsAppMessage(customerPhone, aiReply);

    await supabase.from("conversations").insert({
      profile_id: profile.id,
      customer_id: customer.id,
      role: "assistant",
      message: aiReply,
      status: messageStatus,
    });

    if (intentDetected) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", customer.id)
        .eq("status", "pending")
        .single();
      if (!existingOrder) {
        await supabase.from("orders").insert({
          profile_id: profile.id,
          customer_id: customer.id,
          items: [{ name: "Item from WhatsApp", quantity: 1 }],
          total_amount: 0,
          status: "pending",
          notes: `Auto-detected intent from customer message`,
        });
        logger.info(`New pending order created for customer ${customer.id}`);
      }
    }

    if (aiSettings.auto_followup) {
      const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await supabase
        .from("follow_ups")
        .delete()
        .eq("customer_id", customer.id)
        .eq("status", "pending");
      await supabase.from("follow_ups").insert({
        profile_id: profile.id,
        customer_id: customer.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "pending",
        message_preview: `Follow-up scheduled`,
      });
      logger.info(`Follow-up scheduled for customer ${customer.id}`);
    }
  } catch (err) {
    logger.error(`Webhook processing error: ${err.message}`, {
      stack: err.stack,
    });
  }
});

module.exports = router;
