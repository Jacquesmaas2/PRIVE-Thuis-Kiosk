-- =============================================================
-- Thuis Kiosk — Kid Profiles & Parent Invite Flow
-- Migration: 003_kid_profiles.sql
-- =============================================================
-- Goals:
--   1. Allow kid profiles without a matching auth.users entry.
--      Kids don't log in — parents manage them on the shared kiosk.
--   2. Add auth_user_id column for profiles that DO have an auth account.
--   3. Update RLS helper functions to use auth_user_id.
-- =============================================================

-- ---------------------------------------------------------------
-- Step 1: Remove the FK constraint from profiles.id → auth.users
--         profiles.id is now just a plain UUID primary key.
-- ---------------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ---------------------------------------------------------------
-- Step 2: Add auth_user_id — the link to auth.users.
--         Only set for profiles that can actually log in (parents/guests).
--         Kid profiles leave this NULL.
-- ---------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
  UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------
-- Step 3: Backfill existing profiles.
--         All profiles created before this migration were registered
--         through Supabase auth, so their id = auth.uid().
-- ---------------------------------------------------------------
UPDATE profiles SET auth_user_id = id;

-- ---------------------------------------------------------------
-- Step 4: Update the RLS helper functions to query by auth_user_id.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_family_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT family_id FROM profiles WHERE auth_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role = 'parent' FROM profiles WHERE auth_user_id = auth.uid()),
    FALSE
  )
$$;
