'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskInstanceWithTask } from '@/types'

export function useTasks(initial: TaskInstanceWithTask[]) {
  const [instances, setInstances] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const completeTask = useCallback(async (instanceId: string) => {
    setLoading(instanceId)
    try {
      const res = await fetch(`/api/tasks/${instanceId}/complete`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Er ging iets fout')
      }
      // Optimistic update
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, status: 'completed' as const, completed_at: new Date().toISOString() }
            : i
        )
      )
      router.refresh()
    } finally {
      setLoading(null)
    }
  }, [router])

  return { instances, completeTask, loading }
}
