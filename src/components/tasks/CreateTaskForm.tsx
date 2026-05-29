'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations/tasks'
import { ROUTES, RECURRENCE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/types'

interface CreateTaskFormProps {
  profiles: Profile[]
}

export function CreateTaskForm({ profiles }: CreateTaskFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { points: 10, is_recurring: false },
  })

  async function onSubmit(values: CreateTaskInput) {
    setServerError(null)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const err = await res.json()
      setServerError(err.error ?? 'Er ging iets fout')
      return
    }
    router.push(ROUTES.tasks)
    router.refresh()
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nieuwe taak</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Naam *</Label>
            <Input id="title" {...register('title')} placeholder="Bijv. Kamer opruimen" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="points">Punten *</Label>
              <Input id="points" type="number" min={1} max={1000} {...register('points', { valueAsNumber: true })} />
              {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Herhaling</Label>
              <Select defaultValue="none" onValueChange={(v) => {
                if (v === 'none') {
                  setValue('is_recurring', false)
                  setValue('recurrence_pattern', null)
                } else {
                  setValue('is_recurring', true)
                  setValue('recurrence_pattern', v as 'daily' | 'weekly' | 'monthly')
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Toewijzen aan *</Label>
            <Select onValueChange={(v) => setValue('assigned_to', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een persoon" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to && <p className="text-xs text-destructive">{errors.assigned_to.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Vervaldatum</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Annuleren
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Opslaan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
