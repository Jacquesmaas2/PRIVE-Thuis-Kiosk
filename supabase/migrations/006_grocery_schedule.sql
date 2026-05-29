-- ============================================================
-- Migration 006: Grocery schedule, manager role & order history
-- ============================================================

-- 1. Grocery manager flag on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_grocery_manager BOOLEAN NOT NULL DEFAULT false;

-- 2. Schedule columns + cycle counter on grocery_lists
ALTER TABLE grocery_lists
  ADD COLUMN IF NOT EXISTS order_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_locked      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle          INT     NOT NULL DEFAULT 1;

-- 3. Permanent order history – never deleted, one row per item per cycle
CREATE TABLE IF NOT EXISTS grocery_order_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID        NOT NULL REFERENCES families(id)  ON DELETE CASCADE,
  cycle       INT         NOT NULL DEFAULT 1,
  list_name   TEXT        NOT NULL,
  item_name   TEXT        NOT NULL,
  quantity    NUMERIC,
  unit        TEXT,
  category    TEXT,
  added_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  adder_name  TEXT,
  added_at    TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick family history lookup
CREATE INDEX IF NOT EXISTS grocery_order_history_family_idx
  ON grocery_order_history (family_id, archived_at DESC);

-- 4. RLS on history table
ALTER TABLE grocery_order_history ENABLE ROW LEVEL SECURITY;

-- Family members can read their own history
CREATE POLICY "family members can read history"
  ON grocery_order_history FOR SELECT
  USING (family_id = auth_family_id());

-- Only parents / grocery managers can insert (via server-side reset)
CREATE POLICY "parents can insert history"
  ON grocery_order_history FOR INSERT
  WITH CHECK (family_id = auth_family_id() AND is_parent());

-- 5. Publish history table to realtime (optional, for live updates)
-- (grocery_items already in realtime; history is read-only for UI)
