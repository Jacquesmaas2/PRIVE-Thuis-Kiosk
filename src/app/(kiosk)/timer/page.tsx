'use client'

import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Timer } from 'lucide-react'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TimerPage() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  return (
    <div className="space-y-6">
      <PageHeader title="Timer" description="Stopwatch en countdown" icon={<Timer className="h-7 w-7" />} />
      <div className="flex flex-col items-center gap-8 py-12">
        <div className="text-8xl font-bold tabular-nums tracking-tight">
          {formatTime(seconds)}
        </div>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => setRunning((r) => !r)}>
            {running ? 'Stop' : 'Start'}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setRunning(false); setSeconds(0) }}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
