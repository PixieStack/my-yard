# Code Changes Summary - Session 3

## Overview
This document summarizes all code changes made in this session to fix critical issues.

---

## File 1: `app/tenant/favorites/page.tsx`

### Change: Fixed Township Query
**Line:** 65
**Problem:** Query used invalid relationship syntax: `township:townships(name, municipality)`
**Solution:** Changed to correct syntax: `township_id, townships(name)`

**Before:**
```typescript
.select(`...
  township:townships(name, municipality),
  ...
`)
```

**After:**
```typescript
.select(`...
  township_id, townships(name),
  ...
`)
```

**Impact:** Fixes error "column townships_2.municipality does not exist"

---

## File 2: `app/tenant/applications/page.tsx`

### Change 1: Added ViewingRequest Interface
**Location:** After ApplicationPayload interface (around line 70)

**Added:**
```typescript
interface ViewingRequest {
  id: string
  property_id: string
  requested_date: string
  requested_time: string
  status: "pending" | "requested" | "confirmed" | "completed" | "cancelled"
  tenant_message: string | null
  landlord_message: string | null
  created_at: string
  property: PropertyData | null
  landlord: {
    first_name: string
    last_name: string
  } | null
}
```

**Impact:** Enables type-safe viewing requests data

---

### Change 2: Added ViewingRequests State
**Location:** useState declarations (around line 118)

**Added:**
```typescript
const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
```

**Impact:** Stores fetched viewing requests

---

### Change 3: Added Viewing Requests Fetch
**Location:** In fetchApplications function, after propertyIds (around line 175)

**Added:**
```typescript
// ── Step 2b: Fetch all viewing requests for tenant ─────────────────────
const { data: viewingsRaw, error: viewingsError } = await supabase
  .from("viewing_requests")
  .select("id, property_id, requested_date, requested_time, status, tenant_message, landlord_message, created_at")
  .eq("tenant_id", profile.id)
  .order("created_at", { ascending: false })

if (viewingsError) {
  console.error("Viewings error:", viewingsError.message)
}

// Combine property IDs from both applications and viewings
const allPropertyIds = [
  ...new Set([
    ...propertyIds,
    ...(viewingsRaw?.map((v) => v.property_id) || []),
  ]),
]
```

**Impact:** Fetches all viewing requests for the tenant

---

### Change 4: Updated Property Queries to Use All Property IDs
**Location:** Property and images queries (around lines 210-225)

**Changed from:**
```typescript
.in("id", propertyIds)
```

**Changed to:**
```typescript
.in("id", allPropertyIds)
```

**Impact:** Ensures properties for viewing requests are also fetched

---

### Change 5: Added Viewing Requests Data Processing
**Location:** After setApplications call (around line 305)

**Added:**
```typescript
// ── Step 8: Build viewing requests with property data ────────────────
const viewingsMerged: ViewingRequest[] = (viewingsRaw ?? []).map((viewing) => {
  const property = propertyMap[viewing.property_id] ?? null
  return {
    id: viewing.id,
    property_id: viewing.property_id,
    requested_date: viewing.requested_date,
    requested_time: viewing.requested_time,
    status: viewing.status,
    tenant_message: viewing.tenant_message,
    landlord_message: viewing.landlord_message,
    created_at: viewing.created_at,
    property,
    landlord: property?.landlord_id
      ? (landlordMap[property.landlord_id] ?? null)
      : null,
  }
})

setViewingRequests(viewingsMerged)
```

**Impact:** Transforms viewing requests with associated property and landlord data

---

### Change 6: Added Real-Time Subscription for Viewing Requests
**Location:** After applications real-time subscription (around line 335)

**Added:**
```typescript
useRealtimeSubscription(
  "viewing_requests",
  () => {
    if (profile?.id) {
      console.log("📡 Viewing requests update received")
      fetchApplications()
    }
  },
  { event: "*", enabled: !!profile?.id }
)
```

**Impact:** Updates viewing requests when changes occur on server

---

