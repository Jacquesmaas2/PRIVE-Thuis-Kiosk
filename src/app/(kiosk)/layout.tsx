import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/supabase/server'
import { NavBar } from '@/components/shared/NavBar'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await getAuthProfile()

  if (!userId) redirect('/login')
  if (!profile) redirect('/register')

  return (
    <div className="min-h-screen bg-background kiosk-no-select">
      <NavBar profile={profile} />
      <main className="container mx-auto px-4 py-6 md:px-6 max-w-7xl">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  )
}
