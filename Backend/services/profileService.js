const supabase = require("./supabaseClient");
const { log } = require("./utils");
const NodeCache = require("node-cache");

// CACHE: 5-minute TTL for settings and profiles
const appCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Safeguard: Prevent cache from growing indefinitely
appCache.on("set", () => {
  if (appCache.keys().length > 1000) {
    log("warn", "cache_memory_guard_triggered", { count: appCache.keys().length });
    appCache.flushAll();
  }
});

/**
 * Get Profile with Caching
 */
async function getProfileId(phoneNumberId) {
  const cacheKey = `profile_${phoneNumberId}`;
  const cachedId = appCache.get(cacheKey);
  if (cachedId) return cachedId;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    const profileId = data?.id || (await supabase.from("profiles").select("id").limit(1).single().then(r => r.data?.id));
    if (profileId) appCache.set(cacheKey, profileId);
    return profileId;
  } catch (error) {
    log("error", "profile_lookup_failed", { error: error.message });
    return null;
  }
}

/**
 * Find or create the customer (Safe Upsert)
 */
async function getOrCreateCustomer(phoneNumber, profileId, fullName = "WhatsApp User") {
  try {
    const { data, error } = await supabase
      .from("customers")
      .upsert({ 
        phone_number: phoneNumber, 
        profile_id: profileId,
        full_name: fullName 
      }, { onConflict: 'phone_number,profile_id' })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log("error", "customer_upsert_failed", { error: error.message });
    return null;
  }
}

module.exports = {
  getProfileId,
  getOrCreateCustomer,
  appCache
};
