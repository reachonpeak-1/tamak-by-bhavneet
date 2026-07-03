# तमक (Tamak) — Setup & Deploy

Next.js 16 (App Router, TS) · Firebase (Firestore + Auth + Storage) · Razorpay · deploy to Vercel.
Everything runs on **free tiers**.

## 1. Local dev (works now, no keys needed)

```bash
npm install
npm run dev        # http://localhost:3000
```

Without keys: the full storefront works (all 85 products, cart, wishlist, checkout UI).
Product images show the woven-motif placeholder until you upload them (step 3).
Login / payments / admin activate once you add the keys below.

Copy env template and fill in as you go:

```bash
cp .env.example .env.local
```

## 2. Firebase

1. https://console.firebase.google.com → **Add project** (Spark/free plan).
2. **Build → Firestore Database** → create (production mode).
3. **Build → Storage** → get started.
4. **Build → Authentication** → enable **Email/Password** and **Google**.
5. Project settings → **General** → "Your apps" → Web app → copy config into the
   `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`.
6. Project settings → **Service accounts** → *Generate new private key* (JSON).
   Put its values into `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
   `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n`s). Set `FIREBASE_STORAGE_BUCKET`
   (e.g. `your-project.appspot.com`).
7. Publish security rules:
   ```bash
   # via Firebase console (paste files) or Firebase CLI:
   firebase deploy --only firestore:rules,storage
   ```
   Rules are in `firestore.rules` and `storage.rules`.

## 3. Images → Firebase Storage (fast loading)

```bash
node scripts/optimize-images.mjs   # already run: 2.5GB → 37MB masters + blur
node scripts/upload-firebase.mjs   # uploads masters, writes _source/optimized/image-urls.json
```

`next/image` then serves AVIF/WebP at exact display size from Vercel's edge cache.

## 4. Seed the catalog into Firestore

```bash
node scripts/build-catalog.mjs     # already run → src/data/products.json (85 products)
node scripts/seed-firestore.mjs    # pushes products (with image URLs) to Firestore
```

## 5. Razorpay

1. https://dashboard.razorpay.com → Settings → **API Keys** → generate **Test** keys.
2. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (rzp_test_…) and `RAZORPAY_KEY_SECRET`.
3. Test checkout with Razorpay's test cards. Go live later after KYC (swap to live keys).

## 6. Make yourself an admin

```bash
# after signing up once at /account:
node scripts/set-admin.mjs you@email.com
# sign out & back in, then visit /admin
```

## 7. Deploy to Vercel

1. Push to GitHub.
2. https://vercel.com → New Project → import the repo.
3. Add **all** env vars from `.env.local` in Vercel → Project → Settings → Environment Variables.
4. Deploy. Add your custom domain when ready.

> Note: Vercel Hobby is for non-commercial use; upgrade to Pro for a live store.

## Project map

```
src/app            routes: / shop product/[slug] cart checkout wishlist account admin
src/app/api        razorpay/order · razorpay/verify · order/cod · me/orders · admin/*
src/components      UI (Header, Hero, ProductCard, …) + Store/Auth providers
src/lib            products (catalog), pricing (server), firebase/{client,admin}
src/data           products.json (generated catalog — committed)
scripts            optimize-images · upload-firebase · build-catalog · seed-firestore · set-admin
firestore.rules    storage.rules     security rules
_source            raw photos + descriptions (gitignored, not deployed)
```

## Security notes
- Prices are **always recomputed server-side** (`src/lib/pricing.ts`) — client prices are never trusted.
- Razorpay payments are **signature-verified** server-side before an order is saved.
- Orders are written only via the Admin SDK; Firestore rules block client writes.
- Admin routes require a verified Firebase ID token with the `admin` claim.
- Secrets live in server-only env vars; security headers set in `next.config.ts`.
