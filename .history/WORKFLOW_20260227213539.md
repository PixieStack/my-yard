# MyYard - Complete Viewing to Lease Workflow

## Overview
Your MyYard application has a fully functional workflow from viewing request through lease signing. This document details each step and the technical implementation.

---

## STEP 1 — Tenant Requests Viewing

### User Flow
1. Tenant browses properties at `/tenant/properties`
2. Tenant clicks on a property to view details
3. Tenant navigates to **"Request a Viewing"** button
4. Tenant selects preferred date, time, and adds optional message
5. Tenant submits viewing request

### Technical Details
- **Page:** `/app/tenant/properties/[id]/viewing/page.tsx`
- **Table:** `viewing_requests`
- **Status:** `pending`
- **Key Fields:**
  - `requested_date` - tenant's preferred date
  - `requested_time` - tenant's preferred time
  - `tenant_message` - optional note from tenant
  - `property_id`, `tenant_id`

### Key Code
```tsx
// Insert viewing request
const { error } = await supabase
  .from("viewing_requests")
  .insert({
    property_id: property.id,
    tenant_id: profile.id,
    requested_date: requestedDate,
    requested_time: requestedTime,
    tenant_message: message,
    status: "pending",
  })
```

---

## STEP 2 — Landlord Confirms Viewing

### User Flow
1. Landlord logs in to dashboard
2. Landlord navigates to **"Viewing Requests"** in sidebar (NEW)
3. Landlord sees all viewing requests for their properties
4. Landlord clicks **"Confirm"** on a pending request
5. Landlord selects confirmed date/time
6. Landlord optionally adds a message for tenant
7. System updates status to `confirmed`

### Technical Details
- **Page:** `/app/landlord/viewing-requests/page.tsx` (NEW - Created for you)
- **Table:** `viewing_requests`
- **Status:** `confirmed`
- **Key Fields Updated:**
  - `status` → "confirmed"
  - `confirmed_date` - landlord's confirmed date
  - `confirmed_time` - landlord's confirmed time
  - `landlord_message` - optional response to tenant

### Navigation
Added to `/app/landlord/layout.tsx`:
```tsx
{ name: "Viewing Requests", href: "/landlord/viewing-requests", icon: Eye }
```

### Key Code
```tsx
const { error } = await supabase
  .from("viewing_requests")
  .update({
    status: "confirmed",
    confirmed_date: confirmedDate,
    confirmed_time: confirmedTime,
    landlord_message: landlordMessage,
  })
  .eq("id", viewingId)
```

---

## STEP 3 — Viewing Takes Place

### User Flow
1. Tenant and landlord meet for viewing on confirmed date/time
2. Landlord returns to **"Viewing Requests"** page
3. Landlord clicks **"Mark Completed"** after viewing
4. Status changes to `completed`
5. **Application form now UNLOCKS for tenant**

### Technical Details
- **Page:** `/app/landlord/viewing-requests/page.tsx`
- **Table:** `viewing_requests`
- **Status:** `completed`

### Key Code
```tsx
const { error } = await supabase
  .from("viewing_requests")
  .update({
    status: "completed",
  })
  .eq("id", viewingId)
```

---

## STEP 4 — Tenant Submits Application

### User Flow
1. After viewing is marked `completed`, tenant gets notification
2. Tenant navigates to property or `/tenant/applications`
3. Tenant clicks **"Apply Now"** (button now enabled)
4. Tenant fills in application form:
   - Preferred move-in date
   - Lease duration (6, 12, 24 months)
   - Number of additional occupants
   - Occupant details
   - Cover letter / special requests
5. Tenant submits application
6. **Status:** `pending` application created

### Technical Details
- **Page:** `/app/tenant/properties/[id]/apply/page.tsx`
- **Table:** `applications`
- **Status:** `pending`
- **Unlock Logic:** Form only enabled if viewing status is one of:
  - `confirmed`
  - `completed`
  - `application_submitted`

### Unlock Logic
```tsx
function canApply(status: ViewingStatus): boolean {
  return (
    status === "confirmed" ||
    status === "completed" ||
    status === "application_submitted"
  )
}
```

### Key Code
```tsx
const { error } = await supabase
  .from("applications")
  .insert({
    property_id: property.id,
    tenant_id: profile.id,
    status: "pending",
    applied_at: new Date().toISOString(),
    proposed_move_in_date: moveInDate,
    lease_duration_requested: leaseDuration,
    additional_occupants: occupants,
    additional_occupants_details: occupantDetails,
    tenant_notes: coverLetter,
    special_requests: specialRequests,
  })
```

---

## STEP 5 — Landlord Reviews & Approves/Declines

