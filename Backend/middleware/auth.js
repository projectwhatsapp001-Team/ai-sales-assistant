// Backend/middleware/auth.js
const supabase = require("../supabase");
const logger = require("../logger");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization required" }); // generic message
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token)
      return res.status(401).json({ error: "Authorization required" });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      // Don't reveal WHY auth failed (account enumeration prevention)
      return res.status(401).json({ error: "Authorization required" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, plan, is_active, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return res
        .status(403)
        .json({ error: "Account not set up. Please complete onboarding." });
    }

    // Subscription check
    const isPaid = ["starter", "pro"].includes(profile.plan);
    const trialEndsAt = profile.trial_ends_at
      ? new Date(profile.trial_ends_at)
      : null;
    const isInTrial = trialEndsAt != null && new Date() < trialEndsAt;

    if (!isPaid && !isInTrial) {
      return res
        .status(402)
        .json({ error: "Subscription required", code: "SUBSCRIPTION_EXPIRED" });
    }

    req.user = user;
    req.profileId = profile.id;
    req.profile = profile;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    // Distinguish between auth errors and server errors
    if (err.message.includes("invalid") || err.message.includes("expired")) {
      return res.status(401).json({ error: "Authorization required" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};
