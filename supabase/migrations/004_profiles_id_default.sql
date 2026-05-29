-- =============================================================
-- Thuis Kiosk — Fix profiles.id default
-- Migration: 004_profiles_id_default.sql
-- =============================================================
-- After migration 003 dropped the FK from profiles.id → auth.users,
-- the id column no longer has a DEFAULT value.
-- Kid profiles are inserted without an auth_user_id, so PostgreSQL
-- has no id to use. Add gen_random_uuid() as the default.
-- =============================================================

ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
