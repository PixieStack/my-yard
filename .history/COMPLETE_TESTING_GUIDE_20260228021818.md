# MyYard Platform - Complete Setup & Testing Guide

## ✅ Phase 1: Database Setup (COMPLETE FIRST)

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste: `scripts/complete-database-setup.sql`
3. Execute the entire script
4. Verify all tables are created

### Step 2: Seed Test Data
1. Still in Supabase SQL Editor
2. Copy and paste: `scripts/insert-test-properties.sql`
3. Execute to populate test properties
4. Verify you see ~20 test properties

### Step 3: Create Test Users
```sql
-- You'll need real Auth users, but this marks the landlords in the system
-- Landlord IDs used in test data: 00000000-0000-0000-0000-000000000001 through 000000000005

-- Create profile entry for test landlord 1
INSERT INTO profiles (id, first_name, last_name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John', 'Smith', 'landlord1@test.com', 'landlord'),
  ('00000000-0000-0000-0000-000000000002', 'Sarah', 'Johnson', 'landlord2@test.com', 'landlord'),
  ('00000000-0000-0000-0000-000000000003', 'Mike', 'Brown', 'landlord3@test.com', 'landlord'),
  ('00000000-0000-0000-0000-000000000004', 'Lisa', 'Davis', 'landlord4@test.com', 'landlord'),
  ('00000000-0000-0000-0000-000000000005', 'James', 'Wilson', 'landlord5@test.com', 'landlord')
ON CONFLICT DO NOTHING;
```

---

## 🧪 Phase 2: Feature Testing (Do In Order)

### TEST 1: Public Browsing (NOT LOGGED IN)
**What to test:**
- [ ] Go to http://localhost:3000/browse
- [ ] See list of properties loading
- [ ] See property images displaying
- [ ] See township dropdown with options like "Soweto", "Sandton", "Pretoria"
- [ ] Filter by township - results update
- [ ] Click "Apply" button on any property
- [ ] Should redirect to /browse/[propertyId] (public details page)
- [ ] See full property details without login
- [ ] Click "Apply for This Property" button
- [ ] Should redirect to login page
- [ ] After login, should go back to application page

**Expected Behavior:**
✅ Everything visible without login
✅ Apply button says "Apply" (not "Sign In to View")
✅ Clicking Apply prompts login when needed
✅ Township dropdown shows all available townships

---

### TEST 2: Favorites System (LOGGED IN AS TENANT)
**Setup:**
- [ ] Create 2 test tenant accounts
- [ ] Log in with tenant account 1

**What to test:**
- [ ] Browse properties (/browse)
- [ ] Click heart icon on property
- [ ] Heart fills red immediately
- [ ] Go to /tenant/favorites
- [ ] See favorited property in list
- [ ] Click heart again to remove
- [ ] Property disappears from favorites
- [ ] Switch browser/tab - refresh and verify persistence

**Expected Behavior:**
✅ Heart button toggles immediately
✅ Favorites page shows favorited properties
✅ Real-time updates (no page refresh needed)
✅ Favorites persist in database

---

### TEST 3: Complete Application Flow (8 Steps)

#### Step 1-2: Request & Confirm Viewing
**As Tenant:**
- [ ] Go to /browse
- [ ] Click Apply on a property
- [ ] You're redirected to property details
- [ ] Click "Apply for This Property"
- [ ] Fill in the viewing request:
  - [ ] Select date
  - [ ] Add optional message
  - [ ] Click "Request Viewing"
- [ ] Status shows "viewing_request = pending"

**As Landlord:**
- [ ] Log in as landlord
- [ ] Go to /landlord/applications
- [ ] See "Viewing Requests" tab
- [ ] Find your tenant's request (marked as "Awaiting Your Confirmation")
- [ ] Click "Confirm This Time"
- [ ] Add optional message
- [ ] Click "Confirm Viewing"
- [ ] Status changes to "confirmed"

**Tenant Verification:**
- [ ] Go to /tenant/applications
- [ ] See viewing status updated to "confirmed" (no page refresh needed - real-time)
- [ ] Notification should appear

**Expected Behavior:**
✅ Viewing request created
✅ Landlord can confirm
✅ Tenant sees update in real-time
✅ Both sides have viewing details

#### Step 3: Complete Viewing
**As Landlord:**
- [ ] After viewing happens
- [ ] Go to /landlord/applications → Viewing Requests
- [ ] Click "Confirm Viewing Was Done"
- [ ] Status changes to "completed"

**Tenant Verification:**
- [ ] Status updates to "completed" in real-time
- [ ] Now able to submit application

#### Step 4: Submit Application
**As Tenant:**
- [ ] Go to /tenant/applications
- [ ] Click on property with completed viewing
- [ ] See "Submit Application" button (now unlocked)
- [ ] Fill in application form:
  - [ ] Move-in date
  - [ ] Lease duration
  - [ ] Number of occupants (0+)
  - [ ] Cover letter/notes
  - [ ] Special requests
