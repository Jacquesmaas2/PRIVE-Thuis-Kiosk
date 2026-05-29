// =============================================================
// Application-level types (built on top of database types)
// =============================================================
import type { Database } from './database.types'

// Convenience row aliases
export type Family = Database['public']['Tables']['families']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInstance = Database['public']['Tables']['task_instances']['Row']
export type PointsLedger = Database['public']['Tables']['points_ledger']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
export type Redemption = Database['public']['Tables']['redemptions']['Row']
export type GroceryList = Database['public']['Tables']['grocery_lists']['Row']
export type GroceryItem = Database['public']['Tables']['grocery_items']['Row']
export type GroceryOrderHistory = Database['public']['Tables']['grocery_order_history']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type Homework = Database['public']['Tables']['homework']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Checklist = Database['public']['Tables']['checklists']['Row']
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
export type ChecklistEntry = Database['public']['Tables']['checklist_entries']['Row']
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

// Re-export enum types
export type {
  UserRole, TaskStatus, RedemptionStatus, HomeworkStatus, ChecklistType,
  AnnouncementPriority, MealType, RecurrencePattern, PointsReferenceType,
} from './database.types'

// =============================================================
// Enriched / joined types used in the UI
// =============================================================

export interface TaskWithProfile extends Task {
  assignee: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'color'> | null
  creator: Pick<Profile, 'id' | 'display_name'> | null
}

export interface TaskInstanceWithTask extends TaskInstance {
  task: Pick<Task, 'id' | 'title' | 'description' | 'points' | 'is_recurring'>
  assignee: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'color'>
}

export interface GroceryItemWithAdder extends GroceryItem {
  adder: Pick<Profile, 'id' | 'display_name' | 'color'> | null
  checker: Pick<Profile, 'id' | 'display_name'> | null
}

export interface ProfileWithBalance extends Profile {
  balance: number
}

// =============================================================
// API response wrappers
// =============================================================

export interface ApiSuccess<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// =============================================================
// Dashboard summary
// =============================================================
export interface DashboardSummary {
  profile: Profile
  family: Family
  pendingTasks: number
  tasksDueToday: TaskInstanceWithTask[]
  announcements: Announcement[]
  leaderboard: ProfileWithBalance[]
  weather: WeatherData | null
}

// =============================================================
// Weather (mock + real provider use same shape)
// =============================================================
export interface WeatherData {
  temperature: number       // Celsius
  condition: WeatherCondition
  description: string
  icon: string
  humidity: number
  windSpeed: number
  location: string
  fetchedAt: string
}

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'thunderstorm'
  | 'fog'
  | 'unknown'

// =============================================================
// Session / auth
// =============================================================
export interface SessionUser {
  id: string
  email: string
  profile: Profile
}
