import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { TaskList } from '@/components/tasks/TaskList'
import { Button } from '@/components/ui/button'
import { ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
import type { TaskInstanceWithTask } from '@/types'

export const metadata = { title: 'Taken | Thuis Kiosk' }

export default async function TasksPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  const supabase = createClient()

  const { data: instances } = await supabase
    .from('task_instances')
    .select(`
      *,
      task:tasks(id, title, description, points, is_recurring),
      assignee:profiles!task_instances_assigned_to_fkey(id, display_name, avatar_url, color)
    `)
    .order('due_date', { ascending: true })

  const isParent = profile.role === 'parent'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taken"
        description="Bekijk en rond taken af"
        icon={<ClipboardList className="h-7 w-7" />}
        actions={
          isParent ? (
            <Button asChild>
              <Link href={ROUTES.tasksNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe taak
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TaskList
        instances={(instances ?? []) as unknown as TaskInstanceWithTask[]}
        currentProfileId={profile.id}
        isParent={isParent}
      />
    </div>
  )
}