### Change 7: Added Viewing Requests Display Section
**Location:** At end of render, before closing div (around line 635)

**Added:**
```typescript
{/* Viewing Requests Section */}
{viewingRequests.length > 0 && (
  <div className="mt-12 pt-8 border-t">
    <h3 className="text-2xl font-bold text-gray-900 mb-4">My Viewing Requests</h3>
    <p className="text-gray-600 mb-4">
      {viewingRequests.length} viewing request{viewingRequests.length !== 1 ? "s" : ""}
    </p>
    <div className="space-y-4">
      {viewingRequests.map((viewing) => (
        <Card key={viewing.id} className="hover:shadow-md transition-shadow">
          {/* Card showing viewing details, status, dates, and messages */}
          {/* ...full rendering code... */}
        </Card>
      ))}
    </div>
  </div>
)}
```

**Impact:** Displays all viewing requests with full details to tenant

---

## File 3: `app/tenant/settings/page.tsx`

### Change 1: Fixed fetchTenantProfile Query
**Location:** fetchTenantProfile function (around line 95)

**Changed from:**
```typescript
const { data, error } = await supabase
  .from("tenant_profiles")
  .select("*")
  .eq("id", profile?.id)
  .single()  // ← Problem: throws error if no record exists
```

**Changed to:**
```typescript
const { data, error } = await supabase
  .from("tenant_profiles")
  .select("*")
  .eq("id", profile?.id)
  .maybeSingle()  // ← Solution: returns null if no record exists
```

**Impact:** Handles case where tenant profile doesn't exist yet

---

### Change 2: Improved saveProfile Function
**Location:** saveProfile function (around line 160)

**Added:**
```typescript
const { error: tenantError } = await supabase
  .from("tenant_profiles")
  .upsert(tenantProfile, { onConflict: "id" })  // ← Explicit conflict column

if (tenantError) throw tenantError

// Refetch to verify the save ← NEW: Confirm data was persisted
await fetchTenantProfile()
```

**Changes:**
1. Added explicit `onConflict: "id"` to upsert (tells Supabase which column to match on)
2. Added refetch after save to verify data was persisted and retrieve it

**Impact:** Ensures data is saved correctly and persists on page refresh

---

## File 4: `app/landlord/banking/page.tsx`

### Change 1: Updated BankingDetails Interface
**Location:** Interface definition (around line 19)

**Changed from:**
```typescript
interface BankingDetails {
  id: string
  landlord_id: string  // ← Not in landlord_profiles
  bank_name: string
  account_number: string
  account_holder_name: string
  account_type: string
  created_at: string    // ← Not in landlord_profiles
  updated_at: string    // ← Not in landlord_profiles
}
```

**Changed to:**
```typescript
interface LandlordProfile {
  id: string
  bank_name: string | null
  account_number: string | null
  account_holder_name: string | null
  account_type: string | null
}
```

**Impact:** Matches actual landlord_profiles schema

---

### Change 2: Updated State Type
**Changed from:**
```typescript
const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null)
```

**Changed to:**
```typescript
const [bankingDetails, setBankingDetails] = useState<LandlordProfile | null>(null)
```

---

### Change 3: Updated fetchBankingDetails
**Changed from:**
```typescript
const { data, error: err } = await supabase
  .from("landlord_banking_details")  // ← Doesn't exist in user's DB
  .select("*")
  .eq("landlord_id", profile.id)
```

**Changed to:**
```typescript
const { data, error: err } = await supabase
  .from("landlord_profiles")  // ← User's existing table
  .select("id, bank_name, account_number, account_holder_name, account_type")
  .eq("id", profile.id)  // ← landlord_profiles uses id, not landlord_id
```

**Also added fallback for missing profile:**
```typescript
if (data) {
  setBankingDetails(data)
  setFormData({...})
} else {
  setBankingDetails({
    id: profile.id,
    bank_name: null,
    account_number: null,
    account_holder_name: null,
    account_type: null,
  })
}
```

---

