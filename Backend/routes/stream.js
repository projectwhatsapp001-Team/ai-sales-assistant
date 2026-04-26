// Backend/routes/stream.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const logger = require("../logger");
const supabase = require("../supabase");
const auth = require("../middleware/auth");
const { getAiSettings, getConversationHistory } = require("../lib/profile");
const {
  OPENAI_MODEL,
  OPENAI_STREAM_TOKENS,
  OPENAI_TEMPERATURE,
  OPENAI_TIMEOUT_MS,
  MAX_STREAM_MESSAGE_LENGTH,
  STREAM_HISTORY_LIMIT,
} = require("../lib/constants");
const { validateMessage } = require("../lib/validate");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: OPENAI_TIMEOUT_MS,
});

async function setTyping(profileId, customerId, isTyping) {
  if (!profileId || !customerId) return;
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
    logger.warn(`Typing indicator failed: ${err.message}`);
  }
}

// Auth middleware applied explicitly on this route
router.get("/", auth, async (req, res) => {
  const { message, customerId } = req.query;

  // Validate message
  const msgErr = validateMessage(message);
  if (msgErr) return res.status(400).json({ error: msgErr });
  if (message.length > MAX_STREAM_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({
        error: `Message too long. Max ${MAX_STREAM_MESSAGE_LENGTH} chars.`,
      });
  }
  if (
    !customerId ||
    typeof customerId !== "string" ||
    customerId.trim() === ""
  ) {
    return res.status(400).json({ error: "customerId is required" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL || "*");
  res.flushHeaders();

  let clientConnected = true;
  let streamAbortController = new AbortController();

  // Remove listener on cleanup, not just on "close"
  function onClose() {
    clientConnected = false;
    streamAbortController.abort();
    logger.info(`Client disconnected during stream`);
  }
  req.once("close", onClose);

  function sendEvent(event, data) {
    if (!clientConnected) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (_) {}
  }

  const profileId = req.profileId;

  try {
    const [aiSettings, history] = await Promise.all([
      getAiSettings(profileId),
      getConversationHistory(customerId, profileId, STREAM_HISTORY_LIMIT),
    ]);

    await setTyping(profileId, customerId, true);
    sendEvent("typing", { isTyping: true });

    const systemPrompt =
      (aiSettings?.system_prompt || "").trim() ||
      "You are Betty, a friendly AI sales assistant. Keep replies short — max 2-3 sentences.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message.trim() },
    ];

    let fullReply = "";

    try {
      const stream = await openai.chat.completions.create(
        {
          model: OPENAI_MODEL,
          messages,
          max_tokens: OPENAI_STREAM_TOKENS,
          temperature: OPENAI_TEMPERATURE,
          stream: true,
        },
        { signal: streamAbortController.signal },
      );

      for await (const chunk of stream) {
        if (!clientConnected) break;
        const token = chunk.choices?.[0]?.delta?.content;
        if (typeof token === "string" && token) {
          fullReply += token;
          sendEvent("token", { token });
        }
      }
    } catch (aiErr) {
      if (aiErr.name === "AbortError") {
        logger.info("Stream aborted by client disconnect");
      } else {
        logger.error(`OpenAI stream error: ${aiErr.message}`);
        sendEvent("error", {
          message: "Betty is unavailable. Please try again.",
        });
      }
      await setTyping(profileId, customerId, false);
      req.removeListener("close", onClose);
      return res.end();
    }

    sendEvent("done", { fullReply: fullReply || "" });
    await setTyping(profileId, customerId, false);

    // Save reply only if non-empty
    if (fullReply.trim() && profileId && customerId) {
      try {
        await supabase.from("conversations").insert({
          profile_id: profileId,
          customer_id: customerId,
          role: "assistant",
          message: fullReply.trim(),
          status: "browsing",
        });
      } catch (err) {
        logger.error(`Save stream reply failed: ${err.message}`);
      }
    }

    logger.info(`Stream complete — ${fullReply.length} chars`);
  } catch (err) {
    logger.error(`Stream route error: ${err.message}`);
    sendEvent("error", { message: "Something went wrong. Please try again." });
    await setTyping(profileId, customerId, false).catch(() => {});
  } finally {
    req.removeListener("close", onClose);
    res.end();
  }
});

module.exports = router;
