import { createClient } from 'lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
  }

  // Redirect to home page after sign out
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}
