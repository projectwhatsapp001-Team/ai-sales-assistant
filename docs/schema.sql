-- ============================================================
-- AI WhatsApp Sales Assistant — PostgreSQL Schema for Supabase
-- File: docs/schema.sql
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: profiles
-- One row per business using the AI Sales Assistant
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  phone_number  TEXT,
  industry      TEXT,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: customers
-- People who message the business via WhatsApp
-- ============================================================
CREATE TABLE customers (
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
-- Every WhatsApp message — powers ConversationsPage.jsx
-- ============================================================
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  message     TEXT NOT NULL,
  embedding   VECTOR(1536),
  status      TEXT DEFAULT 'browsing'
                CHECK (status IN ('buying','browsing','ordered','abandoned')),
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: orders
-- Auto-logged when AI detects purchase intent
-- Powers OrdersPage.jsx
-- ============================================================
CREATE TABLE orders (
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
-- Abandoned cart tracking — powers FollowUpsPage.jsx
-- ============================================================
CREATE TABLE follow_ups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','replied','cancelled')),
  message_preview TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: ai_settings
-- AI persona config + auto-reply toggle per business
-- ============================================================
CREATE TABLE ai_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  persona_name  TEXT DEFAULT 'Sales Assistant',
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
-- INDEXES
-- ============================================================
CREATE INDEX idx_customers_profile      ON customers(profile_id);
CREATE INDEX idx_conversations_profile  ON conversations(profile_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status   ON conversations(status);
CREATE INDEX idx_orders_profile         ON orders(profile_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_followups_profile      ON follow_ups(profile_id);
CREATE INDEX idx_followups_status       ON follow_ups(status);

-- AI memory vector search index
CREATE INDEX idx_conversations_embedding
  ON conversations USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

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

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_followups_updated
  BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ai_settings_updated
  BEFORE UPDATE ON ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner access"
  ON profiles FOR ALL USING (auth.uid() = user_id);

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