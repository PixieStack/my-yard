# Complete End-to-End Testing Guide

**Project:** MyYard - Township Rental Marketplace  
**Test Date:** February 27, 2026  
**Status:** Ready for Full Testing

---

## Overview

This document provides step-by-step testing instructions for all features in MyYard, including:
- Public property browsing (before login)
- Complete 8-step rental workflow
- Favorites system
- Settings pages
- Live messaging for signed leases

---

## Features Implemented

### 1. **Public Property Browsing** ✅
**URL:** `http://localhost:3001/browse`

**Features:**
- Search properties by name or location
- Filter by township, property type, bedrooms, price range
- Pagination (12 properties per page)
- Property cards show: image, bedrooms, bathrooms, size, price
- Favorites button (redirects to login if not signed in)
- Works completely WITHOUT requiring login
- Home search bar routes to `/browse` for non-logged-in users

**Test Steps:**
```
1. Open http://localhost:3001 (home page)
2. Click "browse all available properties" link
3. Search for "Soweto" → should show properties in Soweto
4. Filter by price range (e.g., R1000 - R3000)
5. Filter by property type "apartment" → should show only apartments
6. Click pagination buttons to navigate pages
7. Try favorites button (should redirect to login)
8. Close browser and test without login → still works
```

---

## Step-by-Step 8-Workflow Testing

### **STEP 1: Tenant Requests Viewing** ✅

**Prerequisites:**
- User logged in as tenant
- Browsing property (logged-in or on `/browse`)

**Test Steps:**
```
1. Navigate to property details page
2. Click "Request a Viewing" button
3. Fill in:
   - Date (pick future date)
   - Time (e.g., 14:00)
   - Message (optional)
4. Click "Submit Request"
5. Verify success message appears
6. Check database: viewing_requests table should show status = "pending"
```

**Expected Result:**
- ✅ Viewing request created with status = "pending"
- ✅ Success notification displayed
- ✅ Button disabled after submission (already has viewing request)

---

### **STEP 2: Landlord Confirms Viewing** ✅

**Prerequisites:**
- User logged in as landlord who owns the property
- Has a pending viewing request

**URL:** `http://localhost:3001/landlord/viewing-requests`

**Test Steps:**
```
1. Navigate to Landlord Dashboard
2. Click "Viewing Requests" in sidebar (Eye icon)
3. Should see list of viewing requests
4. Find the tenant's viewing request (status should be "pending")
5. Click "Confirm Time" button
6. Dialog appears confirming property and time
7. Click "Confirm Viewing"
8. Request should change to status = "confirmed"
```

**Expected Result:**
- ✅ Viewing request status updated to "confirmed"
- ✅ Status badge changes from yellow (pending) to blue (confirmed)
- ✅ Button changes from "Confirm Time" to "Complete Viewing"

---

### **STEP 3: Viewing Takes Place & Landlord Confirms** ✅

**Prerequisite:**
- Viewing request status = "confirmed"

**Test Steps:**
```
1. In Viewing Requests page
2. Find confirmed viewing request
3. Click "Complete Viewing" button
4. Dialog appears asking to confirm viewing is done
5. Click "Complete Viewing"
6. Request status changes to "completed" (green badge)
```

**Expected Result:**
- ✅ Status changes to "completed" (green)
- ✅ Button shows checkmark and completion date
- ✅ Tenant can now see viewing as "completed"

---

### **STEP 4: Tenant Submits Application** ✅

**Prerequisites:**
- Tenant logged in
- Viewing status = "completed"
- Navigate to property apply page

**URL:** `http://localhost:3001/tenant/properties/[id]/apply`

**Test Steps:**
```
1. Go to property apply page
2. Page should show: "You have completed a viewing"
3. Form is UNLOCKED (green checkmark visible)
4. Fill out application:
   - Move-in date (future date)
   - Lease duration (e.g., 12 months)
   - Number of occupants
   - Cover letter (optional)
   - Special requests (optional)
5. Click "Submit Application"
6. Success message should appear
```

**Expected Result:**
- ✅ Form only appears if viewing is "completed"
- ✅ Application created with status = "pending"
- ✅ viewing_requests.status updated to "application_submitted"
- ✅ Success notification displayed

---

### **STEP 5: Landlord Reviews Application** ✅

**Prerequisites:**
- Landlord logged in (property owner)
- Has pending applications

**URL:** `http://localhost:3001/landlord/applications`

