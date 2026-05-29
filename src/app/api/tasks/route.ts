import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/lib/validations/tasks'
import { todayISO } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // pending | completed | all
  const assignee = searchParams.get('assignee') // profile_id

  let query = supabase
    .from('task_instances')
    .select(`
      id, status, due_date, completed_at, notes,
      task:tasks(id, title, description, points, is_recurring, recurrence_pattern),
      assignee:profiles!task_instances_assigned_to_fkey(id, display_name, avatar_url, color)
    `)
    .order('due_date', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (assignee) {
    query = query.eq('assigned_to', assignee)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.role !== 'parent') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 422 })
  }

  const { title, description, points, recurrence_pattern, is_recurring, assigned_to, due_date } = parsed.data

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .insert({
      family_id: profile.family_id,
      created_by: user.id,
      title,
      description,
      points,
      is_recurring: is_recurring ?? false,
      recurrence_pattern: recurrence_pattern ?? null,
      assigned_to,
    })
    .select()
    .single()

  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 })

  // Create the first task instance
  const { data: instance, error: instErr } = await supabase
    .from('task_instances')
    .insert({
      task_id: task.id,
      assigned_to,
      due_date: due_date ?? todayISO(),
      status: 'pending',
    })
    .select()
    .single()

  if (instErr) return NextResponse.json({ error: instErr.message }, { status: 500 })

  return NextResponse.json({ data: { task, instance } }, { status: 201 })
}
