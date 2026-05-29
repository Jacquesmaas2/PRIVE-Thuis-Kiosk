import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PointsBadge } from '@/components/shared/PointsBadge'

export const metadata = { title: 'Ranglijst | Thuis Kiosk' }

export default async function LeaderboardPage() {
  const { userId } = await getAuthProfile()
  if (!userId) redirect(ROUTES.login)

  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('user_points_balance')
    .select('profile_id, display_name, avatar_url, color, role, points_balance')
    .neq('role', 'guest')
    .order('points_balance', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="Ranglijst" description="Wie heeft de meeste punten?" icon={<Trophy className="h-7 w-7 text-yellow-500" />} />
      <ol className="space-y-3">
        {(profiles ?? []).map((p, idx) => (
          <li key={p.profile_id} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <span className="text-xl font-bold text-muted-foreground w-7 text-center">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
            </span>
            <UserAvatar profile={{ display_name: p.display_name, avatar_url: p.avatar_url, color: p.color }} size="md" />
            <span className="flex-1 font-medium">{p.display_name}</span>
            <PointsBadge points={p.points_balance ?? 0} size="lg" />
          </li>
        ))}
      </ol>
    </div>
  )
}
