'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, Users, Leaf, Clock, MapPin, Shield, Sparkles, TrendingDown, Heart, Star } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/30">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">NeighborGoods</span>
          </Link>

          {/* Hamburger Menu - Right */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
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
            className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
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
            <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-emerald-50 to-transparent px-6 py-5">
              <h2 className="text-lg font-semibold text-zinc-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
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
                    className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3.5 font-medium text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:shadow-emerald-600/40"
                  >
                    <Users className="h-5 w-5" />
                    <span>Sign Up Free</span>
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3.5 font-medium text-zinc-900 transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                  >
                    Log In
                  </Link>
                </div>

                {/* Browse Section */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Browse
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/listings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>All Listings</span>
                    </Link>
                    <Link
                      href="/listings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <MapPin className="h-5 w-5" />
                      <span>Nearby Deals</span>
                    </Link>
                  </div>
                </div>

                {/* For Sellers */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    For Sellers
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/seller/onboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <Leaf className="h-5 w-5 text-emerald-600" />
                      <span>Become a Seller</span>
                    </Link>
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span>Seller Dashboard</span>
                    </Link>
                  </div>
                </div>

                {/* Support */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Support
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <span>Report an Issue</span>
                    </Link>
                    <Link
                      href="/account/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4">
              <p className="text-xs text-zinc-500">
                © {new Date().getFullYear()} NeighborGoods
              </p>
            </div>
          </div>
        </div>
      </>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-100 opacity-40 blur-3xl" />
          <div className="absolute right-0 top-20 h-[600px] w-[600px] rounded-full bg-amber-100 opacity-30 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-100 opacity-20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>Join 5,000+ neighbors reducing food waste</span>
            </div>

            {/* Main Heading */}
            <h1 className="mt-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
              Good Food<br />
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text">Shouldn't Waste</span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
              Discover delicious surplus food from local businesses at up to 
              <span className="font-semibold text-emerald-700"> 50% off</span>. 
              Save money, reduce waste, and support your community—all in one click.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/listings"
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 text-center font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-600/40 sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Browse Listings
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-700 to-emerald-800 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="/auth/signup"
                className="w-full rounded-xl border-2 border-zinc-200 bg-white px-8 py-4 text-center font-semibold text-zinc-900 shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-50 sm:w-auto"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Verified sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span>4.9/5 average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <span>100% satisfaction</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:border-emerald-200 hover:shadow-xl">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <TrendingDown className="h-16 w-16 text-emerald-600" />
              </div>
              <div className="relative">
                <div className="text-4xl font-bold text-emerald-600">50%</div>
                <div className="mt-2 text-sm font-medium text-zinc-600">Average Savings</div>
                <p className="mt-2 text-xs text-zinc-500">Save big on quality food every day</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:border-amber-200 hover:shadow-xl">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <ShoppingBag className="h-16 w-16 text-amber-600" />
              </div>
              <div className="relative">
                <div className="text-4xl font-bold text-amber-600">1,000+</div>
                <div className="mt-2 text-sm font-medium text-zinc-600">Daily Listings</div>
                <p className="mt-2 text-xs text-zinc-500">Fresh deals posted every hour</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:border-blue-200 hover:shadow-xl">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Users className="h-16 w-16 text-blue-600" />
              </div>
              <div className="relative">
                <div className="text-4xl font-bold text-blue-600">5,000+</div>
                <div className="mt-2 text-sm font-medium text-zinc-600">Happy Buyers</div>
                <p className="mt-2 text-xs text-zinc-500">Join our growing community</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-900">
              <Sparkles className="h-4 w-4" />
              <span>Simple Process</span>
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Three simple steps to delicious savings
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {/* Step 1 */}
            <div className="relative">
              {/* Connector Line (hidden on mobile) */}
              <div className="absolute left-1/2 top-8 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-emerald-200 to-amber-200 md:block" />
              
              <div className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-600/40">
                  <ShoppingBag className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white shadow-lg">
                  1
                </div>
                <h3 className="mt-8 text-2xl font-bold text-zinc-900">Browse & Discover</h3>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Explore delicious surplus food from verified local businesses. Filter by distance, price, and food type to find exactly what you want.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              {/* Connector Line (hidden on mobile) */}
              <div className="absolute left-1/2 top-8 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-amber-200 to-blue-200 md:block" />
              
              <div className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-amber-600/40">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white shadow-lg">
                  2
                </div>
                <h3 className="mt-8 text-2xl font-bold text-zinc-900">Reserve & Pay</h3>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Secure your item with instant payment. Chat with sellers to coordinate pickup times and get any special instructions.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-600/40">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white shadow-lg">
                  3
                </div>
                <h3 className="mt-8 text-2xl font-bold text-zinc-900">Pick Up & Enjoy</h3>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Head to the pickup location at your scheduled time. Enjoy quality food at amazing prices while helping the planet.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-600/40"
            >
              Start Browsing Now
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
              <Heart className="h-4 w-4" />
              <span>Why NeighborGoods</span>
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Good for You, Great for the Planet
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
              Every purchase makes a difference
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Benefit 1 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-emerald-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-lg">
                  <TrendingDown className="h-7 w-7 text-emerald-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Save Big Money</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  Get quality food at up to <span className="font-semibold text-emerald-700">50% off</span> regular prices. Perfect for budget-conscious shoppers who don't want to compromise on quality.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-green-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-green-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-lg">
                  <Leaf className="h-7 w-7 text-green-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Reduce Food Waste</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  Help prevent perfectly good food from going to waste. Every purchase keeps surplus food out of landfills and supports sustainability.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-amber-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg">
                  <Heart className="h-7 w-7 text-amber-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Support Local</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  Connect with local businesses and help them reduce losses from surplus inventory while strengthening your community.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-blue-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-blue-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                  <MapPin className="h-7 w-7 text-blue-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Nearby Options</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  Find surplus food listings from businesses in your neighborhood with precise Plus Code locations for easy pickup.
                </p>
              </div>
            </div>

            {/* Benefit 5 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-purple-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-purple-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-lg">
                  <Clock className="h-7 w-7 text-purple-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Real-Time Updates</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  See live availability and get instant notifications when new items are posted near you. Never miss a great deal.
                </p>
              </div>
            </div>

            {/* Benefit 6 */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-rose-300 hover:shadow-2xl">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-rose-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 shadow-lg">
                  <Shield className="h-7 w-7 text-rose-700" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900">Verified & Safe</h3>
                <p className="mt-3 leading-relaxed text-zinc-600">
                  All sellers are verified and rated by the community. Shop with confidence knowing you're protected every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-200 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 p-10 shadow-2xl backdrop-blur-sm sm:p-16">
            {/* Decorative Elements */}
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 opacity-10 blur-3xl" />

            <div className="relative text-center">
              {/* Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-600/40">
                <Leaf className="h-10 w-10 text-white" />
              </div>

              {/* Heading */}
              <h2 className="mt-8 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Turn Surplus into Income
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
                Have surplus food to sell? Join NeighborGoods as a seller and convert your extra inventory into revenue while reducing waste and helping your community.
              </p>

              {/* Features List */}
              <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-sm text-zinc-700">Quick listing creation</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-sm text-zinc-700">Direct payments via Stripe</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-sm text-zinc-700">Built-in chat with buyers</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-sm text-zinc-700">Location-based discovery</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/seller/onboard"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 text-center font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-600/40 sm:w-auto"
                >
                  Apply to Become a Seller
                </Link>
                <Link
                  href="/listings"
                  className="w-full rounded-xl border-2 border-zinc-300 bg-white px-8 py-4 text-center font-semibold text-zinc-900 transition-all hover:border-emerald-600 hover:bg-emerald-50 sm:w-auto"
                >
                  Learn More
                </Link>
              </div>
              <p className="mt-6 text-sm text-zinc-500">
                Create your buyer account first, then apply for seller access from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-emerald-600 opacity-20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-600 opacity-20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>Join 5,000+ Members</span>
          </div>

          {/* Heading */}
          <h2 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Ready to Start Saving?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Join thousands of happy buyers getting great deals on quality food every day. 
            Sign up free and start making a difference today.
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span>No subscription fees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-10">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-5 text-lg font-semibold text-zinc-900 shadow-2xl transition-all hover:scale-105 hover:shadow-white/20"
            >
              Create Your Free Account
              <Users className="h-5 w-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>100% satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Footer Top */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/30">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-zinc-900">NeighborGoods</span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Reducing food waste, one meal at a time. Join our community of conscious consumers and local sellers.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                  <Leaf className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Platform</h3>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link href="/listings" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link href="/reservations" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    My Reservations
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">For Sellers</h3>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link href="/seller/onboard" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Become a Seller
                  </Link>
                </li>
                <li>
                  <Link href="/seller/dashboard" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Seller Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/seller/listings" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Manage Listings
                  </Link>
                </li>
                <li>
                  <Link href="/seller/orders" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Orders
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Support</h3>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link href="/reports" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Report Issue
                  </Link>
                </li>
                <li>
                  <Link href="/account/settings" className="text-sm text-zinc-600 transition-colors hover:text-emerald-700">
                    Settings
                  </Link>
                </li>
                <li>
                  <span className="text-sm text-zinc-600">Help Center</span>
                </li>
                <li>
                  <span className="text-sm text-zinc-600">Contact Us</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="mt-12 border-t border-zinc-200 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-zinc-600">
                © {new Date().getFullYear()} NeighborGoods. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
                <span className="transition-colors hover:text-emerald-700">Privacy Policy</span>
                <span className="transition-colors hover:text-emerald-700">Terms of Service</span>
                <span className="transition-colors hover:text-emerald-700">Cookies</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}