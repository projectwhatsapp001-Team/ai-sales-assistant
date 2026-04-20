const { OpenAI } = require("openai");
const { withRetry, log } = require("./utils");
const supabase = require("./supabaseClient");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_SYSTEM_PROMPT = `
You are BETTY, an elite AI WhatsApp sales assistant.

Sales Persona Rules:
- Mention real prices and availability from the context.
- If a product is out of stock, suggest a similar alternative immediately.
- Always ask a closing question (e.g., "Would you like me to reserve that Adidas for you?").
- Keep replies professional but persuasive.
`;

/**
 * Generate AI Response (Sales Optimized)
 */
async function generateAIResponse(userMessage, profileId, customerId, messageId, productContext) {
  try {
    const startTime = Date.now();
    
    const { data: history } = await supabase
      .from("conversations")
      .select("role, message")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5);

    const messages = [
      { role: "system", content: `${DEFAULT_SYSTEM_PROMPT}\n\nINVENTORY:\n${productContext}` },
      ...(history || []).reverse().map(msg => ({ role: msg.role, content: msg.message })),
      { role: "user", content: userMessage }
    ];

    const response = await withRetry(() => 
      openai.chat.completions.create({ model: "gpt-4o-mini", messages })
    );

    log("info", "ai_response_generated", { messageId, duration: Date.now() - startTime });
    return response.choices[0].message.content;
  } catch (error) {
    log("error", "ai_generation_failed", { messageId, error: error.message });
    return "I'm having a quick breather. What can I help you find?";
  }
}

/**
 * Elite AI Order Extraction
 */
async function extractOrderWithAI(text, messageId) {
  try {
    const prompt = `
      Extract order details from this message in JSON format.
      Message: "${text}"
      JSON Structure: { "hasIntent": boolean, "items": [{"item": string, "quantity": number}], "confidence": number }
    `;

    const response = await withRetry(() => 
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Data extraction assistant. Valid JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    );

    const data = JSON.parse(response.choices[0].message.content);
    if (!Array.isArray(data.items)) data.items = [];
    return data;
  } catch (error) {
    log("error", "ai_extraction_failed", { messageId, error: error.message });
    return { hasIntent: false, items: [], confidence: 0 };
  }
}

module.exports = {
  openai,
  generateAIResponse,
  extractOrderWithAI
};
