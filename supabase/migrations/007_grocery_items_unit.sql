-- Migration 007: Add unit column to grocery_items
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS unit TEXT;
