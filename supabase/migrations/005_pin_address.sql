-- =============================================================
-- Thuis Kiosk — Kid PIN login + Family home address
-- Migration: 005_pin_address.sql
-- =============================================================

-- ---------------------------------------------------------------
-- Step 1: PIN for kid profiles
--   Stored as a bcrypt hash. NULL means no PIN set.
--   Only kid profiles need a PIN (parents use email/password).
-- ---------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- ---------------------------------------------------------------
-- Step 2: Family home address in family_settings
--   Used by location-aware components (weather widget etc).
--   lat/lng are stored as doubles for direct use in API calls.
-- ---------------------------------------------------------------
ALTER TABLE family_settings
  ADD COLUMN IF NOT EXISTS address_line1  TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS postal_code    TEXT,
  ADD COLUMN IF NOT EXISTS country        TEXT NOT NULL DEFAULT 'NL',
  ADD COLUMN IF NOT EXISTS latitude       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude      DOUBLE PRECISION;
