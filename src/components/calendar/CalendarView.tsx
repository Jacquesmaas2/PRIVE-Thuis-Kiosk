'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, List, Calendar as CalendarIcon } from 'lucide-react'
import type { CalendarEvent } from '@/lib/ics-parser'

interface CalendarViewProps {
  familyId: string
}

interface EventWithSubscription extends CalendarEvent {
  subscriptionName: string
  color: string
}

type ViewMode = 'month' | 'week' | 'day'
type DetailView = 'visual' | 'list'

export function CalendarView({ familyId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [detailView, setDetailView] = useState<DetailView>('visual')
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
        
        // Parse date strings back into Date objects
        const parsedEvents = data.map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: event.endDate ? new Date(event.endDate) : null,
        }))
        
        setEvents(parsedEvents)
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

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month

  const navButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          if (viewMode === 'day') {
            setCurrentDate(new Date(year, month, currentDate.getDate() - 1))
          } else if (viewMode === 'week') {
            setCurrentDate(new Date(year, month, currentDate.getDate() - 7))
          } else {
            setCurrentDate(new Date(year, month - 1, 1))
          }
        }}
        aria-label="Vorige"
        className="h-10 w-10 rounded-lg border hover:bg-muted transition-colors flex items-center justify-center"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={() => {
          if (viewMode === 'day') {
            setCurrentDate(new Date(year, month, currentDate.getDate() + 1))
          } else if (viewMode === 'week') {
            setCurrentDate(new Date(year, month, currentDate.getDate() + 7))
          } else {
            setCurrentDate(new Date(year, month + 1, 1))
          }
        }}
        aria-label="Volgende"
        className="h-10 w-10 rounded-lg border hover:bg-muted transition-colors flex items-center justify-center"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* View mode tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              {mode === 'month' ? 'Maand' : mode === 'week' ? 'Week' : 'Dag'}
            </button>
          ))}
        </div>

        {/* Detail view toggle for week/day */}
        {(viewMode === 'week' || viewMode === 'day') && (
          <div className="flex gap-2 border rounded-lg p-1">
            <button
              onClick={() => setDetailView('visual')}
              title="Kalenderweergave"
              className={`p-2 rounded transition-colors ${
                detailView === 'visual'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDetailView('list')}
              title="Lijstweergave"
              className={`p-2 rounded transition-colors ${
                detailView === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}

        {navButtons}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Fout bij laden van events: {error}
        </div>
      )}

      {/* Month view */}
      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          loading={loading}
          isCurrentMonth={isCurrentMonth}
        />
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          loading={loading}
          detailView={detailView}
        />
      )}

      {/* Day view */}
      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          loading={loading}
          detailView={detailView}
        />
      )}
    </div>
  )
}

// ─── Month View Component ───

