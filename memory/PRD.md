# MyYard - Product Requirements Document

## Overview
MyYard is South Africa's #1 township rental platform connecting landlords and tenants across 870+ locations. Built with Next.js 15, Supabase, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) with Realtime subscriptions
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Ozow (placeholder, awaiting API key)

---

## Implemented Features

### Auth & Security (COMPLETE)
- [x] Email/password registration with role selection (tenant/landlord)
- [x] Email verification via Brevo SMTP (6-digit OTP code)
- [x] Login with email/password
- [x] Google Sign-In button (Supabase OAuth - needs dashboard config)
- [x] Route protection via AuthGuard (client-side redirect to /auth/login)
- [x] Auth callback handler for OAuth redirects
- [x] Protected routes: /landlord/*, /tenant/*

### Phase 1: Data & API Layer (COMPLETE)
- [x] 873 townships (static data source)
- [x] `/api/townships` with search + province filter
- [x] `/api/properties/by-township`
- [x] Home search autocomplete

### Phase 2: Messaging (COMPLETE)
- [x] Real-time messaging (Supabase Realtime)
- [x] Conversation threading by tenant+property
- [x] Viewing request accept/decline

### Phase 3: Lease Management (COMPLETE - Full Spec)
- [x] Unit-level pricing (rent, deposit, extras locked from property)
- [x] Auto-calculated lease creation
- [x] Move-in total = deposit + first month + extras
- [x] Monthly total = rent + extras
- [x] Tenant lease invitation (read-only, sign, pay)
- [x] Digital signature flow
- [x] PDF export with full terms
- [x] 20-day cancellation with R300 penalty
- [x] R375 admin fee

### Phase 4: Payment System (COMPLETE - Ozow Placeholder)
- [x] Server-side Ozow API with amount calculation
- [x] Payment webhook handler
- [x] Payment history API
- [x] Rent-due widget on tenant dashboard
- [x] Move-in payment dialog

### Phase 5: Frontend & Branding (COMPLETE)
- [x] MyYard branding throughout
- [x] 870+ locations stat
- [x] Leases nav in both sidebars

---

## Key Business Rules
- Tenant CANNOT edit any amounts
- Move-in = deposit (if required) + rent + extras
- Monthly = rent + extras  
- Cancel penalty: R300 (if <20 days notice + no deposit)
- Admin fee: R375 (landlord pays after lease signed)
- All amounts verified server-side before payment

## Remaining Tasks
- [ ] Provide Ozow API key to activate payments
- [ ] Configure Google OAuth in Supabase dashboard
- [ ] Create `notifications` table in Supabase
- [ ] Automated rent reminders
- [ ] Deposit return flow
- [ ] Property image upload
- [ ] Advanced search filters on home page
- [ ] Performance optimization

---

## Database Schema (Supabase)

### Existing Tables
profiles, properties, property_images, applications, viewing_requests, messages, leases, payments, favorites, reviews, townships

### Key Fields
- **leases.lease_terms**: JSON storing full LeaseConfig (extras, calculations, signatures, options)
- **payments.payment_type**: 'move_in' | 'monthly_rent' | 'admin_fee' | 'cancel_penalty' | 'deposit_return'
- **payments.transaction_reference**: Unique ref for Ozow tracking

### Missing Tables
- notifications (SQL script at `/app/scripts/create-notifications-table.sql`)

---

## Key Files
- `/app/lib/lease-utils.ts` - Shared calculation logic, types, constants
- `/app/app/landlord/leases/page.tsx` - Landlord lease creation (full flow)
- `/app/app/tenant/leases/page.tsx` - Tenant lease view/sign/pay
- `/app/app/api/payments/ozow/route.ts` - Ozow payment API
- `/app/app/api/payments/notify/route.ts` - Ozow webhook
- `/app/app/api/payments/history/route.ts` - Payment history
- `/app/playbook_for_ozow.md` - Ozow integration guide

## Testing Status
- Iteration 1: 11/11 passed (100%)
- Iteration 2: 16/16 passed (100%)  
- Iteration 3: 17/17 passed (100%)

## Key Files
- `/app/lib/lease-utils.ts` - Lease calculation logic
- `/app/app/api/auth/send-verification/route.ts` - Brevo SMTP
- `/app/app/api/payments/ozow/route.ts` - Ozow payment API
- `/app/components/auth-guard.tsx` - Route protection
- `/app/app/landlord/leases/page.tsx` - Landlord lease management
- `/app/app/tenant/leases/page.tsx` - Tenant lease view/sign/pay

## Environment
- App URL: https://myard-phase1.preview.emergentagent.com
- Supabase: https://ffkvytgvdqipscackxyg.supabase.co
- SMTP: Brevo (smtp-relay.brevo.com:587)
