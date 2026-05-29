'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarEvent } from '@/lib/ics-parser'

interface CalendarViewProps {
  familyId: string
}

interface EventWithSubscription extends CalendarEvent {
  subscriptionName: string
  color: string
}

export function CalendarView({ familyId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EventWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // Fetch events for current month
  useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/calendar/events?month=${monthStr}&familyId=${familyId}`
        )
        if (!res.ok) throw new Error('Failed to fetch events')
        const data = await res.json()
        setEvents(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [monthStr, familyId])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventWithSubscription[]> = {}
    for (const event of events) {
      const dateKey = event.startDate.toISOString().split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(event)
    }
    return map
  }, [events])

  // Generate calendar days
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay())

  const days: (Date | null)[] = []
  const current = new Date(startDate)
  while (days.length < 42) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const monthName = monthStart.toLocaleDateString('nl-NL', {
    month: 'long',
    year: 'numeric',
  })

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          aria-label="Vorige maand"
          className="h-10 w-10 rounded-lg border hover:bg-muted transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>

        <button
          onClick={nextMonth}
          aria-label="Volgende maand"
          className="h-10 w-10 rounded-lg border hover:bg-muted transition-colors flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Fout bij laden van events: {error}
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 rounded-lg border border-border bg-card overflow-hidden">
        {days.map((day, idx) => {
          const dateKey = day?.toISOString().split('T')[0] || ''
          const dayEvents = eventsByDate[dateKey] || []
          const isCurrentDay =
            isCurrentMonth &&
            day?.getDate() === today.getDate()
          const isOtherMonth = day && day.getMonth() !== month

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 border-r border-b last-child:border-r-0 
                ${isOtherMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                ${isCurrentDay ? 'bg-primary/5' : ''}
              `}
            >
              <div
                className={`text-xs font-semibold mb-1 
                ${isCurrentDay ? 'text-primary' : ''}
              `}
              >
                {day?.getDate()}
              </div>

              {loading ? (
                <div className="text-xs text-muted-foreground">...</div>
              ) : (
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium"
                      style={{ backgroundColor: event.color }}
                      title={event.summary}
                    >
                      {event.allDay ? '📅' : '🕐'} {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 2} meer
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Events list for selected period */}
      {events.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold">
            Events in {monthName} ({events.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="kiosk-card p-3 space-y-1">
                <div className="flex items-start gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full mt-0.5"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {event.summary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.subscriptionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.allDay ? (
                        <span>Hele dag</span>
                      ) : (
                        <span>
                          {event.startDate.toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {event.endDate && (
                            <>
                              {' '}
                              -{' '}
                              {event.endDate.toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </>
                          )}
                        </span>
                      )}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Geen events in {monthName}. Voeg kalenderabonnementen toe in de
          instellingen.
        </div>
      )}
    </div>
  )
}
