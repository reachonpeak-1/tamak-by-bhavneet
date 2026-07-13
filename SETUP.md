# तमक (Tamak) — Setup & Deploy

Next.js 16 (App Router, TS) · Supabase (Postgres + Auth + Storage) · Razorpay · deploy to Vercel.

## 1. Local dev

```bash
npm install
npm run dev        # http://localhost:3000
```

Without keys: the full storefront works (bundled products, cart, wishlist, checkout UI).
Login / payments / admin activate once you add the keys below.

## 2. Supabase

1. https://supabase.com/dashboard → **New project** (note the database password).
2. Project Settings → **API Keys** → copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the publishable key (`sb_publishable_…`)
   - `SUPABASE_SECRET_KEY` — the secret key (`sb_secret_…`, server only)
3. Apply the schema: paste `supabase/migrations/0001_init.sql` into the
   **SQL Editor** and run it (or `npx supabase db push --db-url <connection-string>`).
4. **Storage** → create a bucket named `media`, set it **Public**.
5. Auth: Email/Password is on by default. Enable the **Google** provider in
   Authentication → Providers if you want Google sign-in for customers.

All tables have RLS enabled with **no policies** — the anon key can read/write
nothing. Every read/write goes through the server-side service-role client
(`src/lib/supabase/admin.ts`), mirroring the API-route guard architecture.

## 3. Make yourself an admin

```bash
# creates the user if needed, and flags profiles.is_admin:
node scripts/set-admin.mjs you@email.com yourpassword
# then sign in at /admin/login
```

## 4. Razorpay

1. https://dashboard.razorpay.com → Settings → **API Keys** → generate **Test** keys.
2. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (rzp_test_…) and `RAZORPAY_KEY_SECRET`.
3. Test checkout with Razorpay's test cards. Go live later after KYC (swap to live keys).

## 5. Deploy to Vercel

1. Push to GitHub.
2. https://vercel.com → New Project → import the repo.
3. Add **all** env vars from `.env.local` in Vercel → Project → Settings → Environment Variables.
4. Deploy. Add your custom domain when ready.

> Note: Vercel Hobby is for non-commercial use; upgrade to Pro for a live store.

## Migration from Firebase (historical)

The project originally ran on Firebase (Firestore + Auth + Storage) and was
migrated to Supabase. One-time migration scripts live in `scripts/migrate/`:

- `firestore-to-supabase.mjs` — copies all Firestore collections into Postgres
  (rewrites storage URLs, converts Timestamps to ISO strings).
- `storage-to-supabase.mjs` — copies Firebase Storage objects to the `media` bucket.
- `storage-local-to-supabase.mjs` — same, but from a local folder mirror
  (used because Firebase billing was delinquent and blocked downloads).

Firebase customer accounts could not be migrated (password hashes are not
exportable) — customers re-register with the same email; `/api/me/orders`
matches historical orders by email as a fallback.

## Project map

```
src/app              routes: / shop product/[slug] cart checkout wishlist account admin
src/app/api          razorpay/order · razorpay/verify · me/orders · newsletter · admin/*
src/components       UI (Header, Hero, ProductCard, …) + Store/Auth providers
src/lib              data/* (catalog, orders, …), pricing (server), supabase/{admin,client,server,guards}
src/data             products.json (generated catalog — committed, DB fallback)
supabase/migrations  0001_init.sql — full Postgres schema
scripts              set-admin · seed-categories · migrate/*
```

## Security notes
- Prices are **always recomputed server-side** (`src/lib/pricing.ts`) — client prices are never trusted.
- Razorpay payments are **signature-verified** server-side before an order is saved.
- Orders are written only via the service-role client; RLS blocks all client access.
- Admin API routes require a Supabase access token whose user has `profiles.is_admin`;
  admin pages verify the cookie session the same way.
- Secrets live in server-only env vars; security headers set in `next.config.ts`.
