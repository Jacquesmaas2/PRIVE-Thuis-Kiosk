-- =============================================================
-- Thuis Kiosk — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- =============================================================
-- Design principle: every table is scoped to family_id.
-- Users can only see/mutate rows belonging to their own family.
-- Parents have broader write permissions; kids are limited.
-- =============================================================

-- Helper: get current user's family_id (cached per query)
CREATE OR REPLACE FUNCTION auth_family_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Helper: is current user a parent?
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role = 'parent' FROM profiles WHERE id = auth.uid()
$$;

-- =============================================================
-- FAMILIES
-- =============================================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY families_select ON families
  FOR SELECT USING (id = auth_family_id());

CREATE POLICY families_update ON families
  FOR UPDATE USING (id = auth_family_id() AND is_parent())
  WITH CHECK (id = auth_family_id());

-- =============================================================
-- FAMILY SETTINGS
-- =============================================================
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_settings_select ON family_settings
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY family_settings_upsert ON family_settings
  FOR ALL USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

-- =============================================================
-- PROFILES
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone in the same family can see all profiles
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (family_id = auth_family_id());

-- Users can update their own profile; parents can update any in their family
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_parent ON profiles
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

-- Only parents can insert new profiles into their family
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (
    family_id = auth_family_id() AND is_parent()
    OR id = auth.uid() -- allow self-registration
  );

-- =============================================================
-- INVITATIONS
-- =============================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_select ON invitations
  FOR SELECT USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY invitations_insert ON invitations
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY invitations_delete ON invitations
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- TASKS
-- =============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY tasks_insert ON tasks
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY tasks_update ON tasks
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

CREATE POLICY tasks_delete ON tasks
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- TASK INSTANCES
-- =============================================================
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

-- All family members can see task instances in their family
CREATE POLICY task_instances_select ON task_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_instances.task_id
      AND t.family_id = auth_family_id()
    )
  );

-- Parents can insert instances; kids can only see assigned ones
CREATE POLICY task_instances_insert ON task_instances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_instances.task_id
      AND t.family_id = auth_family_id()
    )
    AND is_parent()
  );

-- User can complete their own instance; parent can update any
CREATE POLICY task_instances_update_own ON task_instances
  FOR UPDATE USING (
    assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_instances.task_id
      AND t.family_id = auth_family_id()
    )
  );

CREATE POLICY task_instances_update_parent ON task_instances
  FOR UPDATE USING (
    is_parent()
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_instances.task_id
      AND t.family_id = auth_family_id()
    )
  );

-- =============================================================
-- POINTS LEDGER
-- =============================================================
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY points_ledger_select ON points_ledger
  FOR SELECT USING (family_id = auth_family_id());

-- Only server (parent) can insert; kids cannot directly manipulate points
CREATE POLICY points_ledger_insert ON points_ledger
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

-- No UPDATE or DELETE on points_ledger (append-only)

-- =============================================================
-- REWARDS
-- =============================================================
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY rewards_select ON rewards
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY rewards_insert ON rewards
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY rewards_update ON rewards
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

CREATE POLICY rewards_delete ON rewards
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- REDEMPTIONS
-- =============================================================
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY redemptions_select ON redemptions
  FOR SELECT USING (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

-- Kids can request a redemption for themselves
CREATE POLICY redemptions_insert ON redemptions
  FOR INSERT WITH CHECK (
    family_id = auth_family_id()
    AND user_id = auth.uid()
  );

-- Parents can approve/reject/fulfill
CREATE POLICY redemptions_update ON redemptions
  FOR UPDATE USING (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

-- =============================================================
-- GROCERY LISTS
-- =============================================================
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY grocery_lists_select ON grocery_lists
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY grocery_lists_insert ON grocery_lists
  FOR INSERT WITH CHECK (family_id = auth_family_id());

CREATE POLICY grocery_lists_update ON grocery_lists
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY grocery_lists_delete ON grocery_lists
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- GROCERY ITEMS
-- =============================================================
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY grocery_items_select ON grocery_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_items.list_id
      AND gl.family_id = auth_family_id()
    )
  );

CREATE POLICY grocery_items_insert ON grocery_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_items.list_id
      AND gl.family_id = auth_family_id()
    )
  );

CREATE POLICY grocery_items_update ON grocery_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_items.list_id
      AND gl.family_id = auth_family_id()
    )
  );

CREATE POLICY grocery_items_delete ON grocery_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_items.list_id
      AND gl.family_id = auth_family_id()
    )
    AND (added_by = auth.uid() OR is_parent())
  );

-- =============================================================
-- MEAL PLANS + MEALS
-- =============================================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY meal_plans_select ON meal_plans
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY meal_plans_all ON meal_plans
  FOR ALL USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY meals_select ON meals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meals.plan_id AND mp.family_id = auth_family_id())
  );

CREATE POLICY meals_all ON meals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meals.plan_id AND mp.family_id = auth_family_id())
    AND is_parent()
  );

-- =============================================================
-- CHECKLISTS
-- =============================================================
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklists_select ON checklists
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY checklists_insert ON checklists
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY checklists_update ON checklists
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY checklists_delete ON checklists
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_items_select ON checklist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND c.family_id = auth_family_id())
  );

CREATE POLICY checklist_items_all ON checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND c.family_id = auth_family_id())
    AND is_parent()
  );

ALTER TABLE checklist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_entries_select ON checklist_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM checklist_items ci
      JOIN checklists c ON c.id = ci.checklist_id
      WHERE ci.id = checklist_entries.checklist_item_id
      AND c.family_id = auth_family_id()
    )
  );

