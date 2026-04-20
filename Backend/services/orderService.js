const supabase = require("./supabaseClient");
const { appCache } = require("./profileService");
const { normalize, log, generateIdempotencyKey } = require("./utils");
const { extractOrderWithAI } = require("./aiService");

/**
 * Fetch Relevant Products (Smart Ranking)
 */
async function fetchRelevantProducts(profileId, userText) {
  const cacheKey = `products_${profileId}`;
  let products = appCache.get(cacheKey);

  if (!products) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("profile_id", profileId);
    products = data || [];
    appCache.set(cacheKey, products);
  }

  const keywords = userText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (keywords.length === 0) return products.filter(p => p.stock_quantity > 0).slice(0, 5);

  const ranked = products
    .map(p => {
      let score = 0;
      const content = (p.name + " " + p.description).toLowerCase();
      keywords.forEach(k => { if (content.includes(k)) score++; });
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score || b.stock_quantity - a.stock_quantity);

  return ranked.slice(0, 5);
}

/**
 * Order Detection (Idempotency + Real-time Stock)
 */
async function detectOrderIntent(text, profileId, customerId, conversationId, messageId) {
  const quickKeywords = ["buy", "order", "purchase", "i want", "price"];
  if (!quickKeywords.some(k => text.toLowerCase().includes(k))) return;

  const idempotencyKey = generateIdempotencyKey(customerId, text);

  // 🛡️ HARDENED: Use dedicated idempotency_key column
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) return;

  const orderData = await extractOrderWithAI(text, messageId);

  if (orderData.hasIntent && orderData.confidence > 0.7) {
    try {
      const { data: freshProducts } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("profile_id", profileId);

      let total = 0;
      let matchedItems = [];
      let missingItems = [];

      orderData.items.forEach(item => {
        const prod = freshProducts?.find(p => 
          normalize(p.name).includes(normalize(item.item))
        );
        
        if (prod && prod.stock_quantity > 0) {
          total += prod.price * (item.quantity || 1);
          matchedItems.push({ ...item, actual_name: prod.name, price: prod.price });
        } else {
          missingItems.push(item.item);
        }
      });

      if (matchedItems.length > 0) {
        await supabase.from("conversations").update({ status: "buying" }).eq("id", conversationId);
        
        const { error: orderError } = await supabase.from("orders").insert([{
          profile_id: profileId,
          customer_id: customerId,
          conversation_id: conversationId,
          items: matchedItems,
          total_amount: total,
          idempotency_key: idempotencyKey,
          notes: missingItems.length > 0 ? `Missing Items: ${missingItems.join(", ")}` : null
        }]);

        if (orderError) throw orderError;
        log("info", "order_created", { customerId, matchedCount: matchedItems.length, missingCount: missingItems.length });
      }

    } catch (error) {
      log("error", "order_processing_failed", { customerId, error: error.message });
    }
  }
}

module.exports = {
  fetchRelevantProducts,
  detectOrderIntent
};
