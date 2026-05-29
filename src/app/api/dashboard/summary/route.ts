import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchWeather } from '@/lib/weather'
import type { DashboardSummary } from '@/types'

export const revalidate = 60 // ISR: refresh every 60s

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'Geen familie gevonden' }, { status: 400 })
    }

    const familyId = profile.family_id

    // Parallel fetches
    const [
      { data: family },
      { data: taskInstances },
      { data: announcements },
      { data: balanceRows },
      { data: profiles },
      { data: familySettings },
    ] = await Promise.all([
      supabase.from('families').select('*').eq('id', familyId).single(),
      supabase
        .from('task_instances')
        .select('*, task:tasks(id, title, description, points, is_recurring)')
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .lte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('announcements')
        .select('*')
        .eq('family_id', familyId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3),
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
    ])

    const weather = await fetchWeather(
      familySettings?.latitude ?? undefined,
      familySettings?.longitude ?? undefined,
      familySettings?.city ?? undefined,
    ).catch(() => null)

    // Build leaderboard
    const balanceMap = new Map(
      (balanceRows ?? []).map((r) => [r.user_id, r.balance ?? 0]),
    )
    const leaderboard = (profiles ?? [])
      .filter((p) => p.role === 'kid')
      .map((p) => ({ ...p, balance: balanceMap.get(p.id) ?? 0, family_id: familyId }))
      .sort((a, b) => b.balance - a.balance)

    // Pending count
    const { count: pendingCount } = await supabase
      .from('task_instances')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('status', 'pending')

    const summary: DashboardSummary = {
      profile,
      family: family!,
      pendingTasks: pendingCount ?? 0,
      tasksDueToday: (taskInstances as DashboardSummary['tasksDueToday']) ?? [],
      announcements: announcements ?? [],
      leaderboard,
      weather,
    }

    return NextResponse.json({ data: summary })
  } catch (err) {
    console.error('[dashboard/summary]', err)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
