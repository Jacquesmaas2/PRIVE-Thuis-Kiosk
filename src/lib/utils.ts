import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { WeatherCondition } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date to a human-readable Dutch string
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...options,
  })
}

// Format time only
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

// Get today's date as YYYY-MM-DD
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Get start of current week (Monday) as YYYY-MM-DD
export function weekStartISO(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// Map WMO weather code to our WeatherCondition type
export function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partly_cloudy'
  if (code <= 3) return 'cloudy'
  if (code <= 49) return 'fog'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'heavy_rain'
  if (code <= 99) return 'thunderstorm'
  return 'unknown'
}

// Get an emoji icon for a weather condition
export function weatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    clear: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    heavy_rain: '⛈️',
    snow: '❄️',
    thunderstorm: '⛈️',
    fog: '🌫️',
    unknown: '🌡️',
  }
  return icons[condition]
}

// Pluralise a Dutch noun with count
export function pluralise(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

// Truncate a string at word boundary
export function truncate(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str
  return str.slice(0, maxChars).replace(/\s\S*$/, '') + '…'
}

// Generate initials from a display name (max 2 chars)
export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

// Capitalise first letter
export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
