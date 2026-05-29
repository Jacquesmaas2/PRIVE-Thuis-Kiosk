import { Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { PRIORITY_CONFIG } from '@/lib/constants'
import type { Announcement } from '@/types'

interface AnnouncementsCardProps {
  announcements: Announcement[]
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-orange-500" />
          Prikbord
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <span className="text-3xl">📭</span>
            <p className="text-sm">Geen berichten</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => {
              const pc = PRIORITY_CONFIG[a.priority]
              return (
                <li key={a.id} className="rounded-xl border p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>
                    <Badge
                      className={`${pc.bg} ${pc.text} border-0 shrink-0 text-xs`}
                    >
                      {pc.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.created_at, { weekday: undefined, month: 'short' })}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