function MonthView({
  currentDate,
  eventsByDate,
  loading,
  isCurrentMonth,
}: {
  currentDate: Date
  eventsByDate: Record<string, EventWithSubscription[]>
  loading: boolean
  isCurrentMonth: boolean
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay())

  const days: Date[] = []
  const current = new Date(startDate)
  while (days.length < 42) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const monthName = monthStart.toLocaleDateString('nl-NL', {
    month: 'long',
    year: 'numeric',
  })

  const today = new Date()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold capitalize">{monthName}</h2>

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
          const dateKey = day.toISOString().split('T')[0]
          const dayEvents = eventsByDate[dateKey] || []
          const isCurrentDay =
            isCurrentMonth && day.getDate() === today.getDate()
          const isOtherMonth = day.getMonth() !== month

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 border-r border-b last:border-r-0 
                ${isOtherMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                ${isCurrentDay ? 'bg-primary/5' : ''}
              `}
            >
              <div
                className={`text-xs font-semibold mb-1 
                ${isCurrentDay ? 'text-primary' : ''}
              `}
              >
                {day.getDate()}
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
    </div>
  )
}

// ─── Week View Component ───

function WeekView({
  currentDate,
  eventsByDate,
  loading,
  detailView,
}: {
  currentDate: Date
  eventsByDate: Record<string, EventWithSubscription[]>
  loading: boolean
  detailView: DetailView
}) {
  // Get the Monday of the current week
  const date = new Date(currentDate)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))

  const weekDays: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    weekDays.push(d)
  }

  const weekRange = `${monday.toLocaleDateString('nl-NL')} - ${new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}`

  // Collect all events for this week
  const weekEvents: EventWithSubscription[] = []
  for (const day of weekDays) {
    const dateKey = day.toISOString().split('T')[0]
    const dayEvents = eventsByDate[dateKey] || []
    weekEvents.push(...dayEvents)
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (detailView === 'list') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Week: {weekRange}</h2>

        {weekEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Geen events deze week
          </div>
        ) : (
          <div className="space-y-3">
            {weekDays.map((day) => {
              const dateKey = day.toISOString().split('T')[0]
              const dayEvents = (eventsByDate[dateKey] || []).sort(
                (a, b) => a.startDate.getTime() - b.startDate.getTime()
              )
              const dayName = day.toLocaleDateString('nl-NL', {
                weekday: 'long',
                month: 'numeric',
                day: 'numeric',
              })

              return (
                <div
                  key={dateKey}
                  className={`p-4 rounded-lg border ${
                    dayEvents.length > 0 ? 'kiosk-card' : 'border-dashed text-muted-foreground'
                  }`}
                >
                  <h3 className="font-semibold text-sm capitalize mb-2">{dayName}</h3>

                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Geen events</p>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <EventListItem key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Visual week view
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Week: {weekRange}</h2>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {weekDays.map((day) => {
            const dayName = day.toLocaleDateString('nl-NL', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
            const isToday =
              day.toDateString() === new Date().toDateString()
            return (
              <div
                key={day.toISOString()}
                className={`p-3 text-center text-sm font-semibold border-r border-border last:border-r-0 ${
                  isToday ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                {dayName}
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="divide-y divide-border">
          {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
            <div
              key={hour}
              className="flex divide-x divide-border"
              style={{ minHeight: '60px' }}
            >
              <div className="w-14 p-2 text-xs text-muted-foreground font-medium bg-muted/30 flex-shrink-0">
                {String(hour).padStart(2, '0')}:00
              </div>

              {weekDays.map((day) => {
                const dateKey = day.toISOString().split('T')[0]
                const dayEvents = eventsByDate[dateKey] || []
                const hourEvents = dayEvents.filter((e) => {
                  if (e.allDay) return false
                  const startHour = e.startDate.getHours()
                  return startHour === hour
                })

                return (
                  <div
                    key={dateKey}
                    className="flex-1 p-1 border-r border-border last:border-r-0 relative"
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1.5 rounded mb-1 text-white truncate font-medium cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          backgroundColor: event.color,
                          opacity: 0.85,
                        }}
                        title={event.summary}
                      >
                        {event.startDate.toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        {event.summary}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* All-day events */}
      {weekEvents.some((e) => e.allDay) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Hele dag</h3>
          <div className="space-y-2">
            {weekEvents
              .filter((e) => e.allDay)
              .map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: event.color,
                    backgroundColor: `${event.color}08`,
                  }}
                >
                  <div className="font-medium text-sm">{event.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.subscriptionName}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Day View Component ───

function DayView({
  currentDate,
  eventsByDate,
  loading,
  detailView,
}: {
  currentDate: Date
  eventsByDate: Record<string, EventWithSubscription[]>
  loading: boolean
  detailView: DetailView
}) {
  const dateKey = currentDate.toISOString().split('T')[0]
  const dayEvents = (eventsByDate[dateKey] || []).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  )

  const dayName = currentDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (detailView === 'list') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold capitalize">{dayName}</h2>

        {dayEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Geen events vandaag
          </div>
        ) : (
          <div className="space-y-3">
            {/* All-day events */}
            {dayEvents.filter((e) => e.allDay).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Hele dag
                </h3>
                {dayEvents
                  .filter((e) => e.allDay)
                  .map((event) => (
                    <EventListItem key={event.id} event={event} />
                  ))}
              </div>
            )}

            {/* Timed events */}
            {dayEvents.filter((e) => !e.allDay).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Getijmde events
                </h3>
                {dayEvents
                  .filter((e) => !e.allDay)
                  .map((event) => (
                    <EventListItem key={event.id} event={event} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Visual day view
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold capitalize">{dayName}</h2>

      {dayEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Geen events vandaag
        </div>
      ) : (
        <div className="space-y-4">
          {/* All-day events */}
          {dayEvents.filter((e) => e.allDay).length > 0 && (
            <div className="border border-border rounded-lg bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Hele dag</h3>
              <div className="space-y-2">
                {dayEvents
                  .filter((e) => e.allDay)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: event.color,
                        backgroundColor: `${event.color}08`,
                      }}
                    >
                      <div className="font-medium text-sm">{event.summary}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.subscriptionName}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Timed events in timeline */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {Array.from({ length: 16 }, (_, i) => i + 6).map((hour) => {
                const hourEvents = dayEvents.filter((e) => {
                  if (e.allDay) return false
                  const startHour = e.startDate.getHours()
                  return startHour === hour
                })

                return (
                  <div
                    key={hour}
                    className="flex min-h-20"
                  >
                    <div className="w-16 p-3 text-xs text-muted-foreground font-medium bg-muted/30 flex-shrink-0 border-r border-border text-center">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 p-3 space-y-2 divide-y divide-border/50">
                      {hourEvents.length > 0 ? (
                        hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className="pt-2 first:pt-0"
                          >
                            <div
                              className="p-3 rounded-lg text-white text-sm font-medium hover:shadow-md transition-shadow"
                              style={{
                                backgroundColor: event.color,
                                opacity: 0.85,
                              }}
                            >
                              <div className="font-semibold">
                                {event.startDate.toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                {event.endDate && (
                                  <>
                                    -{' '}
                                    {event.endDate.toLocaleTimeString('nl-NL', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </>
                                )}
                              </div>
                              <div className="font-medium">{event.summary}</div>
                              <div className="text-xs opacity-90 mt-1">
                                {event.subscriptionName}
                              </div>
                              {event.location && (
                                <div className="text-xs opacity-90 mt-1">
                                  📍 {event.location}
                                </div>
                              )}
                              {event.description && (
                                <p className="text-xs opacity-90 mt-2">
                                  {event.description.substring(0, 100)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">-</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Event List Item Component ───

function EventListItem({ event }: { event: EventWithSubscription }) {
  return (
    <div
      className="text-xs p-3 rounded-lg border-l-4"
      style={{
        borderLeftColor: event.color,
        backgroundColor: `${event.color}08`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm">{event.summary}</div>
          <div className="text-muted-foreground mt-1">
            {event.allDay ? (
              'Hele dag'
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="text-muted-foreground">{event.subscriptionName}</div>
          {event.location && (
            <div className="text-muted-foreground">📍 {event.location}</div>
          )}
          {event.description && (
            <p className="text-muted-foreground mt-2">
              {event.description.substring(0, 150)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
