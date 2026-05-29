import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { fetchAndParseICS, type CalendarEvent } from '@/lib/ics-parser'
import type { Database } from '@/types/database.types'

type CalendarSubscription = Database['public']['Tables']['calendar_subscriptions']['Row']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const monthStr = searchParams.get('month') // YYYY-MM
    const familyId = searchParams.get('familyId')

    if (!monthStr || !familyId) {
      return Response.json(
        { error: 'month and familyId query parameters required' },
        { status: 400 }
      )
    }

    // Verify user is part of the family
    const { profile } = await getAuthProfile()
    if (!profile || profile.family_id !== familyId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = createClient()

    // Fetch calendar subscriptions for the family
    const { data: subscriptions = [] } = await supabase
      .from('calendar_subscriptions')
      .select('*')
      .eq('family_id', familyId)

    // Parse all ICS feeds
    const allEvents: (CalendarEvent & { subscriptionName: string; color: string })[] = []

    for (const subscription of subscriptions as CalendarSubscription[]) {
      try {
        const events = await fetchAndParseICS(subscription.url)
        for (const event of events) {
          allEvents.push({
            ...event,
            subscriptionName: subscription.name,
            color: subscription.color,
          })
        }
      } catch (err) {
        console.error(`Error parsing subscription ${subscription.id}:`, err)
      }
    }

    // Filter events for the requested month
    const [year, month] = monthStr.split('-').map(Number)
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)

    const filteredEvents = allEvents.filter((event) => {
      const eventStart = new Date(event.startDate)
      return eventStart >= monthStart && eventStart <= monthEnd
    })

    // Sort by start date
    filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    return Response.json(filteredEvents)
  } catch (error) {
    console.error('Error in calendar events API:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
