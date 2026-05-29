import { createHmac } from 'crypto'

/**
 * Deterministically derive the kiosk Supabase auth credentials for a family.
 * The password is HMAC-SHA256(key, familyId) so no DB storage of secrets is needed.
 * Falls back to SUPABASE_SERVICE_ROLE_KEY as the hmac key if KIOSK_HMAC_KEY is not set.
 */
export function kioskCredentials(familyId: string) {
  const key = process.env.KIOSK_HMAC_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  const password = createHmac('sha256', key).update(familyId).digest('base64url').slice(0, 40)
  return {
    email: `kiosk-${familyId}@thuis-kiosk.internal`,
    password,
  }
}

export const KIOSK_FAMILY_COOKIE = 'kiosk_family_id'
export const KIOSK_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year
