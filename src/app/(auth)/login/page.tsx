import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LoginForm } from '@/components/auth/LoginForm'
import { KidLoginPanel } from '@/components/auth/KidLoginPanel'
import { getAuthProfile, createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { KIOSK_FAMILY_COOKIE } from '@/lib/kiosk'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Inloggen — Thuis Kiosk' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; mode?: string }
}) {
  const redirectTo = searchParams.redirectTo ?? '/dashboard'

  // If the parent explicitly wants to re-login (e.g. after "Inloggen als andere ouder"), skip kid panel
  const forceParent = searchParams.mode === 'parent'

  if (!forceParent) {
    const { userId, profile } = await getAuthProfile()

    if (userId && profile?.family_id) {
      const supabase = createClient()

      const { data: profiles = [] } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('is_kiosk', false)
        .order('created_at', { ascending: true })

      const { data: authUserProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      const authProfileId = authUserProfile?.id ?? profile.id

      return (
        <KidLoginPanel
          profiles={profiles as (Profile & { pin_hash: string | null })[]}
          authProfileId={authProfileId}
          familyId={profile.family_id}
          redirectTo={redirectTo}
        />
      )
    }

    // No active auth session — check if this device has a kiosk cookie
    const cookieStore = cookies()
    const kioskFamilyId = cookieStore.get(KIOSK_FAMILY_COOKIE)?.value

    if (kioskFamilyId) {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      const [{ data: kioskProfiles }, { data: settings }] = await Promise.all([
        admin
          .from('profiles')
          .select('*')
          .eq('family_id', kioskFamilyId)
          .eq('is_kiosk', false)
          .not('pin_hash', 'is', null) // only show profiles that have a PIN set
          .order('created_at', { ascending: true }),
        admin
          .from('family_settings')
          .select('kiosk_auth_user_id')
          .eq('family_id', kioskFamilyId)
          .single(),
      ])

      if (kioskProfiles?.length && settings?.kiosk_auth_user_id) {
        return (
          <KidLoginPanel
            profiles={kioskProfiles as (Profile & { pin_hash: string | null })[]}
            authProfileId=""
            familyId={kioskFamilyId}
            redirectTo={redirectTo}
            isKioskMode
          />
        )
      }
    }
  }

  return <LoginForm redirectTo={redirectTo} />
}

