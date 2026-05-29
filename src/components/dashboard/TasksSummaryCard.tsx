import Link from 'next/link'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PointsBadge } from '@/components/shared/PointsBadge'
import type { TaskInstanceWithTask, Profile } from '@/types'

interface TasksSummaryCardProps {
  taskInstances: TaskInstanceWithTask[]
  profile: Profile
}

// Minimal shape — task field is a joined object
type TaskInstanceRow = {
  id: string
  status: string
  due_date: string
  task: { id: string; title: string; description: string | null; points: number; is_recurring: boolean }
}

export function TasksSummaryCard({ taskInstances, profile }: TasksSummaryCardProps) {
  const rows = taskInstances as unknown as TaskInstanceRow[]

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-emerald-500" />
          Mijn taken vandaag
        </CardTitle>
        {rows.length > 0 && (
          <Badge variant="info">{rows.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <span className="text-3xl">🎉</span>
            <p className="font-medium">Alle taken zijn klaar!</p>
            <p className="text-sm">Goed bezig, {profile.display_name}!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((instance) => (
              <li key={instance.id}>
                <Link
                  href={`/tasks/${instance.task.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{instance.task.title}</p>
                    {instance.task.description && (
                      <p className="text-xs text-muted-foreground truncate">{instance.task.description}</p>
                    )}
                  </div>
                  <PointsBadge points={instance.task.points} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/tasks" className="flex items-center gap-2">
              Alle taken bekijken
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