### User Flow
1. Landlord navigates to **"Applications"** dashboard
2. Landlord sees all applications for their properties
3. Landlord clicks on an application to view details
4. Landlord reviews tenant information and application details
5. Landlord either:
   - **Clicks "Approve"** → Goes to Step 6
   - **Clicks "Decline"** → Sends rejection notification, flow ends

### Technical Details
- **Page:** `/app/landlord/applications/page.tsx` (Existing - Enhanced)
- **Table:** `applications`
- **Status:** Tenant is notified via notification system

### Key Code
```tsx
const { error: appError } = await supabase
  .from("applications")
  .update({ status: "approved" })
  .eq("id", applicationId)
```

---

## STEP 6 — Lease Auto-Generated

### User Flow
1. When landlord clicks **"Approve Application"**, system automatically:
   - Creates a lease record with calculated dates/amounts
   - Generates move-in total, monthly total, admin fee
   - Creates lease terms document
   - Sends notification to both tenant and landlord

### Technical Details
- **Page:** `/app/landlord/applications/page.tsx` (auto-triggered)
- **Table:** `leases`
- **Status:** `is_active: true`, `signed_by_landlord: false`, `signed_by_tenant: false`
- **Key Fields Calculated:**
  - `start_date` - from application's `proposed_move_in_date`
  - `end_date` - calculated based on lease duration
  - `monthly_rent` - from property
  - `deposit_amount` - from property (if required)
  - `config` - JSON with lease configuration

### Key Code
```tsx
const leaseEndDate = new Date(application.proposed_move_in_date)
leaseEndDate.setMonth(leaseEndDate.getMonth() + application.lease_duration_requested)

const { error: leaseError } = await supabase
  .from("leases")
  .insert({
    tenant_id: application.tenant_id,
    property_id: application.property_id,
    landlord_id: profile.id,
    start_date: application.proposed_move_in_date,
    end_date: leaseEndDate.toISOString().split("T")[0],
    monthly_rent: application.property.rent_amount,
    deposit_amount: application.property.rent_amount,
    is_active: true,
    signed_by_landlord: false,
    signed_by_tenant: false,
  })
```

---

## STEP 7 — Landlord Signs Lease

### User Flow
1. Landlord receives notification: "New lease ready for signature"
2. Landlord navigates to **"Leases"** dashboard
3. Landlord clicks on unsigned lease
4. Landlord reviews lease details (move-in total, monthly rent, extras, admin fee)
5. Landlord clicks **"Sign Lease"**
6. System records signature and timestamp
7. **Status:** `signed_by_landlord: true`

### Technical Details
- **Page:** `/app/landlord/leases/page.tsx`
- **Table:** `leases`
- **Fields Updated:**
  - `signed_by_landlord` → `true`
  - (Signature capture can be enhanced with actual signature widgets)

---

## STEP 8 — Tenant Signs Lease

### User Flow
1. Tenant receives notification: "Your lease is ready for signature"
2. Tenant navigates to **"Leases"** page
3. Tenant reviews full lease details:
   - Move-in date
   - Monthly rent
   - Deposit (if required)
   - Extras/add-ons
   - Admin fee (R375)
   - Lease duration
   - Special terms
4. Tenant can download lease as **PDF**
5. Tenant clicks **"Sign Lease"** (reads terms checkbox required)
6. System records signature and timestamp
7. **Status:** `signed_by_tenant: true`, lease is now fully active

### Technical Details
- **Page:** `/app/tenant/leases/page.tsx`
- **Table:** `leases`
- **Fields Updated:**
  - `signed_by_tenant` → `true`
  - `signed_at` → timestamp
- **PDF Generation:** Available via download button

### Key Code
```tsx
const { error } = await supabase
  .from("leases")
  .update({
    signed_by_tenant: true,
    signed_at: new Date().toISOString(),
  })
  .eq("id", leaseId)
```

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Tenant Requests Viewing                                     │
│ Status: viewing_requests.status = "pending"                         │
│ Page: /tenant/properties/[id]/viewing                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Landlord Confirms Viewing                                   │
│ Status: viewing_requests.status = "confirmed"                       │
│ Page: /landlord/viewing-requests (NEW)                              │
│ Landlord selects confirmed date/time                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Viewing Takes Place                                         │
│ Status: viewing_requests.status = "completed"                       │
│ Page: /landlord/viewing-requests                                    │
│ Landlord clicks "Mark Completed"                                    │
│ ⬅️  APPLICATION FORM NOW UNLOCKS ➜                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Tenant Submits Application                                  │
│ Status: applications.status = "pending"                             │
│ Page: /tenant/properties/[id]/apply                                 │
│ Tenant fills form (move-in date, duration, cover letter)           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Landlord Reviews Application                                │
│ Status: applications.status = "pending" (under review)              │
│ Page: /landlord/applications                                        │
│ Landlord clicks APPROVE or DECLINE                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
            ┌───────▼────────┐    │
            │ APPROVED ✓     │    │
            └───────┬────────┘    │
                    │             │
                    ▼             ▼
        ┌─────────────────────┐  ┌──────────────┐
        │ STEP 6: Lease Auto- │  │ REJECTED ✗   │
        │ Generated           │  │ Flow ends    │
        │ leases created      │  │ Notification │
        │ signed_by_landlord  │  │ to tenant    │
        │ = false             │  └──────────────┘
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ STEP 7: Landlord Signs      │
        │ Page: /landlord/leases      │
        │ signed_by_landlord = true   │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ STEP 8: Tenant Signs        │
        │ Page: /tenant/leases        │
        │ signed_by_tenant = true     │
        │ LEASE FULLY ACTIVE ✓        │
        └─────────────────────────────┘
