'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { TaskInstanceWithTask } from '@/types'

interface TaskListProps {
  instances: TaskInstanceWithTask[]
  currentProfileId: string
  isParent: boolean
}

export function TaskList({ instances, currentProfileId, isParent }: TaskListProps) {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')

  const pending = instances.filter((i) => i.status === 'pending')
  const completed = instances.filter((i) => i.status === 'completed')
  const displayed = tab === 'pending' ? pending : completed

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'completed')}>
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">
            Te doen{pending.length > 0 ? ` (${pending.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Gedaan{completed.length > 0 ? ` (${completed.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <span className="text-4xl">{tab === 'pending' ? '🎉' : '📋'}</span>
              <p className="text-sm font-medium">
                {tab === 'pending' ? 'Alle taken zijn gedaan!' : 'Nog niets afgerond'}
              </p>
            </div>
          ) : (
            displayed.map((instance) => (
              <TaskCard
                key={instance.id}
                instance={instance}
                currentProfileId={currentProfileId}
                isParent={isParent}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
