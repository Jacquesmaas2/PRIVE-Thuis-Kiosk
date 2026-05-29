import { redirect } from 'next/navigation'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Calendar } from 'lucide-react'
import { CalendarView } from '@/components/calendar/CalendarView'

export const metadata = { title: 'Kalender | Thuis Kiosk' }

export default async function CalendarPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Overzicht van alle familieevenementen"
        icon={<Calendar className="h-7 w-7" />}
      />

      <div className="kiosk-card p-5">
        <CalendarView familyId={profile.family_id!} />
      </div>
    </div>
  )
}
