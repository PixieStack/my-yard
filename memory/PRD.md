# MyYard - Product Requirements Document

## Overview
MyYard is South Africa's #1 township rental platform connecting landlords and tenants across 870+ locations. Built with Next.js 15, Supabase, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) with Realtime subscriptions
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Ozow (placeholder, awaiting API key)
- **Hosting**: Emergent preview environment

## User Personas
1. **Landlords** - Property owners listing rooms, bachelors, cottages, apartments
2. **Tenants** - People searching for affordable township housing

---

## What's Been Implemented

### Phase 1: Data & API Layer (COMPLETE)
- [x] 873 townships loaded (static data source)
- [x] `/api/townships` - Full text search with province filtering
- [x] `/api/properties/by-township` - Properties filtered by township
- [x] Township dropdown/autocomplete on home search

### Phase 2: Messaging (COMPLETE)
- [x] Real-time messaging (Supabase Realtime subscriptions on both tenant & landlord)
- [x] Conversation threading by tenant+property
- [x] Viewing request accept/decline flow
- [x] Unread message counts

### Phase 3: Lease Management (COMPLETE - Full Spec)
- [x] **Unit-level pricing**: Rent, deposit, extras set on property (locked)
- [x] **Auto-calculated lease creation**: Landlord selects property + tenant + duration
  - Auto-loads rent, deposit, extras from property
  - Auto-calculates move-in total & monthly total
  - Supports extra charges (water, parking, etc.)
  - Property options (furnished, own bathroom, kitchen, etc.)
  - Lease duration (1-24 months), rent due day, annual increase %
- [x] **Tenant lease invitation**: Read-only view with all breakdowns
  - Full move-in cost breakdown
  - Monthly cost breakdown
  - Cancellation policy (20-day notice, R300 penalty)
  - Accept terms checkbox + Sign
- [x] **Move-in payment screen**: After signing, shows deposit + first month + extras
- [x] **Digital signature flow**: Landlord signs → Tenant reviews & signs
- [x] **PDF export**: Full lease document with all terms, signatures, costs
- [x] **20-day cancellation**: With R300 penalty if no deposit
- [x] **Lease config stored as JSON** in `lease_terms` field

### Phase 4: Payment System (COMPLETE - Ozow Placeholder)
- [x] **Ozow payment API**: `/api/payments/ozow` with server-side amount calculation
  - Supports: move_in, monthly_rent, admin_fee, cancel_penalty
  - Server-side verification of user roles (tenant pays rent, landlord pays admin fee)
  - Auto-generates transaction references
  - Ozow hash generation ready
- [x] **Payment webhook**: `/api/payments/notify` - Processes Ozow callbacks
  - Hash verification
  - Updates payment records
  - Activates lease on move-in payment completion
- [x] **Payment history**: `/api/payments/history` - Filtered by user/role/type
- [x] **Rent-due widget**: Tenant payments page shows active lease with monthly breakdown
- [x] **Manual payment submission**: Bank transfer, EFT, cash, mobile money
- [x] Admin fee: R375 (landlord pays to platform after lease signed)
- [x] Cancellation penalty: R300 (tenant pays if <20 days notice + no deposit)

### Phase 5: Frontend & Branding (COMPLETE)
- [x] Home page with MyYard branding
- [x] Search autocomplete with township suggestions
- [x] "870+ locations" stat
- [x] Consistent orange/amber theme
- [x] Leases navigation in both sidebars
- [x] Notification bell with graceful fallback

### Phase 6: Notifications (PARTIAL)
- [x] Notification bell component with Realtime subscriptions
- [x] Graceful fallback when notifications table doesn't exist
- [x] `/api/notifications` endpoint
- [ ] Full notification system (needs `notifications` table in Supabase)

---

## Key Business Rules (from spec)

### Pricing Rules
| Amount | Set By | Stored In | Editable by Tenant? |
|--------|--------|-----------|-------------------|
| Monthly Rent | Landlord | Property/Lease | NEVER |
| Deposit | Landlord | Property/Lease | NEVER |
| Extra Charges | Landlord | Lease config (JSON) | NEVER |
| Move-in Total | AUTO-CALC | Lease config | NEVER |
| Monthly Total | AUTO-CALC | Lease config | NEVER |
| Cancel Penalty | SYSTEM | Fixed R300 | NEVER |
| Admin Fee | SYSTEM | Fixed R375 | NEVER |

### Formulas
- `moveInTotal = deposit (if required) + monthlyRent + SUM(extras)`
- `monthlyTotal = monthlyRent + SUM(extras)`

---

## Remaining Tasks (Backlog)

### P0 - Critical
- [ ] Provide Ozow API key to activate payment integration
- [ ] Create `notifications` table in Supabase SQL editor

### P1 - Important
- [ ] Automated rent payment reminders
- [ ] Deposit return flow (landlord initiates, deductions)
- [ ] User account management - payment details section

### P2 - Nice to Have
- [ ] End-to-end testing with authenticated flows
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
- Iteration 2: 16/16 backend + all frontend passed (100%)
- All test reports at `/app/test_reports/`
