# ScanFrame + Supabase Setup Guide

## Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with email or GitHub
3. Create a new project:
   - Project name: `scanframe`
   - Database password: (save this securely)
   - Region: Select closest to Nigeria (e.g., `eu-west-1` Ireland is closest)
4. Wait for project initialization (2-3 minutes)

## Step 2: Get Your Supabase Credentials

Once project is created:
1. Go to **Settings → API**
2. Copy these values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon key` (public) → `VITE_SUPABASE_ANON_KEY`
3. Keep the `service_role` key safe (don't share publicly)

## Step 3: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `supabase_schema.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Verify all tables are created (you'll see them in **Table Editor**)

## Step 4: Configure Environment Variables

1. Create `.env.local` in your `scanframe` folder:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Never commit `.env.local` to git

## Step 5: Install Supabase Client

From `scanframe` folder:
```bash
npm install @supabase/supabase-js
```

## Step 6: Set Up Row-Level Security (RLS)

In Supabase **Authentication → Policies**:
- Frames: Only vendor can edit/delete their own
- Comments: Anyone can insert, anyone can read
- Analytics: Only owner can view

(You'll find RLS policy SQL in `supabase_rls_policies.sql`)

## Next Steps

- Run dev server: `npm run dev`
- Test Supabase connection
- Build auth pages
- Build frame submission form

