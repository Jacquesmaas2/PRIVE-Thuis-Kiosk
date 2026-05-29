import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PointsBadge } from '@/components/shared/PointsBadge'
import type { ProfileWithBalance } from '@/types'

interface PointsCardProps {
  currentProfile: ProfileWithBalance
  leaderboard: ProfileWithBalance[]
}

export function PointsCard({ currentProfile, leaderboard }: PointsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Punten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Own balance highlight */}
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar profile={currentProfile} size="md" />
            <span className="font-medium text-sm">Jouw saldo</span>
          </div>
          <PointsBadge points={currentProfile.balance} size="lg" />
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
              Ranglijst
            </p>
            <ol className="space-y-2">
              {leaderboard.map((profile, idx) => (
                <li
                  key={profile.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    profile.id === currentProfile.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-sm font-semibold text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <UserAvatar profile={profile} size="sm" />
                    <span className="text-sm">{profile.display_name}</span>
                  </div>
                  <PointsBadge points={profile.balance} />
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
