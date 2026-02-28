# Workflow Testing Checklist

Use this checklist to verify the complete 8-step workflow works end-to-end.

## Pre-Test Setup
- [ ] Dev server running on http://localhost:3002
- [ ] Two test accounts created (one tenant, one landlord)
- [ ] Landlord has created at least one property listing
- [ ] All environment variables configured (.env.local)

---

## STEP 1: Tenant Requests Viewing ✓

**What to test:**
- [ ] Tenant logs in
- [ ] Tenant navigates to Browse Properties
- [ ] Tenant finds landlord's property
- [ ] Tenant clicks on property card
- [ ] Tenant sees property details page
- [ ] Tenant clicks "Request a Viewing" button
- [ ] Date picker opens
- [ ] Tenant selects preferred date and time
- [ ] Tenant optionally adds a message
- [ ] Tenant clicks "Submit Viewing Request"
- [ ] Success message appears
- [ ] Check database: `viewing_requests` table has new row with status = "pending"

**Expected Result:** 
✅ Viewing request created with status "pending"

---

## STEP 2: Landlord Confirms Viewing ✓

**What to test:**
- [ ] Landlord logs in
- [ ] Landlord navigates to "Viewing Requests" (left sidebar under Properties)
- [ ] Landlord sees tenant's viewing request in the list
- [ ] Request shows:
  - [ ] Property name
  - [ ] Tenant name
  - [ ] Requested date/time
  - [ ] Status badge "Awaiting Response"
- [ ] Landlord clicks "Confirm" button
- [ ] Confirmation dialog opens
- [ ] Dialog shows property and tenant info
- [ ] Landlord selects a confirmed date
- [ ] Landlord selects a confirmed time
- [ ] Landlord optionally adds a message
- [ ] Landlord clicks "Confirm Viewing"
- [ ] Success message appears
- [ ] List refreshes, status changes to "Confirmed"
- [ ] Check database: `viewing_requests.status` = "confirmed"
- [ ] Check database: `viewing_requests.confirmed_date` and `confirmed_time` populated

**Expected Result:** 
✅ Viewing request updated to status "confirmed" with landlord's date/time

---

## STEP 3: Viewing Completes ✓

**What to test:**
- [ ] Landlord navigates back to "Viewing Requests"
- [ ] Landlord finds the confirmed viewing request
- [ ] Request now shows "Confirmed" badge with confirmed date/time
- [ ] Landlord clicks "Mark Completed" button (on confirmed viewing)
- [ ] Dialog opens asking to confirm
- [ ] Landlord can optionally add a message
- [ ] Landlord clicks "Mark Completed"
- [ ] List refreshes, status changes to "Completed"
- [ ] Check database: `viewing_requests.status` = "completed"

**Expected Result:** 
✅ Viewing request updated to "completed"
🔓 **TENANT'S APPLICATION FORM NOW UNLOCKED**

---

## STEP 4: Tenant Submits Application ✓

**What to test:**
- [ ] Tenant logs in
- [ ] Tenant navigates to Browse Properties
- [ ] Tenant finds the same property they had viewing for
- [ ] Tenant clicks on property
- [ ] Tenant sees "Apply Now" button (now ENABLED, not locked)
- [ ] Tenant clicks "Apply Now"
- [ ] Application form opens with sections:
  - [ ] Preferred move-in date
  - [ ] Lease duration dropdown
  - [ ] Number of additional occupants
  - [ ] Occupant details (if occupants > 0)
  - [ ] Cover letter text area
  - [ ] Special requests text area
- [ ] Tenant fills in all fields
- [ ] Tenant clicks "Submit Application"
- [ ] Success message appears
- [ ] Check database: `applications` table has new row with status = "pending"

**Expected Result:** 
✅ Application created with status "pending"

---

## STEP 5: Landlord Reviews Application ✓

**What to test:**
- [ ] Landlord logs in
- [ ] Landlord navigates to "Applications" in sidebar
- [ ] Landlord sees application in the list
- [ ] Application shows:
  - [ ] Tenant name and email
  - [ ] Property name
  - [ ] Applied date
  - [ ] Status badge
  - [ ] Proposed move-in date
  - [ ] Lease duration requested
  - [ ] Cover letter preview
- [ ] Landlord clicks on application card
- [ ] Application details page opens showing:
  - [ ] All tenant information
  - [ ] Application details
  - [ ] Viewing request status (should be "completed")
  - [ ] Lease terms preview
- [ ] Landlord clicks "Approve" button
- [ ] Approval dialog opens
- [ ] Landlord can optionally add approval message
- [ ] Landlord clicks "Approve Application"
- [ ] Success message: "Application approved. Lease created."

**Expected Result:** 
✅ Application status changed to "approved"
✅ Lease auto-generated in `leases` table
✅ Notifications sent to both users

---

## STEP 6: Lease Auto-Generated ✓

**What to test:**
- [ ] Check database: `leases` table has new row for tenant/property
- [ ] Lease record contains:
  - [ ] `tenant_id` = correct tenant
  - [ ] `property_id` = correct property
  - [ ] `start_date` = tenant's proposed move-in date
  - [ ] `end_date` = calculated correctly (start + lease duration months)
  - [ ] `monthly_rent` = property's rent amount
  - [ ] `is_active` = true
  - [ ] `signed_by_landlord` = false
  - [ ] `signed_by_tenant` = false
- [ ] Landlord receives notification "New lease ready for signature"
- [ ] Tenant receives notification "Your application was approved. Lease ready to sign"
- [ ] Check database: `properties.status` = "occupied" for this property

**Expected Result:** 
✅ Lease created with all correct details
✅ Both users notified
✅ Property marked as occupied