**Test Steps:**
```
1. Navigate to Applications page
2. Should see list of all applications for landlord's properties
3. Find the tenant's application (status "pending")
4. Click on application row to expand/see details
5. Review tenant information:
   - Name, email, phone
   - Move-in date, lease duration
   - Occupants, cover letter
6. Click "APPROVE" or "DECLINE" button
```

**Expected Result:**
- ✅ All applications shown with status badges
- ✅ Application details visible
- ✅ Approve/Decline buttons clickable

---

### **STEP 6: Lease Auto-Generated** ✅

**Prerequisite:**
- Landlord clicks "APPROVE" on application

**Test Steps:**
```
1. After clicking "APPROVE":
2. Confirmation dialog should appear
3. Click "Approve Application"
4. Application status changes to "approved"
5. Navigate to Landlord Leases page
6. New lease should appear in list
7. Lease should show:
   - Tenant name
   - Property name
   - Move-in date
   - Monthly rent
   - Status: "Unsigned"
```

**Expected Result:**
- ✅ Lease automatically created with calculated amounts
- ✅ Lease status = "Unsigned"
- ✅ signed_by_landlord = false, signed_by_tenant = false
- ✅ Move-in date and amounts calculated correctly

---

### **STEP 7: Landlord Signs Lease** ✅

**Prerequisites:**
- Landlord on Leases page
- Lease status = "Unsigned"

**URL:** `http://localhost:3001/landlord/leases`

**Test Steps:**
```
1. View unsigned lease
2. Click "Sign Lease" button
3. Dialog appears with lease summary:
   - Property, tenant, dates
   - Move-in total, monthly rent
   - Lease terms
4. Click "I Agree & Sign"
5. Lease status changes to "Awaiting Tenant Signature"
```

**Expected Result:**
- ✅ Lease status updated to "Awaiting Tenant Signature"
- ✅ signed_by_landlord = true
- ✅ Timestamp recorded
- ✅ Tenant notified

---

### **STEP 8: Tenant Signs Lease** ✅

**Prerequisites:**
- Tenant logged in
- Landlord has signed lease

**URL:** `http://localhost:3001/tenant/leases`

**Test Steps:**
```
1. Navigate to Tenant Leases page
2. Should see lease ready for signature
3. Status shows "Awaiting Your Signature"
4. Click "Sign Lease"
5. Dialog shows lease summary
6. Click "I Agree & Sign"
7. Lease status changes to "Active"
8. Option to download lease as PDF should appear
9. Click "Download as PDF" - file should download
```

**Expected Result:**
- ✅ Lease status changes to "Active" (green)
- ✅ signed_by_tenant = true
- ✅ Both signed_by_landlord and signed_by_tenant = true
- ✅ PDF download works
- ✅ Both tenant and landlord can now message

---

## Additional Features Testing

### **Favorites System** ✅

**Test Steps:**
```
1. Browse properties page (logged in or not)
2. On property card, see heart icon
3. Click heart:
   - If not logged in: redirects to login
   - If logged in: heart fills red (favorite added)
4. Click again: heart outline (removed from favorites)
5. Navigate to /tenant/favorites:
   - Should see all favorited properties
6. Click heart to remove from favorites
```

**Expected Result:**
- ✅ Heart icon toggles between filled/outline
- ✅ Favorites list updates
- ✅ Redirects non-logged-in users to login
- ✅ Data persists in database

---

### **Settings Pages** ✅

**Tenant Settings:** `http://localhost:3001/tenant/settings`  
**Landlord Settings:** `http://localhost:3001/landlord/settings`

**Test Steps:**
```
1. Navigate to settings page
2. Update profile information:
   - First name, last name
   - Phone number
   - (For tenants) Employment info, preferences
   - (For landlords) Company details, bank info
3. Click "Save Profile"
4. Success message should appear
5. Refresh page - data should persist
6. Check database - profiles table updated
```

**Expected Result:**
- ✅ Form loads with current data
- ✅ Changes saved to database
- ✅ Success notification displayed
- ✅ Data persists after refresh

---

### **Live Messaging (After Signed Leases)** ✅

**Prerequisites:**
- Lease signed by both parties
- Both users logged in separately (or simulate)

**URL:** `http://localhost:3001/tenant/messages` or `/landlord/messages`

**Test Steps:**
```
1. Tenant signs in and navigates to Messages
2. Should see conversation with landlord
3. Landlord signs in separately
4. Should see same conversation
5. Tenant types message and clicks Send
6. Message appears instantly (real-time)
7. Landlord should see new message appear
8. Landlord replies
9. Tenant sees reply in real-time
10. Can only message if lease is fully signed
```

