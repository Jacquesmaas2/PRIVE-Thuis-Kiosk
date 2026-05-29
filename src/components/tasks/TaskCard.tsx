'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import type { TaskInstanceWithTask } from '@/types'

interface TaskCardProps {
  instance: TaskInstanceWithTask
  currentProfileId: string
  isParent: boolean
}

export function TaskCard({ instance, currentProfileId, isParent }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  const task = instance.task
  const isOwn = instance.assigned_to === currentProfileId
  const canComplete = instance.status === 'pending' && (isOwn || isParent)

  async function handleComplete() {
    setLoading(true)
    setConfirmOpen(false)
    try {
      const res = await fetch(`/api/tasks/${instance.id}/complete`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        console.error(err.error)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className={`transition-opacity ${instance.status === 'completed' ? 'opacity-60' : ''}`}>
        <CardContent className="flex items-start gap-4 p-4">
          {instance.assignee && (
            <UserAvatar profile={instance.assignee} size="sm" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm leading-tight">{task.title}</h3>
              <Badge variant={instance.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                {instance.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                {instance.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                {instance.status === 'pending' ? 'Te doen' : 'Klaar'}
              </Badge>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {instance.due_date && (
                <span>{formatDate(instance.due_date, { weekday: 'short' })}</span>
              )}
              <span className="flex items-center gap-1 text-yellow-600 font-medium">
                <Star className="h-3 w-3 fill-current" />
                {task.points} punten
              </span>
            </div>
          </div>
          {canComplete && (
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              loading={loading}
              className="shrink-0 touch-target"
            >
              Afvinken
            </Button>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Taak afronden?"
        description={`Weet je zeker dat je "${task.title}" als klaar wilt markeren? Je verdient ${task.points} punten!`}
        confirmLabel="Ja, klaar!"
        onConfirm={handleComplete}
      />
    </>
  )
}
