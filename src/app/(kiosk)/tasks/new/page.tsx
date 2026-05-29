import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm'
import { Plus } from 'lucide-react'

export const metadata = { title: 'Nieuwe taak | Thuis Kiosk' }

export default async function NewTaskPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)
  if (profile.role !== 'parent') redirect(ROUTES.tasks)

  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', profile.family_id)
    .neq('role', 'guest')
    .order('display_name')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nieuwe taak"
        description="Maak een taak aan en ken punten toe"
        icon={<Plus className="h-7 w-7" />}
      />
      <CreateTaskForm profiles={profiles ?? []} />
    </div>
  )
}
