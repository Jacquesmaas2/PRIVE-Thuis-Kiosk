import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { fetchWeather } from '@/lib/weather'
import { formatDate, todayISO } from '@/lib/utils'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { TasksSummaryCard } from '@/components/dashboard/TasksSummaryCard'
import { AnnouncementsCard } from '@/components/dashboard/AnnouncementsCard'
import { PointsCard } from '@/components/dashboard/PointsCard'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { PageLoading } from '@/components/shared/LoadingSpinner'

export const metadata: Metadata = { title: 'Dashboard — Thuis Kiosk' }

export default async function DashboardPage() {
  const { profile } = await getAuthProfile()
  if (!profile || !profile.family_id) return null

  const supabase = createClient()
  const familyId = profile.family_id
  const today = todayISO()

  // Parallel data fetching (server-side)
  const [
    { data: family },
    { data: taskInstances },
    { data: announcements },
    { data: balanceRows },
    { data: profiles },
    { data: familySettings },
    weather,
  ] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).single(),
    supabase
      .from('task_instances')
      .select('*, task:tasks(id, title, description, points, is_recurring)')
      .eq('assigned_to', profile.id)
      .eq('status', 'pending')
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('announcements')
      .select('*')
      .eq('family_id', familyId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_points_balance')
      .select('user_id, balance')
      .eq('family_id', familyId),
    supabase
      .from('profiles')
      .select('*')
      .eq('family_id', familyId),
    supabase
      .from('family_settings')
      .select('latitude, longitude, city')
      .eq('family_id', familyId)
      .single(),
    Promise.resolve(null), // weather fetched after settings
  ])

  const weatherLocation = familySettings?.city ?? undefined
  const resolvedWeather = await fetchWeather(
    familySettings?.latitude ?? undefined,
    familySettings?.longitude ?? undefined,
    weatherLocation,
  ).catch(() => null)
  void weather // unused placeholder from Promise.all

  const balanceMap = new Map(
    (balanceRows ?? []).map((r) => [r.user_id, r.balance ?? 0]),
  )
  const leaderboard = (profiles ?? [])
    .filter((p) => p.role === 'kid')
    .map((p) => ({ ...p, balance: balanceMap.get(p.id) ?? 0 }))
    .sort((a, b) => b.balance - a.balance)

  const myBalance = balanceMap.get(profile.id) ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <WelcomeBanner
        profile={profile}
        familyName={family?.name ?? ''}
        dateLabel={formatDate(new Date())}
      />

      {/* Top row: weather + points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense fallback={<PageLoading />}>
          <WeatherWidget weather={resolvedWeather} />
        </Suspense>
        <PointsCard currentProfile={{ ...profile, balance: myBalance }} leaderboard={leaderboard} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksSummaryCard taskInstances={taskInstances ?? []} profile={profile} />
        <AnnouncementsCard announcements={announcements ?? []} />
      </div>
    </div>
  )
}
