import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS entirely.
 * ONLY use in Server Actions / Route Handlers, never in client code.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
