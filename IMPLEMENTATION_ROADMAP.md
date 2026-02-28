# MyYard Application - Implementation Roadmap

## ✅ Completed
1. Fixed console errors in browse/page.tsx (missing keys, undefined price)
2. Fixed error logging in viewing-requests page
3. Created real-time subscription hooks (`use-realtime-subscription.ts`)
4. Created extended notifications library (`notifications-extended.ts`)
5. Notification bell component already exists with real-time support

## 🚀 Critical Path Tasks (In Priority Order)

### Phase 1: Core Workflow - Viewing → Application → Lease
**Status: PARTIAL** - Viewing exists, need to implement Application unlock and Lease auto-generation

#### Task 1.1: Unlock Application After Viewing Completed
- **What**: When landlord marks viewing as 'completed', tenant should be able to submit application
- **Where**: Need to add state check in `app/tenant/properties/[id]/application/page.tsx`
- **Implementation**:
  - Check if `viewing_requests` status = 'completed' for property
  - Show "Submit Application" button only if viewing_completed = true
  - Else show "Request viewing first" message

#### Task 1.2: Auto-Generate Lease on Application Approval
- **What**: When landlord approves application, automatically create lease
- **Database**: Already has trigger at `/scripts/minimal-database-fixes.sql`
- **Implementation**:
  - Verify trigger `create_lease_on_approval()` is in production database
  - Test: Approve application → Check if lease created automatically
  - If not created, manually trigger via API

#### Task 1.3: Two-Part Lease Signing (Landlord → Tenant)
- **What**: Implement ordered signing process
  - Landlord signs first → Lease status changes
  - Tenant notified → Can sign
  - Both signed → Lease becomes 'active', messaging unlocked
- **Implementation**:
  - Create `/app/tenant/leases/page.tsx` with signing UI
  - Create `/app/landlord/leases/page.tsx` with landlord signing
  - Add `signed_by_landlord` and `signed_by_tenant` boolean columns to leases table
  - Add real-time listeners to update UI when other party signs

### Phase 2: Real-Time Updates (Landlord Actions → Tenant UI)
**Status: Infrastructure Created** - Need to integrate into pages

- Use `useRealtimeSubscription` hook in:
  - `app/tenant/applications/page.tsx` - watch for status changes
  - `app/tenant/leases/page.tsx` - watch for signature updates
  - `app/tenant/messages/page.tsx` - watch for new messages

### Phase 3: Messaging System (Only After Lease Signed)
**Status: PLANNED**

- Create `/app/tenant/messages/page.tsx`
- Create `/app/landlord/messages/page.tsx`
- Add check: `only allow messaging if lease.signed_by_landlord && lease.signed_by_tenant`
- Implement with Supabase real-time for live chat

### Phase 4: Notifications for All Events
**Status: Libraries Created** - Need to call from action points

**Call `notifyXXX()` functions from:**
1. When viewing confirmed: `notifyViewingConfirmed()` in landlord viewing-requests page
2. When viewing completed: `notifyViewingCompleted()` in viewing page
3. When application approved: `notifyApplicationApproved()` in landlord applications page
4. When application rejected: `notifyApplicationRejected()` 
5. When lease ready: `notifyLeaseReady()` after lease created
6. When landlord signs: Update notification for tenant
7. When tenant signs: Update notification for landlord + trigger admin fee

### Phase 5: Admin Fee Payment (R375 after Lease Signed)
**Status: PLANNED**

- When `lease.signed_by_tenant = true` AND `lease.signed_by_landlord = true`:
  - Create record in `payments` table with `payment_type = 'admin_fee'`, `amount = 375`
  - Call `notifyAdminFeeRequired()` to landlord
  - Show notification in landlord dashboard
  - Implement payment UI (could use Ozow integration that exists)

### Phase 6: Public Property Browsing (No Login Required)
**Status: PARTIAL** - Browse works, search may need work

**What needs to be done:**
- Verify `/app/browse/page.tsx` works without auth
- Verify `/app/page.tsx` (home page) shows properties without auth
- When user clicks "Apply" without login: redirect to `/auth/signin?callbackUrl=/apply`
- Add filters (price, rooms, property type) to home page
- Implement pagination (12 per page)

### Phase 7: Settings Page
**Status: PLANNED**

- Create `/app/settings/page.tsx`
- Show current profile data
- Allow edit: first_name, last_name, phone, email, address
- For landlords: Add bank details fields
- Implement form with validation
- POST to `/api/auth/profile` to update Supabase profiles table

### Phase 8: Favorites System
**Status: PARTIAL** - Component created, need to verify end-to-end

- Verify `favorite-button.tsx` works correctly
- Check if favorites save to database
- Verify favorites display on profile/favorites page
- Ensure favorites persist across sessions

### Phase 9: Comprehensive Testing
- E2E test: Request viewing → Confirm viewing → Submit application → Approve → Sign lease
- Test real-time updates on both sides
- Test all notifications trigger correctly
- Test messaging only works after lease signed
- Test admin fee notification appears after double signature

## Database Schema Notes

### Key Tables:
- `viewing_requests` - status: 'requested' | 'confirmed' | 'completed' | 'cancelled'
- `applications` - status: 'pending' | 'viewing_requested' | 'approved' | 'rejected'
- `leases` - fields: `signed_by_landlord`, `signed_by_tenant`, `is_active`
- `notifications` - user_id, type, is_read
- `messages` - lease_id (only allowed if lease fully signed)
- `payments` - payment_type: 'admin_fee', amount: 375

### Key Triggers/Functions:
- `create_lease_on_approval()` - creates lease when application.status = 'approved'
- RLS policies ensure users only see their own data

## Environment Setup
- Supabase project connected
- Auth via Supabase Auth
- Real-time subscriptions enabled
- Ozow payment gateway configured (for admin fee)

## Next Steps
1. Verify database triggers are active (run script if needed)
2. Add real-time listeners to tenant/landlord pages (use hooks created)
3. Implement lease signing flow
4. Add notification calls at each workflow step
5. Create messaging page with lease check
6. Implement admin fee payment
7. Create settings page
8. Run comprehensive E2E tests
