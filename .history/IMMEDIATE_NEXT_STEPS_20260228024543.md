# Immediate Next Steps - DO THIS NOW

## Step 1: Execute Database Migration (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Open file: `ADD_MISSING_TABLES.sql`
3. Copy entire content
4. Paste into Supabase SQL Editor
5. Click RUN
6. Should see: "Minimal update completed!" message

This adds:
- `notifications` table with RLS policies (FIX for notifications error)
- `lease_termination_requests` table (NEW)

---

## Step 2: Test Tenant Viewing Requests (5 minutes)
1. Login as tenant
2. Go to "My Applications" page
3. **Scroll down** - you should see a new "My Viewing Requests" section
4. All 4 viewing requests should display with:
   - Property image
   - Property name & address
   - Viewing date and time
   - Status badge
   - Any landlord messages

✅ If you see all 4 viewing requests = WORKING

---

## Step 3: Test Settings Persistence (5 minutes)
1. Login as tenant
2. Go to Settings
3. Change something (e.g., phone number, city)
4. Click Save
5. Should see green success message
6. **Refresh the page** (F5)
7. Check if changes are still there

✅ If data persists after refresh = WORKING

---

## Step 4: Access Banking Details Page (2 minutes)
1. Login as landlord
2. Look at left sidebar navigation menu
3. Should see "Banking Details" link (between "Payments" and "Messages")
4. Click it
5. Form should have fields for:
   - Bank Name
   - Account Number
   - Account Holder Name
   - Account Type (dropdown)
6. Fill in and click Save

✅ If page loads and saves = WORKING

---

## Step 5: Test Ozow Payment (5 minutes)
1. Login as tenant
2. Go to "Payments" page
3. Look for "Ozow" payment button
4. Click it
5. Should redirect to Ozow payment page (or payment form)

❌ If it doesn't redirect = Check environment variables

---

## Step 6: Test Viewing Confirmation (5 minutes)
1. Login as landlord
2. Go to "Applications" page
3. Find a viewing request in "Pending" status
4. Click "Confirm Viewing" button
5. Add optional message
6. Click Submit
7. **Check that ONLY that one viewing request changes status to "Confirmed"**
   - Other pending viewings should stay "Pending"
8. Refresh the page
9. Status should still be "Confirmed"

✅ If only ONE is confirmed = WORKING
❌ If ALL turn to "Confirmed" = BUG (report it)

---

## Step 7: Test Real-Time Updates (10 minutes)
1. **In two separate browsers/tabs:**
   - Tab 1: Login as Landlord
   - Tab 2: Login as Tenant
2. Landlord clicks "Confirm Viewing"
3. **In Tenant tab, without refreshing:**
   - Viewing request status should change to "Confirmed" immediately
4. If not immediate, refresh tenant side
5. Should still show "Confirmed"

✅ If updates appear immediately = REAL-TIME WORKING
⚠️ If need to refresh = Real-time subscriptions working but may have UI delay

---

## Quick Checklist ✓

After you complete these steps, you should have:

- [ ] Database migration executed
- [ ] Tenant sees all 4 viewing requests
- [ ] Settings page data persists on refresh
- [ ] Banking page accessible and saves
- [ ] Ozow redirect working (or identified as needing env vars)
- [ ] Viewing confirmation affects only one record
- [ ] Real-time updates working (or at least persisting correctly)

---

## If Something Doesn't Work

### Ozow Payment Not Redirecting
Check you have these environment variables set:
```
OZOW_SITE_CODE=
OZOW_PRIVATE_KEY=
OZOW_API_KEY=
OZOW_API_URL=https://stagingapi.ozow.com/PostPaymentRequest
OZOW_IS_TEST=true
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your app URL)
```

### Settings Not Persisting
- Check browser DevTools → Network tab
- Look for failed requests to `/tenant/settings`
- Check Supabase RLS policies allow updates
- Verify tenant_profiles table has correct columns

### Viewing Confirmation Confirming All
- Open browser console
- Look for any errors
- Check that you're clicking one viewing request at a time
- Refresh landlord page after confirming

### Viewing Requests Not Showing
- Refresh the tenant applications page
- Check browser console for errors
- Verify you have viewing_requests in database

---

## Success Criteria

✅ **All working** = Ready for user testing
⚠️ **Some issues** = Known issues documented for next session
❌ **Critical blockers** = Report in next message

---

## Time Estimate
Total time to verify all fixes: **~35-40 minutes**