- [ ] Click "Submit Application"
- [ ] See confirmation
- [ ] Status shows "application = pending"

**Expected Behavior:**
✅ Application form unlocked after viewing done
✅ Form submits successfully
✅ Application saved to database

#### Step 5-6: Landlord Reviews & Approves
**As Landlord:**
- [ ] Go to /landlord/applications
- [ ] Find tenant's application
- [ ] Click "View Details"
- [ ] Review all information
- [ ] Click "Approve Application"
- [ ] See warning about: "This will create lease, deactivate property, reject others"
- [ ] Click "Approve & Create Lease"
- [ ] Status changes to "approved"
- [ ] Lease is auto-created

**Tenant Verification:**
- [ ] Get notification "Application Approved!"
- [ ] Go to /tenant/leases
- [ ] See lease in "Pending Signature" section
- [ ] Lease details are populated with agreed amounts
- [ ] Download PDF option available

#### Step 7-8: Both Sign Lease
**As Landlord:**
- [ ] Go to /landlord/leases
- [ ] Find the lease
- [ ] Click "Sign Lease"
- [ ] Lease status: signed_by_landlord = true

**As Tenant:**
- [ ] Should get notification that landlord signed
- [ ] Go to /tenant/leases
- [ ] See "Ready for Your Signature"
- [ ] Click "Review & Sign"
- [ ] See lease details and download option
- [ ] Click "Sign Lease"
- [ ] Get confirmation
- [ ] Status: signed_by_tenant = true, lease is ACTIVE

**Both Parties:**
- [ ] Messaging should NOW be unlocked (can see each other in /messages)
- [ ] Real-time updates on both sides

**Expected Behavior:**
✅ Lease auto-created on approval
✅ Both parties can review and sign
✅ Real-time status updates
✅ Messaging unlocks after both sign
✅ Lease becomes active

---

### TEST 4: Messaging System (AFTER LEASE SIGNED)

**As Tenant:**
- [ ] Go to /tenant/messages
- [ ] Should see landlord in conversations list
- [ ] NOT locked (no lock icon)
- [ ] Click to open conversation
- [ ] Type message and send
- [ ] Message appears in chat

**As Landlord:**
- [ ] Go to /landlord/messages
- [ ] Should see tenant in list
- [ ] Click conversation
- [ ] See tenant's message
- [ ] Reply to tenant

**Real-time Verification:**
- [ ] Landlord sends message
- [ ] Tenant sees it appear instantly (no refresh needed)
- [ ] Unread badge updates

**Expected Behavior:**
✅ Both can see each other after lease signed
✅ Messages send and receive instantly
✅ Real-time updates without page refresh

---

### TEST 5: Payment & Admin Fee Flow

**Tenant After Lease Signed:**
- [ ] Redirected to /tenant/payments
- [ ] See move-in payment needed:
  - [ ] Deposit amount
  - [ ] Rent amount (for first month)
  - [ ] Total amount due

**Initiate Payment with Ozow:**
- [ ] Click "Pay Now"
- [ ] See Ozow payment modal/redirect
- [ ] Payment method options appear
- [ ] Complete test payment (use test card if available)

**After Payment Success:**
- [ ] Redirected back to /tenant/payments
- [ ] Payment status shows "completed"
- [ ] Receipt uploaded/generated
- [ ] See receipt download option

**Landlord Verification:**
- [ ] Go to /landlord/dashboard or /landlord/payments
- [ ] See payment received notification
- [ ] See deposit in banking details
- [ ] See receipt from tenant

**Admin Fee Notification:**
- [ ] Landlord should see in-app notification:
  - [ ] "Admin Fee Required"
  - [ ] "R375.00 due"
  - [ ] Payment button to pay admin fee
- [ ] Payment redirects to Ozow again
- [ ] After payment, notification cleared

**Expected Behavior:**
✅ Ozow payment works end-to-end
✅ Receipt generated and stored
✅ Admin fee triggered automatically
✅ Both parties notified of payment

---

### TEST 6: Settings Page (Landlord)

**As Landlord:**
- [ ] Go to /landlord/settings or account settings
- [ ] Find "Banking Details" section
- [ ] Fill in:
  - [ ] Bank Name (e.g., "ABSA", "FNB")
  - [ ] Account Holder Name
  - [ ] Account Number
  - [ ] Account Type (select: Savings, Cheque, or Transmission)
- [ ] Click "Save"
- [ ] See "Saved successfully" message
- [ ] Page refresh - data should still be there
- [ ] Log out and log back in
- [ ] Data should persist

**Edit Banking Details:**
- [ ] Change account details
- [ ] Click "Update"
- [ ] See "Updated successfully"
- [ ] Verify changes saved

