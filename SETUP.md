# NeighborGoods Setup Guide

This guide will help you set up the NeighborGoods project locally for development.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** `>=18.17.0` ([Download](https://nodejs.org/))
- **npm** `>=9.0.0` (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- A **Supabase** account ([Create one](https://supabase.com/))

### Check Your Versions

```bash
node --version    # Should be v18.17.0 or higher
npm --version     # Should be 9.0.0 or higher
git --version     # Should be 2.0.0 or higher
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/TristanCavite/anvil.git
cd anvil
```

### 2. Install Dependencies

```bash
npm install
```

This will read `package.json` and `package-lock.json` and install all required packages in `node_modules/`.

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **Anon Key**

### 4. Set Up Supabase Database

You'll need to create the database tables. Run the SQL migrations in Supabase:

1. Go to your Supabase project → **SQL Editor**
2. Create the some of the tables:



For the complete database schema, refer to the **ERD** in the project documentation.

### 5. Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

Open your browser and navigate to the URL to see the landing page.



## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Database Schema Overview

The project uses Supabase with the following main tables:

- **users** - User accounts and profiles
- **sellers** - Seller business information
- **listings** - Food items for sale
- **reservations** - Order reservations
- **orders** - Completed orders
- **messages** - In-order chat messages
- **notifications** - User notifications
- **reports** - Community reports
- **audit_log** - Activity logging

See the main documentation for the complete ERD.

## Authentication Flow

1. Users sign up on `/auth/signup` as **buyers** by default
2. Authentication is handled by Supabase Auth
3. Session is maintained via cookies (middleware configured)
4. Protected routes redirect to login if not authenticated
5. After signup, users can apply to become sellers from the dashboard

## Common Issues & Troubleshooting

### `Cannot find module '@/lib/supabase/client'`
Make sure you have all dependencies installed:
```bash
npm install
```

### Environment variables not loading
1. Ensure `.env.local` exists in the project root
2. Restart the dev server: `npm run dev`
3. Verify keys are correct (no extra spaces)

### Supabase connection errors
1. Double-check your Supabase URL and Anon Key in `.env.local`
2. Make sure your Supabase project is active
3. Check that you're using the correct project from the Supabase dashboard

### Port 3000 already in use
Run the dev server on a different port:
```bash
npm run dev -- -p 3001
```

## Next Steps

1. ✅ Complete the setup above
2. 📖 Read through the main `README.md` for project overview
3. 🏗️ Familiarize yourself with the project structure
4. 🔐 Review authentication implementation in `lib/supabase/`
5. 🎨 Check the design system in `app/globals.css` and Tailwind config
6. 🚀 Start contributing!

## Need Help?

If you encounter issues:

1. Check this SETUP.md file
2. Review the troubleshooting section above
3. Check Supabase documentation: https://supabase.com/docs
4. Create an issue in the repository

## Important Notes

- **Never commit `.env.local`** - It contains sensitive API keys
- **Never commit `node_modules/`** - These are installed via `npm install`
- **Never commit `.next/`** - This is a build artifact
- Always use `package-lock.json` to ensure consistent dependency versions
- Use `.env.example` as a template for new developers

## Contributing

When adding new dependencies:

```bash
# Add a new dependency
npm install package-name

# Add a dev dependency
npm install --save-dev package-name
```

This automatically updates `package.json` and `package-lock.json`. Commit both files so co-developers get the same versions.

---

**Last Updated:** March 4, 2026  
**Project:** NeighborGoods (Web Platform)  
**Framework:** Next.js 16+ with Supabase & Tailwind CSS