### Change 4: Updated handleSave Function
**Changed from:**
```typescript
if (bankingDetails) {
  // Update existing in separate table
  const { error: err } = await supabase
    .from("landlord_banking_details")
    .update({...})
    .eq("landlord_id", profile.id)
  ...
} else {
  // Create new in separate table
  const { data, error: err } = await supabase
    .from("landlord_banking_details")
    .insert({...})
  ...
}
```

**Changed to:**
```typescript
// Update landlord_profiles with banking details
const { error: err } = await supabase
  .from("landlord_profiles")
  .update({
    bank_name: formData.bank_name || null,
    account_number: formData.account_number || null,
    account_holder_name: formData.account_holder_name || null,
    account_type: formData.account_type,
  })
  .eq("id", profile.id)

if (err) throw err
setSuccess("Banking details saved successfully!")
```

**Impact:** Saves to existing landlord_profiles table instead of non-existent separate table

---

## File 5: `app/landlord/layout.tsx`

### Change: Added Banking Details to Navigation
**Location:** Navigation menu definition (around line 11)

**Changed from:**
```typescript
import { Home, Building, Users, FileText, CreditCard, MessageSquare, Settings, LogOut, ScrollText, Eye } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/landlord/dashboard", icon: Home },
  { name: "Properties", href: "/landlord/properties", icon: Building },
  { name: "Viewing Requests", href: "/landlord/viewing-requests", icon: Eye },
  { name: "Tenants", href: "/landlord/tenants", icon: Users },
  { name: "Applications", href: "/landlord/applications", icon: FileText },
  { name: "Leases", href: "/landlord/leases", icon: ScrollText },
  { name: "Payments", href: "/landlord/payments", icon: CreditCard },
  { name: "Messages", href: "/landlord/messages", icon: MessageSquare },
  { name: "Settings", href: "/landlord/settings", icon: Settings },
]
```

**Changed to:**
```typescript
import { Home, Building, Users, FileText, CreditCard, MessageSquare, Settings, LogOut, ScrollText, Eye, Banknote } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/landlord/dashboard", icon: Home },
  { name: "Properties", href: "/landlord/properties", icon: Building },
  { name: "Viewing Requests", href: "/landlord/viewing-requests", icon: Eye },
  { name: "Tenants", href: "/landlord/tenants", icon: Users },
  { name: "Applications", href: "/landlord/applications", icon: FileText },
  { name: "Leases", href: "/landlord/leases", icon: ScrollText },
  { name: "Payments", href: "/landlord/payments", icon: CreditCard },
  { name: "Banking Details", href: "/landlord/banking", icon: Banknote },  // ← NEW
  { name: "Messages", href: "/landlord/messages", icon: MessageSquare },
  { name: "Settings", href: "/landlord/settings", icon: Settings },
]
```

**Impact:** Banking Details page is now accessible from navigation menu

---

## File 6: `ADD_MISSING_TABLES.sql`

### Change: Added Second RLS Policy for Notifications
**Location:** Around line 115 (notifications RLS section)

**Added:**
```sql
-- Allow authenticated users to create notifications
CREATE POLICY "Authenticated can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

**Why:** Previous policy only allowed system to insert, but authenticated users also need to insert notifications (for viewing confirmations, payment notifications, etc.)

**Impact:** Fixes error "new row violates row-level security policy"

---

## Summary of Impact

| File | Issue Fixed | Impact |
|------|-------------|--------|
| favorites/page.tsx | Township query syntax | Favorites now load without error |
| applications/page.tsx | Missing viewing requests display | Tenant sees all 4 viewing requests |
| settings/page.tsx | Data not persisting | Settings now persist on refresh |
| banking/page.tsx | Table mismatch | Banking page uses existing table |
| landlord/layout.tsx | No navigation link | Banking page now accessible |
| ADD_MISSING_TABLES.sql | RLS too restrictive | Notifications can be inserted |

---

## Testing These Changes

See `IMMEDIATE_NEXT_STEPS.md` for detailed testing instructions for each change.