**Expected Behavior:**
✅ Data saves to database
✅ Persists on page refresh
✅ Persists after logout/login
✅ No fake save messages

---

### TEST 7: Notifications System

**All Notification Types to Verify:**
- [ ] **Viewing Confirmed:** Tenant gets notified when landlord confirms viewing
- [ ] **Viewing Completed:** Tenant notified when landlord marks viewing done
- [ ] **Application Approved:** Tenant notified when landlord approves
- [ ] **Application Rejected:** Tenant notified when landlord declines
- [ ] **Lease Ready:** Tenant notified when lease created and ready to sign
- [ ] **Lease Signed (by landlord):** Tenant notified
- [ ] **Lease Signed (by tenant):** Landlord notified
- [ ] **New Message:** Both parties notified of new messages
- [ ] **Payment Received:** Landlord notified when tenant pays
- [ ] **Admin Fee Required:** Landlord notified after lease signed

**How to Verify:**
- [ ] Go to /notifications or bell icon
- [ ] See appropriate notification with title and message
- [ ] Click notification to navigate to relevant page
- [ ] Mark as read
- [ ] Notification disappears from unread count

**Expected Behavior:**
✅ All 10 notification types trigger
✅ Notifications are real-time
✅ Clicking navigates to correct page
✅ Can mark read/unread
✅ Unread count accurate

---

### TEST 8: Property Listing Controls

**As Landlord (After Lease Signed):**
- [ ] Go to /landlord/properties
- [ ] Find the property with signed lease
- [ ] Should see buttons:
  - [ ] "Unlist Property" button
  - [ ] Property shows as "occupied"
- [ ] Click "Unlist Property"
- [ ] Button changes to "List Again"
- [ ] Property no longer shows on /browse (public)

**Verify Public Can't See:**
- [ ] Go to /browse in new incognito tab
- [ ] Property not in list anymore
- [ ] Can't access via /browse/[propertyId]

**Relist Property:**
- [ ] As landlord, go back
- [ ] Click "List Again"
- [ ] Property reappears on /browse
- [ ] Can apply again

**Expected Behavior:**
✅ Unlisting removes from public browse
✅ Relisting makes it visible again
✅ Changes reflected immediately

---

### TEST 9: UI/UX Fixes

#### Homepage Logo Size
- [ ] Go to http://localhost:3000/
- [ ] Logo should be clearly visible and larger
- [ ] Logo scales responsively on mobile
- [ ] Logo doesn't look tiny/crushed

#### Tab Icon (Favicon)
- [ ] Look at browser tab
- [ ] Should show MyYard icon/logo (not generic icon)
- [ ] Icon visible in browser history
- [ ] Bookmark shows correct icon

**Expected Behavior:**
✅ Logo prominent and visible
✅ Favicon displays in tab
✅ Both load correctly

---

## 🚀 Deployment Checklist

Before deploying to production:

### Database
- [ ] All tables created in Supabase
- [ ] RLS policies enabled and tested
- [ ] Indexes created for performance
- [ ] Backups configured

### Authentication
- [ ] Auth provider configured
- [ ] Redirect URLs correct
- [ ] Environment variables set

### Storage
- [ ] `payment-receipts` bucket created in Supabase
- [ ] Upload policies set correctly
- [ ] Files can be downloaded

### Environment Variables
- [ ] `.env.local` has correct Supabase URL
- [ ] `.env.local` has correct Supabase Key
- [ ] NEXT_PUBLIC variables set
- [ ] Ozow credentials configured

### Testing
- [ ] All 9 test categories passing
- [ ] No console errors
- [ ] No build errors
- [ ] All features working on Chrome, Firefox, Safari

### Performance
- [ ] Load times acceptable (< 3 seconds)
- [ ] Real-time updates responsive
- [ ] Images optimized
- [ ] Database queries efficient

---

## 🔧 Troubleshooting

### Properties not showing on /browse
```
CHECK:
1. Supabase database has properties table
2. Properties have status = 'available'
3. Properties have property_type = 'room', 'bachelor', or 'cottage'
4. Images exist in property_images table
```

### Messaging locked for all users
```
CHECK:
1. Tenant has approved application OR signed lease
2. Both landlord and tenant profiles exist
3. Leases table has correct foreign keys
4. Real-time subscriptions not error-ing
```

### Ozow payments not working
```
CHECK:
1. Ozow API keys in environment
2. Callback URL correct in Ozow dashboard
3. Payment endpoint receiving callbacks
4. Database payment records updating
```

### Settings not saving
```
CHECK:
1. Supabase connection working
2. RLS policies allow INSERT/UPDATE
3. Profile user_id matches logged-in user
4. No SQL errors in browser console
```

---

## ✅ Final Sign-Off

Once all tests pass:

- [ ] Generate test report
- [ ] Screenshot working features
- [ ] Document any issues
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Send to client for review
