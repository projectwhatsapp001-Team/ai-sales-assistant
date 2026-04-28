-- ============================================================
-- AI WhatsApp Sales Assistant — PostgreSQL Schema for Supabase
-- File: docs/schema.sql
-- Run this in your Supabase SQL editor (Project → SQL Editor)
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: profiles
-- One row per business. Includes billing/subscription fields.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name     TEXT NOT NULL DEFAULT 'My Business',
  phone_number      TEXT,
  email             TEXT,
  full_name         TEXT,
  industry          TEXT,
  currency          TEXT DEFAULT 'GHS',
  timezone          TEXT DEFAULT 'Africa/Accra',

  -- Subscription / billing
  plan              TEXT DEFAULT 'free' CHECK (plan IN ('free', 'trial', 'starter', 'pro', 'enterprise')),
  is_active         BOOLEAN DEFAULT false,
  trial_ends_at     TIMESTAMPTZ,
  subscription_code TEXT,           -- Paystack subscription code

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone_number TEXT NOT NULL,
  email        TEXT,
  tags         TEXT[],
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: conversations
-- Added: needs_human flag for human handoff feature
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  message     TEXT NOT NULL,
  embedding   VECTOR(1536),
  status      TEXT DEFAULT 'browsing'
                CHECK (status IN ('buying','browsing','ordered','abandoned','asking','follow-up')),
  needs_human BOOLEAN DEFAULT false,   -- ← NEW: triggers human handoff alert
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  total_amount    NUMERIC(10, 2) DEFAULT 0.00,
  currency        TEXT DEFAULT 'GHS',
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','delivered','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: follow_ups
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  type            TEXT DEFAULT 'abandoned_cart',
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','replied','cancelled','failed')),
  message_preview TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ai_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  persona_name  TEXT DEFAULT 'Betty',
  persona_tone  TEXT DEFAULT 'friendly'
                  CHECK (persona_tone IN ('friendly','professional','playful','formal')),
  system_prompt TEXT,
  auto_mode     BOOLEAN DEFAULT true,
  auto_followup BOOLEAN DEFAULT true,
  language      TEXT DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: typing_indicators (for SSE typing bubbles)
-- ============================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID,
  is_typing   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_profile      ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_profile  ON conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status   ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_orders_profile         ON orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_followups_profile      ON follow_ups(profile_id);
CREATE INDEX IF NOT EXISTS idx_followups_status       ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user          ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription  ON profiles(subscription_code);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_followups_updated
  BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_ai_settings_updated
  BEFORE UPDATE ON ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Profiles: user owns their own profile
CREATE POLICY "profiles: owner access"
  ON profiles FOR ALL USING (auth.uid() = user_id);

-- Helper: get profile IDs for the current user
CREATE POLICY "customers: owner access"
  ON customers FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "conversations: owner access"
  ON conversations FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "orders: owner access"
  ON orders FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "follow_ups: owner access"
  ON follow_ups FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "ai_settings: owner access"
  ON ai_settings FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "typing: owner access"
  ON typing_indicators FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- FUNCTION: auto-create profile row on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, business_name, email, is_active, trial_ends_at, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    NEW.email,
    true,
    NOW() + INTERVAL '3 days',   -- 3-day free trial starts on signup
    'trial'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: runs after a new user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();