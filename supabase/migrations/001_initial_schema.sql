-- =============================================================
-- Thuis Kiosk — Initial Schema
-- Migration: 001_initial_schema.sql
-- =============================================================

-- Enable UUID generation (gen_random_uuid is built-in since Postgres 13;
-- pgcrypto is NOT required and is intentionally omitted to avoid schema-path
-- issues on Supabase hosted Postgres).

-- =============================================================
-- FAMILIES / HOUSEHOLDS
-- =============================================================
CREATE TABLE families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_settings (
  family_id                UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  timezone                 TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  locale                   TEXT NOT NULL DEFAULT 'nl',
  theme                    TEXT NOT NULL DEFAULT 'light',
  screen_time_per_point    INTEGER NOT NULL DEFAULT 5, -- minutes schermtijd per punt
  settings                 JSONB NOT NULL DEFAULT '{}',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USERS / PROFILES (extends Supabase auth.users)
-- =============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id     UUID REFERENCES families(id) ON DELETE SET NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'kid' CHECK (role IN ('parent', 'kid', 'guest')),
  date_of_birth DATE,
  locale        TEXT NOT NULL DEFAULT 'nl',
  color         TEXT NOT NULL DEFAULT '#6366f1', -- accent colour per user
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invitation tokens (parent can invite other users to their family)
CREATE TABLE invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'kid' CHECK (role IN ('parent', 'kid', 'guest')),
  token       TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  invited_by  UUID NOT NULL REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TASKS & TASK INSTANCES
-- =============================================================
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  points              INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  assigned_to         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date            DATE,
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern  TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_instances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'approved', 'rejected', 'skipped')),
  completed_at TIMESTAMPTZ,
  approved_by  UUID REFERENCES profiles(id),
  approved_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- POINTS LEDGER (append-only)
-- =============================================================
CREATE TABLE points_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL, -- positive = earned, negative = spent
  reason         TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('task', 'reward', 'screen_time', 'manual')),
  reference_id   UUID,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View: current balance per user
CREATE VIEW user_points_balance AS
  SELECT
    user_id,
    family_id,
    SUM(amount) AS balance,
    MAX(created_at) AS last_updated
  FROM points_ledger
  GROUP BY user_id, family_id;

-- =============================================================
-- REWARDS & REDEMPTIONS
-- =============================================================
CREATE TABLE rewards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  points_cost       INTEGER NOT NULL CHECK (points_cost > 0),
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  reward_id    UUID NOT NULL REFERENCES rewards(id),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  points_spent INTEGER NOT NULL,
  approved_by  UUID REFERENCES profiles(id),
  approved_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GROCERY LISTS
-- =============================================================
CREATE TABLE grocery_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Boodschappenlijst',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE grocery_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    TEXT,
  category    TEXT,
  is_checked  BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by  UUID REFERENCES profiles(id),
  checked_at  TIMESTAMPTZ,
  added_by    UUID NOT NULL REFERENCES profiles(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- MEAL PLANNER
-- =============================================================
CREATE TABLE meal_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, week_start)
);

CREATE TABLE meals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon
  meal_type    TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  title        TEXT NOT NULL,
  recipe_url   TEXT,
  notes        TEXT,
  UNIQUE (plan_id, day_of_week, meal_type)
);

-- =============================================================
-- DAILY CHECKLISTS (Morning / Evening routines)
-- =============================================================
CREATE TABLE checklists (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('morning', 'evening', 'custom')),
  assigned_to    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     UUID NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checklist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checklist_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (checklist_item_id, user_id, completed_date)
);

-- =============================================================
-- ANNOUNCEMENTS
-- =============================================================
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  priority   TEXT NOT NULL DEFAULT 'normal'
             CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- HOMEWORK
-- =============================================================
CREATE TABLE homework (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SCREEN TIME CREDITS
-- =============================================================
CREATE TABLE screen_time_credits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  minutes        INTEGER NOT NULL,
  reason         TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('task', 'reward', 'manual')),
  reference_id   UUID,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE VIEW user_screen_time_balance AS
  SELECT
    user_id,
    family_id,
    SUM(minutes) AS total_minutes,
    MAX(created_at) AS last_updated
  FROM screen_time_credits
  GROUP BY user_id, family_id;

-- =============================================================
-- CONTACTS
-- =============================================================
CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  relationship TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- PHOTO ALBUMS
-- =============================================================
CREATE TABLE albums (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  cover_photo UUID,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id     UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption      TEXT,
  taken_at     TIMESTAMPTZ,
  uploaded_by  UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- forward-reference cover_photo
ALTER TABLE albums ADD CONSTRAINT albums_cover_photo_fk
  FOREIGN KEY (cover_photo) REFERENCES photos(id) ON DELETE SET NULL;

-- =============================================================
-- QUICK NOTES
-- =============================================================
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL DEFAULT '',
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CALENDAR EVENTS
-- =============================================================
CREATE TABLE calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  all_day     BOOLEAN NOT NULL DEFAULT FALSE,
  color       TEXT DEFAULT '#6366f1',
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many: events ↔ attendees
CREATE TABLE event_attendees (
  event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- =============================================================
-- CHORE SCHEDULER
-- =============================================================
CREATE TABLE chore_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, week_start, day_of_week)
);

-- =============================================================
-- REMINDERS
-- =============================================================
CREATE TABLE reminders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  remind_at  TIMESTAMPTZ NOT NULL,
  is_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SMART HOME LINKS / TILES
-- =============================================================
CREATE TABLE smart_home_tiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  icon       TEXT,
  url        TEXT,
  color      TEXT DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SCHOOL HUB
-- =============================================================
CREATE TABLE school_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL, -- null = all
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- AUDIT LOG (append-only, no RLS delete/update)
-- =============================================================
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID REFERENCES families(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  payload       JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_task_instances_task_id ON task_instances(task_id);
CREATE INDEX idx_task_instances_assigned_to ON task_instances(assigned_to);
CREATE INDEX idx_task_instances_due_date ON task_instances(due_date);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);
CREATE INDEX idx_points_ledger_family_id ON points_ledger(family_id);
CREATE INDEX idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX idx_grocery_items_is_checked ON grocery_items(is_checked);
CREATE INDEX idx_announcements_family_id ON announcements(family_id);
CREATE INDEX idx_homework_user_id ON homework(user_id);
CREATE INDEX idx_audit_log_family_id ON audit_log(family_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX idx_checklist_entries_completed_date ON checklist_entries(completed_date);

-- =============================================================
-- UPDATED_AT trigger helper
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_redemptions_updated_at
  BEFORE UPDATE ON redemptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_homework_updated_at
  BEFORE UPDATE ON homework
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
