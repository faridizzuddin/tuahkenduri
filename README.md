# Cabutan Bertuah Kenduri

A private, Bahasa Melayu lucky-draw application for Malay wedding helpers. It uses Next.js App Router, TypeScript, Supabase Auth/PostgreSQL/RLS, Tailwind CSS, and atomic PostgreSQL draw functions.

## What is included

- Email/password host login with no public registration
- Fast participant registration, editing, status management, search, deletion, and CSV import
- Manual gifts, status management, search, and preview-first bulk number generation
- Projector-friendly, resumable two-stage participant and gift draw
- Server-secure random selection with row locks, constraints, and idempotent gift completion
- Searchable history with CSV export
- Readiness dashboard and typed-phrase transactional reset tools
- RLS migration, sample seed data, validation tests, and migration safety tests

## Architecture

Application routes:

| Route | Purpose |
| --- | --- |
| `/login` | Host authentication |
| `/` | Readiness and totals dashboard |
| `/participants` | Participant registration and eligibility |
| `/gifts` | Gift inventory and range generation |
| `/draw` | Fullscreen draw presentation |
| `/history` | Draw history and CSV export |
| `/settings` | Protected reset and clear operations |

The browser never decides a winner. `draw_random_participant()` selects and persists a participant in one database transaction using PostgreSQL cryptographic bytes and a locked eligible row. Confirmation atomically changes the participant to `won`. `draw_random_gift()` locks the draw and one available gift, claims the gift, associates it, and completes the result in one transaction. Unique/partial indexes protect against request retries and concurrency. The onscreen shuffle is only a reveal animation.

## Local setup

Prerequisites: Node.js 20.9 or newer, npm, and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the values from **Supabase Dashboard → Project Settings → API**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   The anon key is safe to use in the browser together with RLS. Do not add a service-role key; this application does not require one.

3. Apply [the migration](supabase/migrations/202607120001_initial_schema.sql). With a linked Supabase CLI project:

   ```bash
   npx supabase db push
   ```

   Alternatively, paste the migration into **Supabase Dashboard → SQL Editor** and run it once.

4. Optionally load [sample data](supabase/seed.sql) through the SQL Editor or `supabase db reset` in a local Supabase environment.

5. Create a host account as described below, then run:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Create host accounts manually

There is intentionally no registration page.

1. Open **Supabase Dashboard → Authentication → Users**.
2. Choose **Add user → Create new user**.
3. Enter the host email and a strong password.
4. Enable **Auto Confirm User**, then create the user.
5. Share the credentials securely with the selected host.

All anonymous table access is denied. Authenticated hosts share the event data; participants do not have accounts.

## CSV participant import

Save a UTF-8 CSV with this exact header:

```csv
towel_number,name
001,Puan Aminah
002,Pak Long Ahmad
003,Kak Siti
```

Towel numbers are normalised to at least three digits, so `2`, `02`, and `002` are all stored as `002`. Existing towel numbers, duplicate rows, and invalid records are reported and skipped. Participant names may repeat.

## Verification

Run all checks before deployment:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The unit tests cover number padding, validation and CSV escaping. Migration contract tests verify that secure randomness, row locks, authentication guards, and uniqueness protection remain present.

## Deploy to Vercel

1. Push this repository to a Git provider and import it in Vercel.
2. Keep the detected framework preset as **Next.js**.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Production, Preview, and Development environments.
4. Deploy. No custom build command or server is needed.
5. In Supabase **Authentication → URL Configuration**, add the Vercel production URL to **Site URL** and any required preview URLs to **Redirect URLs**.
6. Confirm that visiting a protected production route while logged out redirects to `/login`, then perform one test draw with disposable sample records.

## Operational notes

- Use the draw page's **Skrin Penuh** control before projecting.
- Draw buttons disable while requests are in progress.
- A refresh resumes a selected participant, confirmed winner, or completed result from the database.
- If gifts run out, no new participant draw can begin. Add or restore gifts from the gift page.
- Completed records are read-only to hosts. Corrections use the explicit reset tools in Settings and require typed confirmation phrases.
- Keep Supabase backups enabled for a production event and test the full flow on the venue network before the ceremony.
