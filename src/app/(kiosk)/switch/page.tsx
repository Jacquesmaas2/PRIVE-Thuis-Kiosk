import { redirect } from 'next/navigation'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProfileSwitcher } from './ProfileSwitcher'

export const metadata = { title: 'Wissel van profiel | Thuis Kiosk' }

export default async function SwitchPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect('/login')

  const supabase = createClient()

  // Fetch all family profiles (including pin_hash to know which need PIN)
  const { data: profiles = [] } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', profile.family_id!)
    .order('created_at', { ascending: true })

  // Determine the auth user's own profile ID (not the active override)
  const { data: authUserProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', userId)
    .single()

  const authProfileId = authUserProfile?.id ?? profile.id

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        title="Wissel van profiel"
        icon={<Users className="h-7 w-7" />}
        description="Kies een profiel om mee verder te gaan"
      />
      <ProfileSwitcher
        profiles={profiles as Parameters<typeof ProfileSwitcher>[0]['profiles']}
        authProfileId={authProfileId}
      />
    </div>
  )
}
