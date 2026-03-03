'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, Users, Leaf, Clock, MapPin, Shield } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">NeighborGoods</span>
          </Link>

          {/* Hamburger Menu - Right */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      <>
        {/* Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Slide-in Menu */}
        <div
          className={`fixed right-0 top-0 z-50 h-full w-80 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-zinc-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Content */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {/* Primary Actions */}
                <div className="space-y-2">
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3.5 font-medium text-white hover:bg-zinc-800"
                  >
                    <Users className="h-5 w-5" />
                    <span>Sign Up</span>
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Log In
                  </Link>
                </div>

                {/* Browse Section */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Browse
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/listings/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>All Listings</span>
                    </Link>
                    <Link
                      href="/listings/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <MapPin className="h-5 w-5" />
                      <span>Nearby</span>
                    </Link>
                  </div>
                </div>

                {/* For Sellers */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    For Sellers
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/seller/onboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <Leaf className="h-5 w-5 text-emerald-600" />
                      <span>Become a Seller</span>
                    </Link>
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span>Seller Dashboard</span>
                    </Link>
                  </div>
                </div>

                {/* Support */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Support
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <span>Report an Issue</span>
                    </Link>
                    <Link
                      href="/account/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="border-t border-zinc-200 px-6 py-4">
              <p className="text-xs text-zinc-600">
                © {new Date().getFullYear()} NeighborGoods
              </p>
            </div>
          </div>
        </div>
      </>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
              Good Food Shouldn't Go to Waste
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
              Discover affordable surplus food from local businesses, bakeries, and restaurants. 
              Save money while helping reduce food waste in your neighborhood.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="w-full rounded-xl bg-zinc-900 px-8 py-3.5 text-center font-medium text-white shadow-sm hover:bg-zinc-800 sm:w-auto"
              >
                Get Started for Free
              </Link>
              <Link
                href="/listings/search"
                className="w-full rounded-xl border border-zinc-200 bg-white px-8 py-3.5 text-center font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 sm:w-auto"
              >
                Browse Listings
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-zinc-900">50%</div>
              <div className="mt-2 text-sm text-zinc-600">Average Savings</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-zinc-900">1000+</div>
              <div className="mt-2 text-sm text-zinc-600">Daily Listings</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-zinc-900">5000+</div>
              <div className="mt-2 text-sm text-zinc-600">Happy Buyers</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-zinc-600">
              Getting great deals on surplus food is simple
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">1. Browse Listings</h3>
              <p className="mt-3 text-zinc-600">
                Explore surplus food from local businesses near you. Filter by distance, price, and food type.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">2. Reserve & Coordinate</h3>
              <p className="mt-3 text-zinc-600">
                Reserve items instantly and chat with sellers to arrange pickup times that work for you.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">3. Pick Up & Enjoy</h3>
              <p className="mt-3 text-zinc-600">
                Pick up your order at the scheduled time and enjoy quality food at a fraction of the cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-zinc-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">Why Choose NeighborGoods?</h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Benefit 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Save Money</h3>
              <p className="mt-2 text-zinc-600">
                Get quality food at up to 50% off regular prices. Perfect for budget-conscious shoppers.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Reduce Waste</h3>
              <p className="mt-2 text-zinc-600">
                Help prevent perfectly good food from going to waste and support sustainability.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Support Local</h3>
              <p className="mt-2 text-zinc-600">
                Connect with local businesses and help them reduce losses from surplus inventory.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Nearby Options</h3>
              <p className="mt-2 text-zinc-600">
                Find surplus food listings from businesses in your neighborhood for easy pickup.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Real-Time Updates</h3>
              <p className="mt-2 text-zinc-600">
                See live availability and get instant notifications when new items are posted.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">Verified Sellers</h3>
              <p className="mt-2 text-zinc-600">
                All sellers are verified to ensure quality and reliability for every purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm sm:p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
                Have Surplus Food to Sell?
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Join NeighborGoods as a seller and turn your surplus inventory into additional income while reducing waste.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="w-full rounded-xl bg-emerald-600 px-8 py-3.5 text-center font-medium text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                >
                  Sign Up & Apply to Sell
                </Link>
                <Link
                  href="/listings/search"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-8 py-3.5 text-center font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 sm:w-auto"
                >
                  Learn More
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-600">
                Create your buyer account first, then apply to become a seller from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-zinc-900 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Saving?
          </h2>
          <p className="mt-4 text-lg text-zinc-300">
            Join thousands of happy buyers getting great deals on quality food every day.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/signup"
              className="inline-block w-full rounded-xl bg-white px-8 py-3.5 font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 sm:w-auto"
            >
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/listings/search" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Log In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">For Sellers</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/seller/onboard" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Become a Seller
                  </Link>
                </li>
                <li>
                  <Link href="/seller/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Seller Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Support</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/reports" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Report Issue
                  </Link>
                </li>
                <li>
                  <Link href="/account/settings" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">About</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <span className="text-sm text-zinc-600">Reducing Food Waste</span>
                </li>
                <li>
                  <span className="text-sm text-zinc-600">Supporting Local</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-zinc-200 pt-8 text-center">
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} NeighborGoods. Helping reduce food waste, one meal at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}