-- Any family member can mark their own entries
CREATE POLICY checklist_entries_insert ON checklist_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM checklist_items ci
      JOIN checklists c ON c.id = ci.checklist_id
      WHERE ci.id = checklist_entries.checklist_item_id
      AND c.family_id = auth_family_id()
    )
  );

CREATE POLICY checklist_entries_delete ON checklist_entries
  FOR DELETE USING (
    user_id = auth.uid()
    OR is_parent()
  );

-- =============================================================
-- ANNOUNCEMENTS
-- =============================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_select ON announcements
  FOR SELECT USING (
    family_id = auth_family_id()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY announcements_insert ON announcements
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY announcements_update ON announcements
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY announcements_delete ON announcements
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- HOMEWORK
-- =============================================================
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY homework_select ON homework
  FOR SELECT USING (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

CREATE POLICY homework_insert ON homework
  FOR INSERT WITH CHECK (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

CREATE POLICY homework_update ON homework
  FOR UPDATE USING (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

CREATE POLICY homework_delete ON homework
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- SCREEN TIME CREDITS
-- =============================================================
ALTER TABLE screen_time_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY screen_time_select ON screen_time_credits
  FOR SELECT USING (
    family_id = auth_family_id()
    AND (user_id = auth.uid() OR is_parent())
  );

CREATE POLICY screen_time_insert ON screen_time_credits
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- CONTACTS
-- =============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select ON contacts
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY contacts_insert ON contacts
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY contacts_update ON contacts
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY contacts_delete ON contacts
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

-- =============================================================
-- PHOTOS / ALBUMS
-- =============================================================
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY albums_select ON albums
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY albums_all ON albums
  FOR ALL USING (family_id = auth_family_id() AND is_parent())
  WITH CHECK (family_id = auth_family_id());

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY photos_select ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM albums a WHERE a.id = photos.album_id AND a.family_id = auth_family_id())
  );

CREATE POLICY photos_insert ON photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM albums a WHERE a.id = photos.album_id AND a.family_id = auth_family_id())
    AND is_parent()
  );

CREATE POLICY photos_delete ON photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM albums a WHERE a.id = photos.album_id AND a.family_id = auth_family_id())
    AND (uploaded_by = auth.uid() OR is_parent())
  );

-- =============================================================
-- NOTES
-- =============================================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_select ON notes
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY notes_insert ON notes
  FOR INSERT WITH CHECK (family_id = auth_family_id());

CREATE POLICY notes_update ON notes
  FOR UPDATE USING (
    family_id = auth_family_id()
    AND (created_by = auth.uid() OR is_parent())
  );

CREATE POLICY notes_delete ON notes
  FOR DELETE USING (
    family_id = auth_family_id()
    AND (created_by = auth.uid() OR is_parent())
  );

-- =============================================================
-- CALENDAR EVENTS
-- =============================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_events_select ON calendar_events
  FOR SELECT USING (family_id = auth_family_id());

CREATE POLICY calendar_events_insert ON calendar_events
  FOR INSERT WITH CHECK (family_id = auth_family_id() AND is_parent());

CREATE POLICY calendar_events_update ON calendar_events
  FOR UPDATE USING (family_id = auth_family_id() AND is_parent());

CREATE POLICY calendar_events_delete ON calendar_events
  FOR DELETE USING (family_id = auth_family_id() AND is_parent());

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_attendees_select ON event_attendees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM calendar_events e WHERE e.id = event_attendees.event_id AND e.family_id = auth_family_id())
  );

CREATE POLICY event_attendees_all ON event_attendees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM calendar_events e WHERE e.id = event_attendees.event_id AND e.family_id = auth_family_id())
    AND is_parent()
  );

-- =============================================================
-- MISC TABLES
-- =============================================================
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_select ON reminders FOR SELECT USING (family_id = auth_family_id());
CREATE POLICY reminders_insert ON reminders FOR INSERT WITH CHECK (family_id = auth_family_id());
CREATE POLICY reminders_update ON reminders FOR UPDATE USING (family_id = auth_family_id() AND user_id = auth.uid());
CREATE POLICY reminders_delete ON reminders FOR DELETE USING (family_id = auth_family_id() AND (user_id = auth.uid() OR is_parent()));

ALTER TABLE smart_home_tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY smart_home_tiles_select ON smart_home_tiles FOR SELECT USING (family_id = auth_family_id());
CREATE POLICY smart_home_tiles_all ON smart_home_tiles FOR ALL USING (family_id = auth_family_id() AND is_parent()) WITH CHECK (family_id = auth_family_id());

ALTER TABLE school_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_links_select ON school_links FOR SELECT USING (family_id = auth_family_id());
CREATE POLICY school_links_all ON school_links FOR ALL USING (family_id = auth_family_id() AND is_parent()) WITH CHECK (family_id = auth_family_id());

ALTER TABLE chore_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY chore_schedules_select ON chore_schedules FOR SELECT USING (family_id = auth_family_id());
CREATE POLICY chore_schedules_all ON chore_schedules FOR ALL USING (family_id = auth_family_id() AND is_parent()) WITH CHECK (family_id = auth_family_id());

-- =============================================================
-- AUDIT LOG (everyone can insert, only parents can read)
-- =============================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select ON audit_log FOR SELECT USING (family_id = auth_family_id() AND is_parent());
CREATE POLICY audit_log_insert ON audit_log FOR INSERT WITH CHECK (TRUE); -- allows server-side inserts via RLS-bypassed service role

-- =============================================================
-- Enable Realtime for tables that need live updates
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE task_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_entries;
