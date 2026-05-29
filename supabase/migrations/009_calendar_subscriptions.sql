-- =============================================================
-- Calendar subscriptions
-- Migration: 009_calendar_subscriptions.sql
-- =============================================================

CREATE TABLE calendar_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT calendar_subscriptions_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT calendar_subscriptions_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_calendar_subscriptions_family_id ON calendar_subscriptions(family_id);

ALTER TABLE calendar_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_subscriptions_select ON calendar_subscriptions
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY calendar_subscriptions_insert ON calendar_subscriptions
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY calendar_subscriptions_update ON calendar_subscriptions
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

CREATE POLICY calendar_subscriptions_delete ON calendar_subscriptions
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

CREATE TRIGGER trg_calendar_subscriptions_updated_at
  BEFORE UPDATE ON calendar_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