```

---

## Database Tables Involved

### `viewing_requests`
- `id`, `property_id`, `tenant_id`
- `status` (pending, confirmed, completed, declined)
- `requested_date`, `requested_time`
- `confirmed_date`, `confirmed_time` (set by landlord)
- `tenant_message`, `landlord_message`
- `created_at`, `updated_at`

### `applications`
- `id`, `property_id`, `tenant_id`
- `status` (pending, approved, rejected)
- `applied_at`
- `proposed_move_in_date`, `lease_duration_requested`
- `additional_occupants`, `additional_occupants_details`
- `tenant_notes`, `special_requests`
- `rejection_reason`

### `leases`
- `id`, `property_id`, `tenant_id`, `landlord_id`
- `start_date`, `end_date`
- `monthly_rent`, `deposit_amount`
- `is_active`, `is_signed`
- `signed_by_landlord`, `signed_by_tenant`
- `signed_at`, `lease_terms`
- `config` (JSON - extras, admin fees, etc.)

---

## Key Features Implemented

✅ **Viewing Request Management**
- Tenants request viewings with preferred date/time
- Landlords confirm/decline with their available times
- Landlords mark viewings as completed to unlock applications

✅ **Application Form Gating**
- Form only unlocks after viewing is confirmed or completed
- Clear messaging if form is locked and why

✅ **Auto-Lease Generation**
- Lease automatically created when application approved
- Proper date calculation based on lease duration
- Includes move-in amounts, monthly rent, admin fees

✅ **Lease Signing Flow**
- Landlord signs first
- Tenant receives notification and can sign
- PDF download available for tenant
- Terms must be accepted by tenant before signing

✅ **Notifications**
- Tenants notified at each step (viewing confirmed, application approved, lease ready to sign)
- Landlords notified when applications submitted

✅ **RLS (Row Level Security)**
- Tenants only see their own viewings, applications, and leases
- Landlords only see for their own properties

---

## Testing the Complete Workflow

### Test Scenario
1. Create 2 user accounts: Tenant (test@tenant.com), Landlord (test@landlord.com)
2. Landlord creates a property listing
3. Tenant searches and finds property
4. Tenant requests viewing for specific date
5. Landlord confirms viewing for available time
6. Landlord marks viewing as completed
7. Tenant application form unlocks
8. Tenant submits application with details
9. Landlord approves application
10. Lease auto-generates
11. Landlord signs lease
12. Tenant receives notification and signs lease
13. Verify lease shows as fully signed and active

### Success Indicators
- ✓ All statuses update correctly in database
- ✓ Notifications sent and received
- ✓ Tenant can download lease as PDF
- ✓ Property shows as occupied after lease signed
- ✓ Both users can view signed lease with full terms

---

## What's New / Enhanced

### New Files
- `/app/landlord/viewing-requests/page.tsx` - Full viewing request management interface

### Enhanced Files
- `/app/landlord/layout.tsx` - Added "Viewing Requests" navigation link

### Existing (Already Complete)
- `/app/tenant/properties/[id]/viewing/page.tsx` - Request viewing
- `/app/tenant/properties/[id]/apply/page.tsx` - Submit application (gated by viewing status)
- `/app/landlord/applications/page.tsx` - Review and approve/decline apps, auto-generates leases
- `/app/landlord/leases/page.tsx` - Sign leases
- `/app/tenant/leases/page.tsx` - View, sign, download leases

---

## Next Steps (Optional Enhancements)

1. **Enhanced Signature Capture:** Use library like `react-signature-canvas` for actual digital signatures
2. **Email Confirmations:** Send emails at each step with lease PDF attachments
3. **SMS Notifications:** Send SMS reminders for upcoming viewings
4. **Viewing Cancellation:** Allow tenants to cancel/reschedule viewing requests
5. **Payment Integration:** Link lease signing to Ozow payment for move-in amount
6. **Deposit Return Flow:** Implement deposit return mechanism at lease end
7. **Maintenance Requests:** Allow tenants to report issues during lease period

---

**Your workflow is now complete and ready for testing!**
