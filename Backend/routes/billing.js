// backend/routes/billing.js
// ── Subscription Billing via Paystack ────────────────────────
// Plans: 3-day free trial → monthly paid subscription
// Uses Paystack's recurring billing (subscriptions API)
//
// Flow:
// 1. POST /billing/initialize → creates Paystack plan + customer, returns payment URL
// 2. User pays on Paystack hosted page
// 3. Paystack hits POST /billing/webhook with payment confirmation
// 4. We update profiles.plan in Supabase
// 5. GET /billing/status → returns current plan + trial status

const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const supabase = require("../supabase");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

// ── Plan config ───────────────────────────────────────────────
const PLANS = {
  starter: {
    name: "SalesBot Starter",
    amount: 9900, // GH₵ 99/month in pesewas
    currency: "GHS",
    interval: "monthly",
    description: "Betty AI Sales Assistant — up to 500 conversations/month",
  },
  pro: {
    name: "SalesBot Pro",
    amount: 24900, // GH₵ 249/month
    currency: "GHS",
    interval: "monthly",
    description:
      "Betty AI Sales Assistant — unlimited conversations + analytics",
  },
};

const TRIAL_DAYS = 3;

// ── Paystack helper ───────────────────────────────────────────
async function paystackRequest(method, path, data = null) {
  const res = await axios({
    method,
    url: `${PAYSTACK_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    data,
  });
  return res.data;
}

// ── GET /billing/plans — list available plans ─────────────────
router.get("/plans", (req, res) => {
  res.json({
    trial_days: TRIAL_DAYS,
    plans: Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan,
      amount_display: `GH₵ ${(plan.amount / 100).toFixed(2)}`,
    })),
  });
});

// ── GET /billing/status — current subscription status ─────────
router.get("/status/:profileId", async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, plan, trial_ends_at, subscription_code, is_active")
      .eq("id", req.params.profileId)
      .single();

    if (error) throw error;

    const now = new Date();
    const trialEndsAt = profile.trial_ends_at
      ? new Date(profile.trial_ends_at)
      : null;
    const isInTrial = trialEndsAt && now < trialEndsAt;
    const trialDaysLeft = isInTrial
      ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      plan: profile.plan || "free",
      is_active: profile.is_active,
      is_in_trial: isInTrial,
      trial_days_left: trialDaysLeft,
      trial_ends_at: profile.trial_ends_at,
      has_subscription: !!profile.subscription_code,
      subscription_code: profile.subscription_code,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /billing/initialize — start payment ──────────────────
// Body: { profileId, email, planId: "starter" | "pro" }
router.post("/initialize", async (req, res) => {
  try {
    const { profileId, email, planId = "starter" } = req.body;

    if (!profileId || !email) {
      return res
        .status(400)
        .json({ error: "profileId and email are required" });
    }

    const selectedPlan = PLANS[planId];
    if (!selectedPlan) {
      return res
        .status(400)
        .json({ error: "Invalid plan. Choose: starter or pro" });
    }

    // ── Step 1: Create or get Paystack plan ──────────────
    let paystackPlanCode;
    try {
      const { data: existingPlan } = await paystackRequest(
        "GET",
        `/plan?name=${encodeURIComponent(selectedPlan.name)}`,
      );
      const found = existingPlan?.find((p) => p.name === selectedPlan.name);
      if (found) {
        paystackPlanCode = found.plan_code;
      }
    } catch (_) {}

    if (!paystackPlanCode) {
      const { data: newPlan } = await paystackRequest("POST", "/plan", {
        name: selectedPlan.name,
        interval: selectedPlan.interval,
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        description: selectedPlan.description,
      });
      paystackPlanCode = newPlan.plan_code;
    }

    // ── Step 2: Initialize transaction with trial ─────────
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

    const { data: txn } = await paystackRequest(
      "POST",
      "/transaction/initialize",
      {
        email,
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
        plan: paystackPlanCode,
        metadata: {
          profile_id: profileId,
          plan_id: planId,
          trial_days: TRIAL_DAYS,
          cancel_action: `${process.env.APP_URL || "http://localhost:5173"}/settings`,
        },
        callback_url: `${process.env.APP_URL || "http://localhost:5173"}/billing/success`,
      },
    );

    // ── Step 3: Store trial info in Supabase ──────────────
    await supabase
      .from("profiles")
      .update({
        trial_ends_at: trialEndDate.toISOString(),
        plan: "trial",
      })
      .eq("id", profileId);

    res.json({
      authorization_url: txn.authorization_url,
      access_code: txn.access_code,
      reference: txn.reference,
      trial_ends_at: trialEndDate.toISOString(),
    });
  } catch (err) {
    console.error(
      "Billing initialize error:",
      err.response?.data || err.message,
    );
    res.status(500).json({ error: err.message });
  }
});

// ── POST /billing/cancel — cancel subscription ────────────────
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

    res.json({ success: true, message: "Subscription cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /billing/webhook — Paystack event handler ────────────
// Add this URL in your Paystack dashboard: https://yourdomain.com/api/billing/webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // ── Verify Paystack signature ─────────────────────────
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("❌ Paystack webhook signature mismatch");
      return res.status(401).send("Unauthorized");
    }

    const event = JSON.parse(req.body);
    console.log(`📦 Paystack event: ${event.event}`);

    try {
      switch (event.event) {
        // ── First successful payment (subscription created) ──
        case "subscription.create":
        case "charge.success": {
          const meta = event.data.metadata || {};
          const profileId = meta.profile_id;
          const planId = meta.plan_id || "starter";
          const subscriptionCode = event.data.subscription?.subscription_code;

          if (!profileId) break;

          await supabase
            .from("profiles")
            .update({
              plan: planId === "pro" ? "pro" : "starter",
              is_active: true,
              subscription_code: subscriptionCode || null,
            })
            .eq("id", profileId);

          console.log(`✅ Plan activated: ${planId} for profile ${profileId}`);
          break;
        }

        // ── Subscription renewal ──────────────────────────────
        case "invoice.payment_failed": {
          const subscriptionCode = event.data.subscription?.subscription_code;
          if (subscriptionCode) {
            await supabase
              .from("profiles")
              .update({ is_active: false })
              .eq("subscription_code", subscriptionCode);
            console.log("⚠️ Payment failed — profile deactivated");
          }
          break;
        }

        // ── Subscription cancelled ────────────────────────────
        case "subscription.disable": {
          const subscriptionCode = event.data.subscription_code;
          if (subscriptionCode) {
            await supabase
              .from("profiles")
              .update({
                plan: "free",
                is_active: false,
                subscription_code: null,
              })
              .eq("subscription_code", subscriptionCode);
            console.log("🚫 Subscription cancelled");
          }
          break;
        }
      }
    } catch (err) {
      console.error("Webhook processing error:", err.message);
    }

    res.status(200).send("OK");
  },
);

module.exports = router;
