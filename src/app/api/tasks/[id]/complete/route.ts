import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeTaskSchema } from '@/lib/validations/tasks'

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Fetch the instance to verify ownership + get points
  const { data: instance, error: instErr } = await supabase
    .from('task_instances')
    .select('id, status, assigned_to, task:tasks(id, points, family_id)')
    .eq('id', params.id)
    .single()

  if (instErr || !instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  if (instance.assigned_to !== profile.id) {
    return NextResponse.json({ error: 'Forbidden: not your task' }, { status: 403 })
  }
  if (instance.status !== 'pending') {
    return NextResponse.json({ error: 'Task already completed or approved' }, { status: 409 })
  }

  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const parsed = completeTaskSchema.safeParse(body)
  const notes = parsed.success ? parsed.data.notes : undefined

  const task = instance.task as unknown as { id: string; points: number; family_id: string } | null
  if (!task) return NextResponse.json({ error: 'Task data missing' }, { status: 500 })

  // Mark instance completed
  const { error: updateErr } = await supabase
    .from('task_instances')
    .update({ status: 'completed', completed_at: new Date().toISOString(), notes })
    .eq('id', params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Append points to ledger
  const { error: ledgerErr } = await supabase
    .from('points_ledger')
    .insert({
      family_id: task.family_id,
      user_id: profile.id,
      amount: task.points,
      reason: 'Taak voltooid',
      reference_id: task.id,
      reference_type: 'task',
    })

  if (ledgerErr) {
    // Rollback instance status
    await supabase
      .from('task_instances')
      .update({ status: 'pending', completed_at: null, notes: null })
      .eq('id', params.id)
    return NextResponse.json({ error: ledgerErr.message }, { status: 500 })
  }

  return NextResponse.json({ data: { points_earned: task.points } })
}
