import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import type { TaskInstanceWithTask } from '@/types'

export const metadata = { title: 'Taak detail | Thuis Kiosk' }

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  const supabase = createClient()
  const { data: instance, error } = await supabase
    .from('task_instances')
    .select(`
      *,
      task:tasks(id, title, description, points, is_recurring),
      assignee:profiles!task_instances_assigned_to_fkey(id, display_name, avatar_url, color)
    `)
    .eq('id', params.id)
    .single()

  if (error || !instance) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taak detail"
        description="Bekijk en rond deze taak af"
        icon={<ClipboardCheck className="h-7 w-7" />}
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.tasks}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Link>
          </Button>
        }
      />
      <TaskCard
        instance={instance as unknown as TaskInstanceWithTask}
        currentProfileId={profile.id}
        isParent={profile.role === 'parent'}
      />
    </div>
  )
}
