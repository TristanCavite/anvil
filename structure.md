anvil/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             # ✓ Done
│   │   └── signup/
│   │       └── page.tsx             # ✓ Done
│   │
│   ├── (public)/
│   │   ├── layout.tsx               # Public wrapper
│   │   ├── page.tsx                 # ✓ Homepage
│   │   ├── listings/
│   │   │   ├── page.tsx             # ✓ Listings feed (search/filter)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Listing detail view
│   │   │   └── search/
│   │   │       └── page.tsx         # (Optional) Advanced search
│   │   └── profile/
│   │       └── [id]/
│   │           └── page.tsx         # Public seller profile
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Authenticated wrapper with nav
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx             # User dashboard (buyer)
│   │   │
│   │   ├── reservations/
│   │   │   ├── page.tsx             # Reservations list
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Reservation detail
│   │   │       ├── chat/
│   │   │       │   └── page.tsx     # Chat interface
│   │   │       └── layout.tsx       # Reservation wrapper
│   │   │
│   │   ├── account/
│   │   │   ├── settings/
│   │   │   │   └── page.tsx         # Account settings
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx         # Notification preferences
│   │   │   └── layout.tsx
│   │   │
│   │   ├── seller/
│   │   │   ├── onboard/
│   │   │   │   └── page.tsx         # Become a seller
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Seller overview
│   │   │   ├── listings/
│   │   │   │   ├── page.tsx         # Manage listings
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx     # Create listing
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Edit listing
│   │   │   │       └── layout.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx         # Incoming orders/reservations
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Order detail with chat
│   │   │   ├── verification/
│   │   │   │   └── page.tsx         # Business verification
│   │   │   └── layout.tsx           # Seller wrapper with nav
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx           # Admin wrapper (auth + allowlist)
│   │   │   ├── moderation/
│   │   │   │   ├── page.tsx         # Reports queue
│   │   │   │   ├── reports/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Report detail + enforcement
│   │   │   │   └── activity-log/
│   │   │   │       └── page.tsx     # Audit trail viewer
│   │   │   └── enforcement/
│   │   │       └── page.tsx         # Enforcement actions history
│   │   │
│   │   └── messages/                # (Optional) Inbox if not reservation-scoped
│   │       └── page.tsx
│   │
│   ├── api/                         # API Routes & Webhooks
│   │   ├── auth/
│   │   │   └── callback/            # OAuth callback
│   │   │       └── route.ts
│   │   │
│   │   ├── listings/
│   │   │   ├── route.ts             # GET/POST listings
│   │   │   ├── [id]/
│   │   │   │   └── route.ts         # GET/PUT/DELETE single listing
│   │   │   ├── search/
│   │   │   │   └── route.ts         # Advanced search (distance, filters)
│   │   │   └── photos/
│   │   │       └── route.ts         # Upload listing photos
│   │   │
│   │   ├── reservations/
│   │   │   ├── route.ts             # GET/POST reservations
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET reservation, update status
│   │   │       └── cancel/
│   │   │           └── route.ts     # Cancel reservation
│   │   │
│   │   ├── payments/
│   │   │   ├── checkout/
│   │   │   │   └── route.ts         # Create Stripe Checkout
│   │   │   └── webhook/
│   │   │       └── route.ts         # Stripe webhook (payment success/refund)
│   │   │
│   │   ├── messages/
│   │   │   ├── route.ts             # POST message
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET messages for reservation
│   │   │
│   │   ├── ratings/
│   │   │   ├── route.ts             # POST rating (after paid+fulfilled)
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET rating, DELETE (admin only)
│   │   │
│   │   ├── reports/
│   │   │   ├── route.ts             # POST report
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET report (admin), update status
│   │   │
│   │   ├── admin/
│   │   │   ├── enforcement/
│   │   │   │   └── route.ts         # Admin enforcement actions
│   │   │   ├── activity-log/
│   │   │   │   └── route.ts         # Fetch audit trail
│   │   │   └── moderation/
│   │   │       └── route.ts         # Hide listing, remove message/rating
│   │   │
│   │   └── profiles/
│   │       ├── route.ts             # GET/PUT profile
│   │       └── [id]/
│   │           └── route.ts         # GET public profile
│   │
│   ├── globals.css                  # ✓ Exists
│   ├── layout.tsx                   # ✓ Exists
│   └── middleware.ts                # ✓ Exists (auth redirect logic)
│
├── components/                      # Reusable components
│   ├── common/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── nav.tsx
│   │   ├── seller-nav.tsx
│   │   ├── admin-nav.tsx
│   │   └── mobile-menu.tsx
│   │
│   ├── layout/
│   │   ├── dashboard-layout.tsx
│   │   ├── seller-layout.tsx
│   │   └── admin-layout.tsx
│   │
│   ├── cards/
│   │   ├── listing-card.tsx
│   │   ├── reservation-card.tsx
│   │   ├── message-card.tsx
│   │   └── report-card.tsx
│   │
│   ├── forms/
│   │   ├── listing-form.tsx         # Create/edit listing
│   │   ├── location-picker.tsx      # Address + Plus Code selection
│   │   ├── rating-form.tsx
│   │   ├── report-form.tsx
│   │   └── chat-input.tsx
│   │
│   ├── modals/
│   │   ├── location-modal.tsx
│   │   ├── photo-uploader.tsx
│   │   ├── confirmation-modal.tsx
│   │   └── payment-modal.tsx
│   │
│   ├── filters/
│   │   ├── listing-filters.tsx
│   │   ├── category-filter.tsx
│   │   ├── price-filter.tsx
│   │   └── distance-filter.tsx
│   │
│   ├── payment/
│   │   ├── stripe-checkout.tsx
│   │   ├── payment-status.tsx
│   │   └── payment-history.tsx
│   │
│   └── admin/
│       ├── report-queue.tsx
│       ├── enforcement-panel.tsx
│       └── activity-log-viewer.tsx
│
├── hooks/                           # Custom React hooks
│   ├── useAuth.ts                   # Current user + auth state
│   ├── useListings.ts               # Fetch/filter listings
│   ├── useReservations.ts           # Fetch buyer's reservations
│   ├── useLocation.ts               # Geolocation + distance calc
│   ├── useMessages.ts               # Real-time messages
│   ├── usePayment.ts                # Stripe integration
│   ├── useUser.ts                   # User profile
│   ├── useSeller.ts                 # Seller-specific data
│   └── useAdmin.ts                  # Admin reports + enforcement
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # ✓ Exists
│   │   ├── server.ts                # ✓ Exists
│   │   └── admin.ts                 # Server-side admin client
│   │
│   ├── api/
│   │   ├── listings.ts              # Listing queries
│   │   ├── reservations.ts          # Reservation queries
│   │   ├── messages.ts              # Message queries
│   │   ├── ratings.ts               # Rating queries
│   │   ├── reports.ts               # Report queries
│   │   ├── payments.ts              # Stripe integration
│   │   ├── enforcement.ts           # Admin enforcement
│   │   ├── activity-log.ts          # Audit trail
│   │   └── profiles.ts              # User profile queries
│   │
│   ├── types/
│   │   ├── index.ts                 # Supabase auto-generated types
│   │   ├── custom.ts                # Custom app types
│   │   ├── api.ts                   # API request/response types
│   │   ├── database.ts              # Database schema types
│   │   └── stripe.ts                # Stripe types
│   │
│   ├── utils/
│   │   ├── cn.ts                    # classname utility
│   │   ├── format.ts                # Format currency, dates
│   │   ├── location.ts              # Distance calc, geocoding
│   │   ├── validation.ts            # Form validation
│   │   ├── constants.ts             # App constants
│   │   ├── errors.ts                # Error handling
│   │   └── stripe.ts                # Stripe utility functions
│   │
│   └── auth/
│       ├── session.ts               # Get session server-side
│       ├── protect.ts               # Middleware route protection
│       └── permissions.ts           # Check user permissions (seller, admin)
│
├── supabase/                        # Database
│   ├── migrations/
│   │   ├── 001_init_auth.sql        # Create profiles table
│   │   ├── 002_seller_business.sql  # Create seller_business table
│   │   ├── 003_listings.sql         # Create listings + photos
│   │   ├── 004_reservations.sql     # Create reservations + payments
│   │   ├── 005_messages.sql         # Create messages table
│   │   ├── 006_ratings.sql          # Create ratings table
│   │   ├── 007_reports.sql          # Create reports table
│   │   ├── 008_enforcement.sql      # Create enforcement_actions table
│   │   ├── 009_activity_log.sql     # Create activity_log table
│   │   └── 010_rls_policies.sql     # Setup RLS policies
│   │
│   └── seeds/                       # (Optional) Seed data for development
│       └── seed.sql
│
├── public/                          # ✓ Exists
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero.png
│   │   └── placeholders/
│   │
│   └── icons/
│       └── favicon.ico
│
├── styles/                          # Additional styles if needed
│   ├── globals.css                  # ✓ linked from app/
│   └── animations.css
│
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json                     # ✓ Exists
├── postcss.config.mjs               # ✓ Exists
├── tsconfig.json                    # ✓ Exists
├── middleware.ts                    # ✓ Exists
├── README.md                        # ✓ Exists
├── SETUP.md
└── .env.local                       # (Not in repo - local only)