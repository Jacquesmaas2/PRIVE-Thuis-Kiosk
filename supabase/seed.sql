-- =============================================================
-- Thuis Kiosk — Seed Data
-- Run after migrations in a fresh Supabase project for local dev.
-- NOTE: real auth users must be created via Supabase Auth first;
-- these UUIDs are placeholders — replace with actual auth.users IDs.
-- =============================================================

-- You can create test users in Supabase Dashboard > Authentication > Users
-- or via the CLI: supabase auth create --email parent@test.nl --password test1234
-- Then copy the generated UUIDs below.

-- Example placeholder UUIDs (replace before running):
-- Parent: 00000000-0000-0000-0000-000000000001
-- Kid 1:  00000000-0000-0000-0000-000000000002
-- Kid 2:  00000000-0000-0000-0000-000000000003

-- =============================================================
-- 1. Family
-- =============================================================
INSERT INTO families (id, name) VALUES
  ('fam00000-0000-0000-0000-000000000001', 'Familie De Vries');

INSERT INTO family_settings (family_id) VALUES
  ('fam00000-0000-0000-0000-000000000001');

-- =============================================================
-- 2. Profiles (assumes auth users already exist with these IDs)
-- =============================================================
INSERT INTO profiles (id, family_id, display_name, role, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'fam00000-0000-0000-0000-000000000001', 'Mama',   'parent', '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000002', 'fam00000-0000-0000-0000-000000000001', 'Lars',   'kid',    '#3b82f6'),
  ('00000000-0000-0000-0000-000000000003', 'fam00000-0000-0000-0000-000000000001', 'Sophie', 'kid',    '#ec4899');

-- =============================================================
-- 3. Tasks
-- =============================================================
INSERT INTO tasks (id, family_id, title, description, points, assigned_to, is_recurring, recurrence_pattern, created_by) VALUES
  (gen_random_uuid(), 'fam00000-0000-0000-0000-000000000001', 'Kamer opruimen',    'Alles van de vloer, bed opmaken',  10, '00000000-0000-0000-0000-000000000002', TRUE,  'daily',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'fam00000-0000-0000-0000-000000000001', 'Afwassen',          'Alle vaat in de vaatwasser',       15, '00000000-0000-0000-0000-000000000003', TRUE,  'daily',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'fam00000-0000-0000-0000-000000000001', 'Huiswerk maken',    NULL,                               20, '00000000-0000-0000-0000-000000000002', TRUE,  'daily',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'fam00000-0000-0000-0000-000000000001', 'Hond uitlaten',     'Min. 20 minuten',                  15, NULL,                                   TRUE,  'daily',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'fam00000-0000-0000-0000-000000000001', 'Vuilnis buiten',    NULL,                               20, NULL,                                   TRUE,  'weekly',  '00000000-0000-0000-0000-000000000001');

-- =============================================================
-- 4. Rewards
-- =============================================================
INSERT INTO rewards (family_id, title, description, points_cost, requires_approval, created_by) VALUES
  ('fam00000-0000-0000-0000-000000000001', '30 min extra schermtijd', NULL,                               25,  FALSE, '00000000-0000-0000-0000-000000000001'),
  ('fam00000-0000-0000-0000-000000000001', 'Snoep uit de pot',        'Eén handje snoep',                 10,  FALSE, '00000000-0000-0000-0000-000000000001'),
  ('fam00000-0000-0000-0000-000000000001', 'Uitje naar bioscoop',     'Familie uitje, kies een film',     200, TRUE,  '00000000-0000-0000-0000-000000000001'),
  ('fam00000-0000-0000-0000-000000000001', 'Laat opblijven (30 min)', NULL,                               50,  TRUE,  '00000000-0000-0000-0000-000000000001');

-- =============================================================
-- 5. Grocery list + items
-- =============================================================
INSERT INTO grocery_lists (id, family_id, name, created_by) VALUES
  ('lst00000-0000-0000-0000-000000000001', 'fam00000-0000-0000-0000-000000000001', 'Boodschappenlijst', '00000000-0000-0000-0000-000000000001');

INSERT INTO grocery_items (list_id, name, quantity, category, added_by) VALUES
  ('lst00000-0000-0000-0000-000000000001', 'Melk',      '2 liter',  'Zuivel',    '00000000-0000-0000-0000-000000000001'),
  ('lst00000-0000-0000-0000-000000000001', 'Brood',     '1 heel',   'Bakkerij',  '00000000-0000-0000-0000-000000000001'),
  ('lst00000-0000-0000-0000-000000000001', 'Kaas',      '500g',     'Zuivel',    '00000000-0000-0000-0000-000000000002'),
  ('lst00000-0000-0000-0000-000000000001', 'Appels',    '1 kg',     'Fruit',     '00000000-0000-0000-0000-000000000003'),
  ('lst00000-0000-0000-0000-000000000001', 'Pasta',     '500g',     'Droog',     '00000000-0000-0000-0000-000000000001');

-- =============================================================
-- 6. Announcements
-- =============================================================
INSERT INTO announcements (family_id, title, content, priority, created_by) VALUES
  ('fam00000-0000-0000-0000-000000000001', 'Welkom bij Thuis Kiosk! 🎉', 'Dit is jullie familie dashboard. Voeg taken, boodschappen en meer toe.', 'high',   '00000000-0000-0000-0000-000000000001'),
  ('fam00000-0000-0000-0000-000000000001', 'Vrijdag is pizza-avond 🍕',   'We eten thuis, iedereen mag een topping kiezen.',                         'normal', '00000000-0000-0000-0000-000000000001');

-- =============================================================
-- 7. Sample points (Lars verdient 50 punten, Sophie 30)
-- =============================================================
INSERT INTO points_ledger (family_id, user_id, amount, reason, reference_type, created_by) VALUES
  ('fam00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 50, 'Welkom bonus', 'manual', '00000000-0000-0000-0000-000000000001'),
  ('fam00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 30, 'Welkom bonus', 'manual', '00000000-0000-0000-0000-000000000001');

-- =============================================================
-- 8. Morning checklist for Lars
-- =============================================================
DO $$
DECLARE
  cl_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO checklists (id, family_id, title, checklist_type, assigned_to, created_by)
  VALUES (cl_id, 'fam00000-0000-0000-0000-000000000001', 'Ochtend routine Lars', 'morning', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001');

  INSERT INTO checklist_items (checklist_id, title, sort_order) VALUES
    (cl_id, 'Tanden poetsen',     1),
    (cl_id, 'Ontbijt eten',       2),
    (cl_id, 'Tas inpakken',       3),
    (cl_id, 'Jas + schoenen aan', 4);
END $$;
