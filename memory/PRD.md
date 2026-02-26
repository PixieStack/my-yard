# MyYard - Product Requirements Document

## Overview
MyYard is South Africa's township rental platform connecting landlords and tenants across 870+ locations. Built with Next.js 15, Supabase, and Tailwind CSS.

## Core Requirements
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Payments**: Ozow (placeholder, awaiting API key)

## User Personas
1. **Landlords** - Property owners listing rooms, bachelors, cottages in townships
2. **Tenants** - People searching for affordable township housing

## What's Been Implemented

### Phase 1: Data & API Layer (COMPLETE)
- [x] 873 townships imported (static data source, 136 in Supabase DB)
- [x] `/api/townships` - Full text search with province filtering
- [x] `/api/properties/by-township` - Properties filtered by township
- [x] Township dropdown/autocomplete on home search

### Phase 2: Messaging (COMPLETE)
- [x] Real-time messaging between tenants and landlords (Supabase Realtime)
- [x] Conversation threading by tenant+property
- [x] Viewing request accept/decline flow with reasons
- [x] Unread message counts
- [x] Real-time subscription for new message notifications

### Phase 3: Lease Management (COMPLETE)
- [x] Lease creation by landlords (property, tenant, dates, rent, deposit)
- [x] Digital signature flow (landlord + tenant sign independently)
- [x] PDF export/print of lease agreements
- [x] 20-day cancellation notice system
- [x] Lease status tracking (pending, active, cancelled)
- [x] Both landlord and tenant lease pages

### Phase 4: Frontend & Branding (COMPLETE)
- [x] Home page with MyYard branding (logo, gradient theme)
- [x] Search autocomplete with township suggestions
- [x] "870+ locations" stat across South Africa
- [x] Consistent orange/amber theme
- [x] Responsive navigation for landlord and tenant dashboards
- [x] Leases navigation item added to both sidebars

### Phase 5: Payments (PARTIAL)
- [x] Manual payment submission (bank transfer, EFT, cash, mobile money)
- [x] Payment history and stats for both landlord and tenant
- [x] Ozow "Pay Online" button (placeholder - awaiting API key)
- [x] `/api/payments/ozow` endpoint ready for integration
- [ ] Ozow actual integration (needs API key from user)
- [ ] Automated rent reminders

### Phase 6: Notifications (PARTIAL)
- [x] Notification bell component with real-time subscriptions
- [x] Graceful fallback when notifications table doesn't exist
- [x] `/api/notifications` endpoint
- [ ] Full notification system (needs `notifications` table created in Supabase)
- [ ] Expanded notifications (viewing requests, rent reminders)

## Remaining Tasks (Backlog)

### P0 - Critical
- [ ] Create `notifications` table in Supabase (SQL script exists at `/app/scripts/create-notifications-table.sql`)
- [ ] Import remaining townships to Supabase DB (need service_role key)

### P1 - Important
- [ ] Ozow payment integration (awaiting API key)
- [ ] Rent payment reminders (automated notifications)
- [ ] User account management - payment details section

### P2 - Nice to Have
- [ ] End-to-end testing with authenticated flows
- [ ] Performance optimization
- [ ] Property image upload
- [ ] Advanced search filters on home page

## Database Schema
### Existing Tables
- profiles, properties, applications, viewing_requests, messages, leases, payments, favorites, townships

### Missing Tables (need to be created)
- notifications (SQL script at `/app/scripts/create-notifications-table.sql`)
- lease_termination_requests

## Key Files
- `/app/app/page.tsx` - Home page
- `/app/components/home-search-form.tsx` - Search with autocomplete
- `/app/lib/data/townships.ts` - 873 static townships
- `/app/app/landlord/leases/page.tsx` - Landlord lease management
- `/app/app/tenant/leases/page.tsx` - Tenant lease view
- `/app/playbook_for_ozow.md` - Ozow integration guide
- `/app/.env.local` - Environment config (Supabase + Ozow placeholders)

## Environment
- App URL: https://myard-phase1.preview.emergentagent.com
- Supabase: https://ffkvytgvdqipscackxyg.supabase.co
