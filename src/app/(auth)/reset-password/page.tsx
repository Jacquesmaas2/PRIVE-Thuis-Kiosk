import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = { title: 'Wachtwoord resetten — Thuis Kiosk' }

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
