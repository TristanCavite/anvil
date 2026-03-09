import Link from 'next/link'
import { createClient } from 'lib/supabase/server'
import SignOutButton from './components/SignOutButton'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if logged-in user is a seller
  const isSeller = user
    ? !!(await supabase
        .from('seller_business')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      ).data
    : false

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-green-700">FoodMarket</span>
        <nav className="flex items-center gap-3">
          <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            Browse
          </Link>
          {user ? (
            <>
              <Link href="/reservations" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                My reservations
              </Link>
              {isSeller ? (
                <Link
                  href="/seller/listings"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Seller dashboard
                </Link>
              ) : (
                <Link
                  href="/seller/onboarding"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Start selling
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Surplus food,<br />
          <span className="text-green-600">not wasted.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-md mb-8">
          Find affordable surplus food from local sellers near you — baked goods, meals, produce and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/listings"
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            Browse listings
          </Link>
          {!user && (
            <Link
              href="/sign-up"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Join for free
            </Link>
          )}
          {user && !isSeller && (
            <Link
              href="/seller/onboarding"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Start selling →
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}