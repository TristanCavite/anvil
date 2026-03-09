import Link from 'next/link'
import { createClient } from 'lib/supabase/server'
import SignOutButton from './components/SignOutButton'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-900">NeighborGoods</h1>
      <p className="text-sm text-gray-500">Homepage placeholder</p>
      <div className="flex gap-3">
        {user ? (
          <>
            <Link
              href="/listings"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Browse listings
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </main>
  )
}