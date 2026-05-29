import { describe, it, expect } from 'vitest'
import {
  createGroceryListSchema,
  addGroceryItemSchema,
  updateGroceryItemSchema,
} from '@/lib/validations/grocery'

describe('createGroceryListSchema', () => {
  it('accepts a valid name', () => {
    const result = createGroceryListSchema.safeParse({ name: 'Weekboodschappen' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = createGroceryListSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('addGroceryItemSchema', () => {
  const valid = { name: 'Melk', category: 'zuivel' }

  it('accepts minimal valid input', () => {
    const result = addGroceryItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts quantity and unit', () => {
    const result = addGroceryItemSchema.safeParse({ ...valid, quantity: 2, unit: 'liter' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe(2)
      expect(result.data.unit).toBe('liter')
    }
  })

  it('rejects empty item name', () => {
    const result = addGroceryItemSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative quantity', () => {
    const result = addGroceryItemSchema.safeParse({ ...valid, quantity: -1 })
    expect(result.success).toBe(false)
  })
})

describe('updateGroceryItemSchema', () => {
  it('accepts is_checked update', () => {
    const result = updateGroceryItemSchema.safeParse({ is_checked: true })
    expect(result.success).toBe(true)
  })

  it('accepts name update', () => {
    const result = updateGroceryItemSchema.safeParse({ name: 'Sinaasappelsap' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name on update', () => {
    const result = updateGroceryItemSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts empty object (all fields optional)', () => {
    const result = updateGroceryItemSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
