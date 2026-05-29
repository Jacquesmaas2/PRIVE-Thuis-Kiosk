import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = { title: 'Registreren — Thuis Kiosk' }

type InviteData = { email: string; role: string; family_name: string } | null

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  let inviteData: InviteData = null

  if (searchParams.token) {
    // Use service role — invitations are not readable without auth (RLS)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin
      .from('invitations')
      .select('email, role, families(name)')
      .eq('token', searchParams.token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (data) {
      inviteData = {
        email: data.email,
        role: data.role as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        family_name: (data.families as any)?.name ?? '',
      }
    }
  }

  return (
    <RegisterForm
      inviteToken={searchParams.token}
      inviteData={inviteData}
    />
  )
}