**Expected Result:**
- ✅ Conversations only appear for signed leases
- ✅ Messages send and receive in real-time
- ✅ Messages are visible to both parties
- ✅ Cannot message if lease not signed
- ✅ Conversation linked to correct property

---

## Testing Checklist

### Public Features (No Login Required)
- [ ] Home page loads and displays features
- [ ] Search bar on home page works
- [ ] Browse page accessible at `/browse`
- [ ] Properties display with images and details
- [ ] Search filters work (township, type, bedrooms, price)
- [ ] Pagination works (12 per page)
- [ ] Favorites button redirects to login when not signed in
- [ ] Can view individual property pages

### Tenant Features
- [ ] Request viewing on property
- [ ] See "completed" viewing status on property page
- [ ] Apply for property (form unlocks after viewing)
- [ ] View applications (Dashboard)
- [ ] View and sign leases
- [ ] Download lease as PDF
- [ ] Send messages to landlord (after signing lease)
- [ ] Access favorites page
- [ ] Update profile in settings
- [ ] View favorite properties

### Landlord Features
- [ ] View pending viewing requests
- [ ] Confirm viewing time
- [ ] Complete viewing after happens
- [ ] View pending applications
- [ ] Approve/Decline applications
- [ ] View auto-generated leases
- [ ] Sign leases
- [ ] Receive messages from tenants
- [ ] See all applications from all properties
- [ ] Update profile in settings

### System Features
- [ ] Real-time messaging (Supabase Realtime)
- [ ] RLS policies working (users can't see others' data)
- [ ] Error handling and user feedback
- [ ] Loading states on async operations
- [ ] Form validation
- [ ] Success notifications
- [ ] No console errors

---

## Performance Targets

- ✅ **App Startup:** < 3 seconds (Currently: 2.9s)
- ✅ **Page Load:** < 2 seconds
- ✅ **Search:** < 1 second
- ✅ **Message Send:** < 500ms
- ✅ **Real-time Updates:** < 1 second

---

## Database Checks

### Tables to Verify

1. **viewing_requests**
   ```sql
   SELECT id, status, requested_date, tenant_id, property_id 
   FROM viewing_requests 
   ORDER BY created_at DESC LIMIT 10;
   ```

2. **applications**
   ```sql
   SELECT id, status, tenant_id, property_id, applied_at 
   FROM applications 
   ORDER BY applied_at DESC LIMIT 10;
   ```

3. **leases**
   ```sql
   SELECT id, tenant_id, landlord_id, signed_by_tenant, signed_by_landlord 
   FROM leases 
   ORDER BY created_at DESC LIMIT 10;
   ```

4. **favorites**
   ```sql
   SELECT id, user_id, property_id 
   FROM favorites 
   WHERE user_id = '[current-user-id]';
   ```

5. **conversations** (if messaging table created)
   ```sql
   SELECT id, lease_id, tenant_id, landlord_id 
   FROM conversations 
   LIMIT 10;
   ```

---

## Troubleshooting

### Issue: Viewing Request Page Shows No Data
- **Check:** User is logged in as landlord
- **Check:** Properties exist and are owned by this landlord
- **Check:** Viewing requests exist in database for these properties

### Issue: Can't Submit Application
- **Check:** Viewing status is "completed"
- **Check:** User is logged in as tenant
- **Check:** No duplicate application exists

### Issue: Messages Not Sending
- **Check:** Lease is fully signed by both parties
- **Check:** Check console for Supabase errors
- **Check:** Verify messaging tables exist in database

### Issue: Favorites Not Working
- **Check:** User is logged in (or redirect to login works)
- **Check:** favorites table exists in database
- **Check:** RLS policies allow insert/delete

---

## Notes for QA

1. **Test Data:** Use properties with realistic data
2. **User Roles:** Create separate tenant and landlord accounts
3. **Timing:** Ensure viewing dates are future dates
4. **Validation:** Check all form validations work
5. **Edge Cases:** Test with invalid inputs and empty fields
6. **Performance:** Monitor network tab in browser dev tools
7. **Mobile:** Test on mobile devices if required
8. **Accessibility:** Check keyboard navigation works

---

## Sign-Off

**Tester Name:** _______________  
**Test Date:** _______________  
**Status:** [ ] PASS [ ] FAIL  
**Notes:**

---

**Build Info:**
- Next.js: 15.2.4
- Node: v20.19.5
- Supabase: Live
- Startup Time: 2.9s