---

## STEP 7: Landlord Signs Lease ✓

**What to test:**
- [ ] Landlord logs in
- [ ] Landlord navigates to "Leases" in sidebar
- [ ] Landlord sees unsigned lease in the list
- [ ] Lease shows:
  - [ ] Tenant name
  - [ ] Property name
  - [ ] Status "Unsigned"
  - [ ] Start and end dates
  - [ ] Monthly rent amount
- [ ] Landlord clicks on lease card
- [ ] Lease details page opens showing:
  - [ ] Move-in total (deposit + first month + extras)
  - [ ] Monthly total (rent + extras)
  - [ ] Admin fee: R375
  - [ ] Lease duration
  - [ ] All terms displayed
  - [ ] "Sign Lease" button visible
- [ ] Landlord clicks "Sign Lease" button
- [ ] Signing dialog opens
- [ ] Dialog shows all lease terms
- [ ] Landlord clicks checkbox "I have reviewed and agree to these terms"
- [ ] "Sign Lease" button becomes enabled
- [ ] Landlord clicks "Sign Lease"
- [ ] Success message appears
- [ ] List refreshes, showing lease status as "Signed by Landlord"
- [ ] Check database: `leases.signed_by_landlord` = true

**Expected Result:** 
✅ Lease marked as signed by landlord
✅ Timestamp recorded

---

## STEP 8: Tenant Signs Lease ✓

**What to test:**
- [ ] Tenant logs in
- [ ] Tenant navigates to "My Leases" in sidebar
- [ ] Tenant sees unsigned lease
- [ ] Lease shows:
  - [ ] Property name
  - [ ] Status "Awaiting Your Signature"
  - [ ] Landlord name
  - [ ] Start and end dates
  - [ ] Monthly rent amount
- [ ] Tenant clicks on lease card
- [ ] Lease details page opens showing:
  - [ ] Move-in date
  - [ ] Monthly rent
  - [ ] Deposit required (if applicable)
  - [ ] Extras/add-ons if any
  - [ ] Admin fee: R375
  - [ ] All terms
  - [ ] "Download PDF" button (optional test)
  - [ ] "Sign Lease" button
- [ ] Tenant clicks "Download PDF" (optional, verify PDF downloads)
- [ ] Tenant clicks "Sign Lease"
- [ ] Signing dialog opens
- [ ] Terms displayed
- [ ] Tenant clicks checkbox "I accept the lease terms"
- [ ] "Sign Lease" button becomes enabled
- [ ] Tenant clicks "Sign Lease"
- [ ] Success message appears: "Lease signed successfully!"
- [ ] List refreshes, showing "Fully Signed" status
- [ ] Check database: `leases.signed_by_tenant` = true
- [ ] Check database: `leases.signed_at` = current timestamp

**Expected Result:** 
✅ Lease fully signed
✅ Both landlord and tenant have signed
✅ Lease is now ACTIVE for rent collection

---

## End-to-End Verification

- [ ] All 8 steps completed successfully
- [ ] No errors in browser console
- [ ] No errors in dev server logs
- [ ] Property now shows as "Occupied" in landlord's property list
- [ ] Tenant can see their signed lease
- [ ] Landlord can see their signed lease
- [ ] Both users can navigate to related pages

---

## Additional Checks

### Viewing Requests Page
- [ ] Filters work (by status, search)
- [ ] All viewing requests for landlord's properties visible
- [ ] Can decline viewings (changes status to "declined")
- [ ] Landlord message appears for tenant after confirmation
- [ ] Tenant message visible to landlord

### Applications Page
- [ ] Can see all applications for properties
- [ ] Can filter by status and property
- [ ] Viewing request linked to application shows status
- [ ] Can decline application (with rejection reason)
- [ ] Rejection reason sent to tenant

### Leases Pages
- [ ] Both users can see their signed leases
- [ ] PDF download works
- [ ] Can see full lease terms and calculations
- [ ] Admin fee (R375) correctly shown
- [ ] Move-in total correctly calculated
- [ ] Monthly total correctly calculated

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Application form locked" | Verify viewing status is "completed" not just "confirmed" |
| "Lease not created" | Check application status is "approved", not pending |
| "Viewing requests not visible" | Landlord must own the property; check property landlord_id |
| "Tenant can't see viewing request" | Verify correct tenant_id in viewing_requests table |
| "Lease details not calculating" | Check lease-utils.ts formulas; verify property fields populated |
| "Notification not received" | Check notifications table in Supabase; verify user_id correct |

---

## Test Results

**Date Tested:** _______________  
**Tester Name:** _______________  
**Environment:** Local / Staging / Production  

**Overall Result:**  
- [ ] ✅ All steps completed - READY FOR PRODUCTION
- [ ] ⚠️ Some issues found - See notes below
- [ ] ❌ Critical issues - Needs fixes

**Notes:**
```
[Add any issues, observations, or recommendations here]




```

**Approval:** _______________

---

## Performance Notes

- Application loads in < 2 seconds
- Viewing request fetch completes in < 1 second
- Lease generation happens instantly
- PDF generation completes in < 3 seconds
- No N+1 query problems observed
- Database queries optimized with parallel fetches

---

## Security Checklist

- [ ] RLS prevents tenants from seeing other tenants' data
- [ ] RLS prevents landlords from seeing other landlords' data
- [ ] Landlords can only manage their own properties
- [ ] Tenants can only sign their own leases
- [ ] Admin fees cannot be modified by users
- [ ] Lease dates cannot be changed after signing
- [ ] Application rejection logged and notified

---

**You're all set! Start testing and let me know if you encounter any issues. 🚀**
