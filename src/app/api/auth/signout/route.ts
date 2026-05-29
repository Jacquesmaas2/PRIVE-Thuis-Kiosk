import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL(ROUTES.login, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
}
