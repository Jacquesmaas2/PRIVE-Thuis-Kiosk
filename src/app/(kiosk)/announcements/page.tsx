import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Megaphone } from 'lucide-react'

export const metadata = { title: 'Prikbord | Thuis Kiosk' }

export default async function AnnouncementsPage() {
  const { userId } = await getAuthProfile()
  if (!userId) redirect(ROUTES.login)
  return (
    <div className="space-y-6">
      <PageHeader title="Prikbord" description="Aankondigingen en berichten voor het gezin" icon={<Megaphone className="h-7 w-7 text-orange-500" />} />
      <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
        <span className="text-5xl">📌</span>
        <p className="font-medium text-lg">Volledig prikbord — binnenkort beschikbaar</p>
        <p className="text-sm">Deze module is in ontwikkeling.</p>
      </div>
    </div>
  )
}
