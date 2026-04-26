const supabase = require("../supabase");
const logger = require("../logger");
const { CONVERSATION_HISTORY_LIMIT } = require("../lib/constants");
const { validatePhone } = require("./validate");

async function getProfileByUserId(userId) {
  if (!userId) throw new Error("userId required");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(`Profile not found: ${error.message}`);
  return data;
}

async function getProfile(profileId) {
  if (!profileId) throw new Error("profileId required");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (error) throw new Error(`Failed to get profile: ${error.message}`);
  if (!data) throw new Error("No profile found");
  return data;
}

// Find profile by customer phone (for webhook context)
async function getProfileByCustomerPhone(phone) {
  if (!phone) throw new Error("phone required");
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("profile_id")
      .eq("phone_number", phone)
      .limit(1)
      .single();
    if (customer?.profile_id) {
      return await getProfile(customer.profile_id);
    }
  } catch (err) {
    logger.warn(`No profile found for phone ${phone}`);
  }
  return null;
}

async function getAiSettings(profileId) {
  if (!profileId) throw new Error("profileId required");
  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("profile_id", profileId)
    .single();
  if (error && error.code === "PGRST116") {
    return {
      persona_name: "Betty",
      persona_tone: "friendly",
      system_prompt:
        "You are Betty, a friendly AI sales assistant. Keep replies short — max 2-3 sentences.",
      auto_mode: true,
      auto_followup: true,
    };
  }
  if (error) throw new Error(`AI settings error: ${error.message}`);
  return data;
}

async function getConversationHistory(
  customerId,
  profileId,
  limit = CONVERSATION_HISTORY_LIMIT,
) {
  if (!customerId || !profileId) return [];
  const { data, error } = await supabase
    .from("conversations")
    .select("role,message")
    .eq("customer_id", customerId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    logger.warn(`History failed: ${error.message}`);
    return [];
  }
  return (data || [])
    .filter(
      (r) => r && typeof r.role === "string" && typeof r.message === "string",
    )
    .reverse()
    .map((r) => ({
      role: r.role === "assistant" ? "assistant" : "user",
      content: r.message,
    }));
}

async function findOrCreateCustomer(phone, profileId) {
  if (!phone || !profileId) throw new Error("phone and profileId required");
  const phoneErr = validatePhone(phone);
  if (phoneErr) throw new Error(phoneErr);
  const cleaned = phone.replace(/[\s\-().]/g, "");
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      { phone_number: cleaned, profile_id: profileId },
      { onConflict: "phone_number,profile_id", ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) {
    logger.warn(`Upsert failed, fallback select: ${error.message}`);
    const { data: ex, error: se } = await supabase
      .from("customers")
      .select("*")
      .eq("phone_number", cleaned)
      .eq("profile_id", profileId)
      .single();
    if (se || !ex)
      throw new Error(`Cannot find/create customer: ${error.message}`);
    return ex;
  }
  return data;
}

function isSubscriptionActive(profile) {
  if (!profile) return false;
  const isPaid = ["starter", "pro"].includes(profile.plan);
  const t = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  return isPaid || (t != null && new Date() < t);
}

module.exports = {
  getProfile,
  getProfileByUserId,
  getAiSettings,
  getConversationHistory,
  findOrCreateCustomer,
  isSubscriptionActive,
};
