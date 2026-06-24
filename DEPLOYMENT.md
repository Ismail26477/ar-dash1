# AR Computers — Production Deployment Checklist

Single Supabase backend powering both the **Customer Store** and the **Admin Portal**.
No mock data remains. Frontend deploys to Render (static site); backend is Supabase.

---

## 1. Supabase — Database

Apply migrations in order (Dashboard → SQL Editor, or `supabase db push`):

1. `20260110052841_*.sql` — schema, enums, RLS, seed data, storage buckets
2. `20260617000000_critical_functions_rls.sql` — `has_role`/`is_admin`/`is_staff`,
   `decrement_stock`/`increment_stock`, atomic `place_order`, notification triggers
3. `20260617120000_storage_policies_hardening.sql` — owner-scoped avatars,
   staff-only product images, admin-only category images

Verify:
- [ ] Tables created; seed categories + products present
- [ ] `place_order`, `decrement_stock`, `is_admin`, `is_staff` exist under Database → Functions
- [ ] Triggers `on_order_placed`, `on_order_updated`, `on_order_status_change` active
- [ ] RLS enabled on every public table
- [ ] Buckets `product-images`, `avatars`, `category-images` exist and are **public**

## 2. Supabase — Auth

- [ ] Email/password provider enabled
- [ ] Site URL + redirect URLs include the Render domain
- [ ] Promote at least one admin: `UPDATE profiles SET role='admin' WHERE email='you@domain.com';`
- [ ] (New signups default to `customer` via `handle_new_user` trigger)

## 3. Supabase — Edge Functions

Deploy: `create-order`, `verify-payment`, `razorpay-webhook`, `send-email`.

Function secrets (Dashboard → Edge Functions → Secrets):
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY` (optional — `send-email` is a safe no-op without it)
- [ ] `EMAIL_FROM` (optional, e.g. `AR Computers <orders@yourdomain.com>`)

`config.toml` JWT settings (already set):
- `create-order`, `verify-payment` → `verify_jwt = true`
- `razorpay-webhook`, `send-email` → `verify_jwt = false`

- [ ] Razorpay dashboard webhook → `https://<project>.supabase.co/functions/v1/razorpay-webhook`

## 4. Frontend — Render (Static Site)

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- [ ] SPA rewrite rule: `/*` → `/index.html` (200) — required for client-side routing

Environment variables:
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_SUPABASE_PROJECT_ID`

## 5. Pre-flight verification (build)

- [x] `npm run build` succeeds
- [x] `npx tsc -p tsconfig.app.json --noEmit` passes (0 errors)
- [x] No `mongodb` / `useMongoDB` references remain in `src/`
- [x] `mongodb` dependency removed from `package.json`

## 6. Smoke test (after deploy)

Customer:
- [ ] Sign up → profile auto-created as `customer`
- [ ] Browse `/store`, open product, add to cart
- [ ] Checkout COD → order placed, stock decremented, cart cleared, in-app + email notice
- [ ] Checkout Razorpay → pay → `verify-payment` marks paid, `payment_success` fires
- [ ] `/my-orders` lists orders; `/order/:n` detail; `/track/:n` timeline + history
- [ ] Avatar upload writes to `avatars/<uid>/…` and renders via public URL

Admin (role = admin):
- [ ] `/` dashboard KPIs, charts, recent orders, top products, inventory alerts — all live
- [ ] `/admin/orders` update status → history row + customer notification + shipped/delivered email
- [ ] `/admin/products` create / edit / delete (image upload to product-images)
- [ ] `/admin/customers`, `/admin/payments`, `/admin/fulfillment`, `/admin/analytics` — live data
- [ ] `/admin/reviews` approve pending; `/admin/discounts` reflect DB; `/admin/support` real tickets
- [ ] `/admin/notifications` unread counts + mark read / mark all read

## Known notes / non-blockers

- Bundle > 500 kB (single chunk). Functional; optional code-splitting later.
- `Marketing` campaigns and `Help` FAQs are static content (no DB table by design).
- Fulfillment carrier stat cards (Delhivery/BlueDart/DTDC) are illustrative; live
  shipment/pending data is real.
- `send-email` no-ops cleanly until `RESEND_API_KEY` is set — order flows never break.
