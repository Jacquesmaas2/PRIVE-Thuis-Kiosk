// =============================================================
// Database types — manually maintained to match 001_initial_schema.sql
// For production: regenerate with `supabase gen types typescript`
// =============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'parent' | 'kid' | 'guest'
export type TaskStatus = 'pending' | 'completed' | 'approved' | 'rejected' | 'skipped'
export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'
export type HomeworkStatus = 'todo' | 'in_progress' | 'done'
export type ChecklistType = 'morning' | 'evening' | 'custom'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly'
export type PointsReferenceType = 'task' | 'reward' | 'screen_time' | 'manual'

export interface Database {
  public: {
    Tables: {
      families: {
        Row: { id: string; name: string; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; updated_at?: string }
      }
      family_settings: {
        Row: {
          family_id: string; timezone: string; locale: string; theme: string
          screen_time_per_point: number; settings: Json; updated_at: string
          address_line1: string | null; city: string | null; postal_code: string | null
          country: string; latitude: number | null; longitude: number | null
          kiosk_auth_user_id: string | null
        }
        Insert: {
          family_id: string; timezone?: string; locale?: string; theme?: string
          screen_time_per_point?: number; settings?: Json; updated_at?: string
          address_line1?: string | null; city?: string | null; postal_code?: string | null
          country?: string; latitude?: number | null; longitude?: number | null
          kiosk_auth_user_id?: string | null
        }
        Update: {
          timezone?: string; locale?: string; theme?: string
          screen_time_per_point?: number; settings?: Json; updated_at?: string
          address_line1?: string | null; city?: string | null; postal_code?: string | null
          country?: string; latitude?: number | null; longitude?: number | null
          kiosk_auth_user_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string; family_id: string | null; display_name: string; avatar_url: string | null
          role: UserRole; date_of_birth: string | null; locale: string; color: string
          auth_user_id: string | null; pin_hash: string | null
          is_grocery_manager: boolean; is_kiosk: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id?: string | null; display_name: string; avatar_url?: string | null
          role?: UserRole; date_of_birth?: string | null; locale?: string; color?: string
          auth_user_id?: string | null; pin_hash?: string | null
          is_grocery_manager?: boolean; is_kiosk?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          family_id?: string | null; display_name?: string; avatar_url?: string | null
          role?: UserRole; date_of_birth?: string | null; locale?: string; color?: string
          auth_user_id?: string | null; pin_hash?: string | null
          is_grocery_manager?: boolean; is_kiosk?: boolean; updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string; family_id: string; title: string; description: string | null
          points: number; assigned_to: string | null; due_date: string | null
          is_recurring: boolean; recurrence_pattern: RecurrencePattern | null
          is_active: boolean; created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; title: string; description?: string | null
          points?: number; assigned_to?: string | null; due_date?: string | null
          is_recurring?: boolean; recurrence_pattern?: RecurrencePattern | null
          is_active?: boolean; created_by: string; created_at?: string; updated_at?: string
        }
        Update: {
          title?: string; description?: string | null; points?: number
          assigned_to?: string | null; due_date?: string | null
          is_recurring?: boolean; recurrence_pattern?: RecurrencePattern | null
          is_active?: boolean; updated_at?: string
        }
      }
      task_instances: {
        Row: {
          id: string; task_id: string; assigned_to: string; due_date: string
          status: TaskStatus; completed_at: string | null; approved_by: string | null
          approved_at: string | null; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; task_id: string; assigned_to: string; due_date?: string
          status?: TaskStatus; completed_at?: string | null; approved_by?: string | null
          approved_at?: string | null; notes?: string | null; created_at?: string
        }
        Update: {
          status?: TaskStatus; completed_at?: string | null; approved_by?: string | null
          approved_at?: string | null; notes?: string | null
        }
      }
      points_ledger: {
        Row: {
          id: string; family_id: string; user_id: string; amount: number; reason: string
          reference_type: PointsReferenceType | null; reference_id: string | null
          created_by: string | null; created_at: string
        }
        Insert: {
          id?: string; family_id: string; user_id: string; amount: number; reason: string
          reference_type?: PointsReferenceType | null; reference_id?: string | null
          created_by?: string | null; created_at?: string
        }
        Update: never // append-only
      }
      rewards: {
        Row: {
          id: string; family_id: string; title: string; description: string | null
          points_cost: number; image_url: string | null; is_active: boolean
          requires_approval: boolean; created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; title: string; description?: string | null
          points_cost: number; image_url?: string | null; is_active?: boolean
          requires_approval?: boolean; created_by: string
        }
        Update: {
          title?: string; description?: string | null; points_cost?: number
          image_url?: string | null; is_active?: boolean; requires_approval?: boolean
          updated_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string; family_id: string; reward_id: string; user_id: string
          status: RedemptionStatus; points_spent: number; approved_by: string | null
          approved_at: string | null; notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; reward_id: string; user_id: string
          status?: RedemptionStatus; points_spent: number
        }
        Update: {
          status?: RedemptionStatus; approved_by?: string | null
          approved_at?: string | null; notes?: string | null; updated_at?: string
        }
      }
      grocery_lists: {
        Row: {
          id: string; family_id: string; name: string; is_active: boolean
          created_by: string; created_at: string
          order_deadline: string | null; delivery_at: string | null
          is_locked: boolean; cycle: number
        }
        Insert: {
          id?: string; family_id: string; name?: string; is_active?: boolean; created_by: string
          order_deadline?: string | null; delivery_at?: string | null
          is_locked?: boolean; cycle?: number
        }
        Update: {
          name?: string; is_active?: boolean
          order_deadline?: string | null; delivery_at?: string | null
          is_locked?: boolean
        }
      }
      grocery_order_history: {
        Row: {
          id: string; family_id: string; cycle: number; list_name: string
          item_name: string; quantity: number | null; unit: string | null; category: string | null
          added_by: string | null; adder_name: string | null
          added_at: string; archived_at: string
        }
        Insert: {
          id?: string; family_id: string; cycle: number; list_name: string
          item_name: string; quantity?: number | null; unit?: string | null; category?: string | null
          added_by?: string | null; adder_name?: string | null
          added_at: string; archived_at?: string
        }
        Update: never
      }
      grocery_items: {
        Row: {
          id: string; list_id: string; name: string; quantity: number | null
          unit: string | null; category: string | null; is_checked: boolean
          checked_by: string | null; checked_at: string | null; added_by: string
          sort_order: number; thumbnail_url: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; list_id: string; name: string; quantity?: number | null
          unit?: string | null; category?: string | null; is_checked?: boolean
          added_by: string; sort_order?: number; thumbnail_url?: string | null
        }
        Update: {
          name?: string; quantity?: number | null; unit?: string | null
          category?: string | null; is_checked?: boolean; checked_by?: string | null
          checked_at?: string | null; sort_order?: number; thumbnail_url?: string | null
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string; family_id: string; title: string; content: string
          priority: AnnouncementPriority; created_by: string
          expires_at: string | null; created_at: string
        }
        Insert: {
          id?: string; family_id: string; title: string; content: string
          priority?: AnnouncementPriority; created_by: string; expires_at?: string | null
        }
        Update: {
          title?: string; content?: string; priority?: AnnouncementPriority
          expires_at?: string | null
        }
      }
      homework: {
        Row: {
          id: string; family_id: string; user_id: string; subject: string; title: string
          description: string | null; due_date: string | null; status: HomeworkStatus
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; user_id: string; subject: string; title: string
          description?: string | null; due_date?: string | null; status?: HomeworkStatus
        }
        Update: {
          subject?: string; title?: string; description?: string | null
          due_date?: string | null; status?: HomeworkStatus; updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string; family_id: string; title: string | null; content: string
          is_pinned: boolean; created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; title?: string | null; content?: string
          is_pinned?: boolean; created_by: string
        }
        Update: {
          title?: string | null; content?: string; is_pinned?: boolean; updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string; family_id: string; name: string; relationship: string | null
          phone: string | null; email: string | null; address: string | null
          is_emergency: boolean; sort_order: number; created_by: string
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; name: string; relationship?: string | null
          phone?: string | null; email?: string | null; address?: string | null
          is_emergency?: boolean; sort_order?: number; created_by: string
        }
        Update: {
          name?: string; relationship?: string | null; phone?: string | null
          email?: string | null; address?: string | null; is_emergency?: boolean
          sort_order?: number; updated_at?: string
        }
      }
      checklists: {
        Row: {
          id: string; family_id: string; title: string; checklist_type: ChecklistType
          assigned_to: string | null; is_active: boolean; created_by: string; created_at: string
        }
        Insert: {
          id?: string; family_id: string; title: string; checklist_type: ChecklistType
          assigned_to?: string | null; is_active?: boolean; created_by: string
        }
        Update: { title?: string; assigned_to?: string | null; is_active?: boolean }
      }
      checklist_items: {
        Row: { id: string; checklist_id: string; title: string; sort_order: number; created_at: string }
        Insert: { id?: string; checklist_id: string; title: string; sort_order?: number }
        Update: { title?: string; sort_order?: number }
      }
      checklist_entries: {
        Row: {
          id: string; checklist_item_id: string; user_id: string
          completed_date: string; completed_at: string
        }
        Insert: {
          id?: string; checklist_item_id: string; user_id: string
          completed_date?: string; completed_at?: string
        }
        Update: never
      }
      calendar_events: {
        Row: {
          id: string; family_id: string; title: string; description: string | null
          start_at: string; end_at: string | null; all_day: boolean; color: string | null
          created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; family_id: string; title: string; description?: string | null
          start_at: string; end_at?: string | null; all_day?: boolean; color?: string | null
          created_by: string
        }
        Update: {
          title?: string; description?: string | null; start_at?: string
          end_at?: string | null; all_day?: boolean; color?: string | null; updated_at?: string
        }
      }
    }
    Views: {
      user_points_balance: {
        Row: {
          user_id: string | null
          family_id: string | null
          balance: number | null
          last_updated: string | null
        }
      }
      user_screen_time_balance: {
        Row: {
          user_id: string | null
          family_id: string | null
          total_minutes: number | null
          last_updated: string | null
        }
      }
    }
    Functions: {
      auth_family_id: { Args: Record<never, never>; Returns: string }
      auth_role: { Args: Record<never, never>; Returns: string }
      is_parent: { Args: Record<never, never>; Returns: boolean }
    }
    Enums: Record<never, never>
  }
}
