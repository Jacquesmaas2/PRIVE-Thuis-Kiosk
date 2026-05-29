// =============================================================
// App-wide constants
// =============================================================

export const APP_NAME = 'Thuis Kiosk'
export const APP_VERSION = '0.1.0'

// Routes
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  tasks: '/tasks',
  newTask: '/tasks/new',
  tasksNew: '/tasks/new',
  grocery: '/grocery',
  calendar: '/calendar',
  leaderboard: '/leaderboard',
  rewards: '/rewards',
  mealPlanner: '/meal-planner',
  checklist: '/checklist',
  school: '/school',
  homework: '/homework',
  screenTime: '/screen-time',
  announcements: '/announcements',
  smartHome: '/smart-home',
  contacts: '/contacts',
  timer: '/timer',
  chores: '/chores',
  photos: '/photos',
  notes: '/notes',
  profile: '/profile',
  switch: '/switch',
} as const

// Navigation items for the kiosk sidebar / drawer
export const NAV_ITEMS = [
  { label: 'Dashboard',      href: ROUTES.dashboard,     icon: 'LayoutDashboard',  color: '#6366f1' },
  { label: 'Taken',          href: ROUTES.tasks,         icon: 'CheckSquare',      color: '#10b981' },
  { label: 'Boodschappen',   href: ROUTES.grocery,       icon: 'ShoppingCart',     color: '#f59e0b' },
  { label: 'Agenda',         href: ROUTES.calendar,      icon: 'CalendarDays',     color: '#3b82f6' },
  { label: 'Ranglijst',      href: ROUTES.leaderboard,   icon: 'Trophy',           color: '#f59e0b' },
  { label: 'Beloningen',     href: ROUTES.rewards,       icon: 'Gift',             color: '#ec4899' },
  { label: 'Weekmenu',       href: ROUTES.mealPlanner,   icon: 'UtensilsCrossed',  color: '#ef4444' },
  { label: 'Routines',       href: ROUTES.checklist,     icon: 'ListChecks',       color: '#8b5cf6' },
  { label: 'Huiswerk',       href: ROUTES.homework,      icon: 'BookOpen',         color: '#06b6d4' },
  { label: 'Schermtijd',     href: ROUTES.screenTime,    icon: 'Monitor',          color: '#64748b' },
  { label: 'Prikbord',       href: ROUTES.announcements, icon: 'Megaphone',        color: '#f97316' },
  { label: 'School',         href: ROUTES.school,        icon: 'GraduationCap',    color: '#0ea5e9' },
  { label: 'Smart Home',     href: ROUTES.smartHome,     icon: 'Home',             color: '#14b8a6' },
  { label: 'Contacten',      href: ROUTES.contacts,      icon: 'Phone',            color: '#84cc16' },
  { label: 'Timer',          href: ROUTES.timer,         icon: 'Timer',            color: '#a855f7' },
  { label: 'Klusjes',        href: ROUTES.chores,        icon: 'Repeat',           color: '#f43f5e' },
  { label: "Foto's",         href: ROUTES.photos,        icon: 'Image',            color: '#fb923c' },
  { label: 'Notities',       href: ROUTES.notes,         icon: 'StickyNote',       color: '#facc15' },
  { label: 'Profielen',      href: ROUTES.profile,       icon: 'Users',            color: '#6b7280' },
] as const

// Grocery categories
export const GROCERY_CATEGORIES = [
  { value: 'groente',    label: 'Groente & Fruit', icon: '🥦' },
  { value: 'vlees',      label: 'Vlees & Vis',     icon: '🥩' },
  { value: 'zuivel',     label: 'Zuivel',          icon: '🥛' },
  { value: 'bakkerij',   label: 'Bakkerij',        icon: '🍞' },
  { value: 'droog',      label: 'Droog',           icon: '🥫' },
  { value: 'diepvries',  label: 'Diepvries',       icon: '🧊' },
  { value: 'dranken',    label: 'Dranken',         icon: '🧃' },
  { value: 'schoonmaak', label: 'Schoonmaak',      icon: '🧹' },
  { value: 'overig',     label: 'Overig',          icon: '🛒' },
] as const

// Task recurrence labels
export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Eenmalig',
  daily: 'Dagelijks',
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
}

// Announcement priority labels + colours
export const PRIORITY_CONFIG = {
  low:    { label: 'Laag',     bg: 'bg-slate-100',  text: 'text-slate-700'  },
  normal: { label: 'Normaal',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  high:   { label: 'Hoog',     bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { label: 'Urgent',   bg: 'bg-red-100',    text: 'text-red-700'    },
} as const

// Default coordinates for weather (Amsterdam as fallback)
export const DEFAULT_WEATHER_LAT = 52.3676
export const DEFAULT_WEATHER_LON = 4.9041
export const DEFAULT_LOCATION_NAME = 'Amsterdam'

// Points
export const MIN_TASK_POINTS = 0
export const MAX_TASK_POINTS = 1000
