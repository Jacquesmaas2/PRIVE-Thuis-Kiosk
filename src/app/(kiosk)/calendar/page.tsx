import { redirect } from 'next/navigation'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Calendar } from 'lucide-react'
import { CalendarSubscriptionsManager } from '@/components/calendar/CalendarSubscriptionsManager'
import type { Database } from '@/types/database.types'

export const metadata = { title: 'Kalender | Thuis Kiosk' }

type CalendarSubscription = Database['public']['Tables']['calendar_subscriptions']['Row']

export default async function CalendarPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  const supabase = createClient()

  const { data: subscriptions = [] } = await supabase
    .from('calendar_subscriptions')
    .select('*')
    .eq('family_id', profile.family_id!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Beheer kalenderabonnementen voor je gezin"
        icon={<Calendar className="h-7 w-7" />}
      />

      <CalendarSubscriptionsManager
        initialSubscriptions={(subscriptions ?? []) as CalendarSubscription[]}
        canManage={profile.role === 'parent'}
      />
    </div>
  )
}
