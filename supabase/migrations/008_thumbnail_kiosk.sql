-- ============================================================
-- Migration 008: Grocery thumbnail + kiosk account support
-- ============================================================

-- 1. Thumbnail URL on grocery_items (filled automatically via OpenFoodFacts)
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. is_kiosk flag on profiles (hides the auto-created kiosk service account from UI)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_kiosk BOOLEAN NOT NULL DEFAULT false;

-- 3. Reference to the Supabase auth user created for kiosk PIN login
ALTER TABLE family_settings
  ADD COLUMN IF NOT EXISTS kiosk_auth_user_id UUID;
