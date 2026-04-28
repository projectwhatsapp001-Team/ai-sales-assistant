// Backend/routes/billing.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const supabase = require("../supabase");
const logger = require("../logger");
const {
  validateEmail,
  validatePlanId,
  validatePaystackUrl,
} = require("../lib/validate");
const { PAYSTACK_TIMEOUT_MS, VALID_PLAN_IDS } = require("../lib/constants");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";
const TRIAL_DAYS = 3;

const PLANS = {
  starter: {
    name: "SalesBot Starter",
    amount: 9900,
    currency: "GHS",
    interval: "monthly",
    description: "Betty AI — up to 500 conversations/month",
  },
  pro: {
    name: "SalesBot Pro",
    amount: 24900,
    currency: "GHS",
    interval: "monthly",
    description: "Betty AI — unlimited conversations",
  },
};

async function paystackRequest(method, path, data = null) {
  try {
    const res = await axios({
      method,
      url: `${PAYSTACK_BASE}${path}`,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      data,
      timeout: PAYSTACK_TIMEOUT_MS,
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    throw new Error(`Paystack API error: ${detail}`);
  }
}

// GET /api/billing/plans
router.get("/plans", (_req, res) => {
  res.json({
    trial_days: TRIAL_DAYS,
    plans: Object.entries(PLANS).map(([id, p]) => ({
      id,
      ...p,
      amount_display: `GH₵ ${(p.amount / 100).toFixed(2)}`,
    })),
  });
});

// GET /api/billing/status/:profileId
router.get("/status/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, plan, trial_ends_at, subscription_code, is_active")
      .eq("id", profileId)
      .single();

    if (error) {
      return res
        .status(500)
        .json({ error: "Error fetching profile: " + error.message });
    }

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const now = new Date();
    const trialEndsAt = profile.trial_ends_at
      ? new Date(profile.trial_ends_at)
      : null;
    const isInTrial = trialEndsAt != null && now < trialEndsAt;
    const trialDaysLeft = isInTrial
      ? Math.ceil((trialEndsAt - now) / 86400000)
      : 0;

    res.json({
      plan: profile.plan || "free",
      is_active: profile.is_active,
      is_in_trial: isInTrial,
      trial_days_left: trialDaysLeft,
      trial_ends_at: profile.trial_ends_at,
      has_subscription: !!profile.subscription_code,
    });
  } catch (err) {
    logger.error(`Billing status error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/billing/initialize
router.post("/initialize", async (req, res) => {
  try {
    const { profileId, email, planId = "starter" } = req.body;

    // Validate all inputs
    if (!profileId)
      return res.status(400).json({ error: "profileId is required" });
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    const planErr = validatePlanId(planId);
    if (planErr) return res.status(400).json({ error: planErr });

    const selectedPlan = PLANS[planId];

    // Create or get Paystack plan
    let paystackPlanCode;
    try {
      const { data: existingPlans } = await paystackRequest(
        "GET",
        `/plan?perPage=50`,
      );
      const found =
        Array.isArray(existingPlans) &&
        existingPlans.find((p) => p.name === selectedPlan.name);
      paystackPlanCode = found?.plan_code;
    } catch (err) {
      logger.warn(`Could not fetch existing plans: ${err.message}`);
    }

    if (!paystackPlanCode) {
      const { data: newPlan } = await paystackRequest("POST", "/plan", {
        name: selectedPlan.name,
        interval: selectedPlan.interval,
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
      });
      paystackPlanCode = newPlan?.plan_code;
      if (!paystackPlanCode) throw new Error("Failed to create Paystack plan");
    }

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 86400000);

    const { data: txn } = await paystackRequest(
      "POST",
      "/transaction/initialize",
      {
        email: email.trim(),
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        plan: paystackPlanCode,
        metadata: {
          profile_id: profileId,
          plan_id: planId,
          trial_days: TRIAL_DAYS,
        },
        callback_url: `${appUrl}/billing/success`,
      },
    );

    // Validate the returned URL before sending to client
    if (
      !txn?.authorization_url ||
      !validatePaystackUrl(txn.authorization_url)
    ) {
      throw new Error("Invalid payment URL received from Paystack");
    }

    // Store trial info
    await supabase
      .from("profiles")
      .update({ trial_ends_at: trialEndDate.toISOString(), plan: "trial" })
      .eq("id", profileId);

    res.json({
      authorization_url: txn.authorization_url,
      reference: txn.reference,
      trial_ends_at: trialEndDate.toISOString(),
    });
  } catch (err) {
    logger.error(`Billing initialize error: ${err.message}`);
    res.status(500).json({ error: err.message }); // real error message for debugging
  }
});

// POST /api/billing/cancel
router.post("/cancel", async (req, res) => {
  try {
    const { profileId, subscriptionCode, emailToken } = req.body;
    if (!subscriptionCode || !emailToken) {
      return res
        .status(400)
        .json({ error: "subscriptionCode and emailToken required" });
    }
    await paystackRequest("POST", "/subscription/disable", {
      code: subscriptionCode,
      token: emailToken,
    });
    await supabase
      .from("profiles")
      .update({ plan: "free", subscription_code: null })
      .eq("id", profileId);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Cancel subscription error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/webhook — Paystack events
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  if (!signature) return res.status(401).send("Missing signature");

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(req.body)
    .digest("hex");
  if (hash !== signature) {
    logger.error("Paystack webhook signature mismatch");
    return res.status(401).send("Unauthorized");
  }

  let event;
  try {
    event = JSON.parse(req.body);
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  logger.info(`Paystack event: ${event.event}`);
  res.status(200).send("OK"); // respond immediately

  try {
    switch (event.event) {
      case "subscription.create":
      case "charge.success": {
        const meta = event.data?.metadata;
        const profileId = meta?.profile_id;
        const planId = meta?.plan_id || "starter";
        if (!profileId) {
          logger.warn("Paystack event missing profile_id");
          break;
        }
        const plan = VALID_PLAN_IDS.includes(planId) ? planId : "starter";
        const subCode = event.data?.subscription?.subscription_code || null;
        await supabase
          .from("profiles")
          .update({ plan, is_active: true, subscription_code: subCode })
          .eq("id", profileId);
        logger.info(`Plan activated: ${plan} for profile ${profileId}`);
        break;
      }
      case "invoice.payment_failed": {
        const subCode = event.data?.subscription?.subscription_code;
        if (subCode) {
          await supabase
            .from("profiles")
            .update({ is_active: false })
            .eq("subscription_code", subCode);
          logger.warn(
            `Payment failed — profile deactivated for subscription ${subCode}`,
          );
        }
        break;
      }
      case "subscription.disable": {
        const subCode = event.data?.subscription_code;
        if (subCode) {
          await supabase
            .from("profiles")
            .update({ plan: "free", is_active: false, subscription_code: null })
            .eq("subscription_code", subCode);
          logger.info(`Subscription cancelled: ${subCode}`);
        }
        break;
      }
      default:
        logger.info(`Unhandled Paystack event: ${event.event}`);
    }
  } catch (err) {
    logger.error(`Paystack webhook processing error: ${err.message}`);
  }
});

module.exports = router;
