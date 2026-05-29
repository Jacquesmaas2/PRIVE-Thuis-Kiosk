import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import type { Profile } from '@/types'

// Server-side Supabase client — uses httpOnly cookies for session.
// Call from Server Components, Route Handlers, and Server Actions.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Calling set() from a Server Component is a no-op.
            // The session is refreshed in middleware instead.
          }
        },
      },
    },
  )
}

// Convenience: get the authenticated user + their profile in one call.
// When a kid PIN session is active (active_profile_id cookie), that profile is
// returned instead of the auth user's own profile. The underlying Supabase
// session (and RLS context) remains the parent's.
export async function getAuthProfile(): Promise<{
  userId: string | null
  profile: Profile | null
}> {
  const cookieStore = cookies()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { userId: null, profile: null }

  // Check for an active kid-profile override (set after PIN verification)
  const activeProfileId = cookieStore.get('active_profile_id')?.value
  if (activeProfileId) {
    // RLS ensures only profiles in the auth user's family are returned
    const { data: kidProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeProfileId)
      .single()
    if (kidProfile) return { userId: user.id, profile: kidProfile as Profile }
    // Cookie is stale/invalid — fall through to auth user's profile
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return { userId: user.id, profile }
}
