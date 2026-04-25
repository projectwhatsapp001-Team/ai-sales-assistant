// backend/routes/stream.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const supabase = require("../supabase");
const logger = require("../logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_MESSAGE_LENGTH = 1000;

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
      system_prompt:
        "You are Betty, a friendly AI sales assistant. Keep replies short like texts, not essays.",
      auto_mode: true,
    }
  );
}

async function getConversationHistory(customerId, profileId) {
  const { data } = await supabase
    .from("conversations")
    .select("role, message")
    .eq("customer_id", customerId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data || []).reverse().map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.message,
  }));
}

async function getProfile() {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)
    .single();
  return data;
}

async function setTyping(profileId, customerId, isTyping) {
  try {
    if (isTyping) {
      await supabase
        .from("typing_indicators")
        .upsert(
          { profile_id: profileId, customer_id: customerId, is_typing: true },
          { onConflict: "customer_id" },
        );
    } else {
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("customer_id", customerId);
    }
  } catch (err) {
    logger.warn(`Typing indicator update failed: ${err.message}`);
  }
}

// GET /api/stream
router.get("/", async (req, res) => {
  const { message, customerId } = req.query;

  // ── Input validation ─────────────────────────────────────
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({
        error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.`,
      });
  }

  // ── SSE headers ──────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  function sendEvent(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const profile = await getProfile();
    const aiSettings = profile ? await getAiSettings(profile.id) : null;

    if (profile && customerId) await setTyping(profile.id, customerId, true);
    sendEvent("typing", { isTyping: true });

    const history =
      profile && customerId
        ? await getConversationHistory(customerId, profile.id)
        : [];

    const systemPrompt =
      aiSettings?.system_prompt ||
      "You are Betty, a friendly AI sales assistant. Keep replies short like texts — max 2-3 sentences.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    let fullReply = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        fullReply += token;
        sendEvent("token", { token });
      }
    }

    sendEvent("done", { fullReply });

    if (profile && customerId) await setTyping(profile.id, customerId, false);

    if (profile && customerId && fullReply) {
      await supabase.from("conversations").insert({
        profile_id: profile.id,
        customer_id: customerId,
        role: "assistant",
        message: fullReply,
        status: "browsing",
      });
    }

    logger.info(
      `Stream complete for customer ${customerId} — ${fullReply.length} chars`,
    );
    res.end();
  } catch (err) {
    logger.error(`SSE Stream error: ${err.message}`);
    sendEvent("error", {
      message: "Betty is unavailable right now. Please try again.",
    });
    res.end();
  }
});

module.exports = router;
