import { describe, it, expect } from 'vitest'
import { createTaskSchema, completeTaskSchema, approveTaskSchema } from '@/lib/validations/tasks'
import { todayISO } from '@/lib/utils'

describe('createTaskSchema', () => {
  const valid = {
    title: 'Kamer opruimen',
    points: 10,
    assigned_to: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  }

  it('accepts valid input', () => {
    const result = createTaskSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults recurrence to none', () => {
    const result = createTaskSchema.safeParse(valid)
    expect(result.success && result.data.recurrence_pattern).toBeFalsy()
  })

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined()
    }
  })

  it('rejects zero points', () => {
    const result = createTaskSchema.safeParse({ ...valid, points: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative points', () => {
    const result = createTaskSchema.safeParse({ ...valid, points: -5 })
    expect(result.success).toBe(false)
  })

  it('rejects points over 1000', () => {
    const result = createTaskSchema.safeParse({ ...valid, points: 1001 })
    expect(result.success).toBe(false)
  })

  it('requires assigned_to', () => {
    const { assigned_to: _, ...without } = valid
    const result = createTaskSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('rejects invalid recurrence value', () => {
    const result = createTaskSchema.safeParse({ ...valid, recurrence: 'hourly' })
    expect(result.success).toBe(false)
  })
})

describe('completeTaskSchema', () => {
  it('allows empty body', () => {
    const result = completeTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts optional notes', () => {
    const result = completeTaskSchema.safeParse({ notes: 'Goed gedaan!' })
    expect(result.success && result.data.notes).toBe('Goed gedaan!')
  })
})

describe('approveTaskSchema', () => {
  it('requires approved field', () => {
    const r1 = approveTaskSchema.safeParse({ approved: true })
    const r2 = approveTaskSchema.safeParse({ approved: false })
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    const r3 = approveTaskSchema.safeParse({})
    expect(r3.success).toBe(false)
  })
})

describe('todayISO', () => {
  it('returns a valid ISO date string', () => {
    const today = todayISO()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(today).getTime()).not.toBeNaN()
  })
})
