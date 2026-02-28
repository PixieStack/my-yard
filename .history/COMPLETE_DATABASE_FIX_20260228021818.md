# 🗄️ COMPLETE DATABASE FIX - STEP BY STEP

## The Problem You're Seeing

```
Error: "Could not find the table 'public.notifications' in the schema cache"
```

This happens because:
1. ❌ The `notifications` table doesn't exist in your Supabase database
2. ❌ The `tenant_profiles` table doesn't exist
3. ❌ The `lease_termination_requests` table doesn't exist
4. ✅ The code is trying to use them, but they're not created yet

---

## Solution: Execute Database Setup SQL

### Step 1️⃣: Open Supabase SQL Editor
1. Go to **https://app.supabase.com**
2. Select your **MyYard project**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** button

### Step 2️⃣: Copy and Paste the Database Setup SQL
1. Open file: `scripts/complete-database-setup.sql`
2. **Select ALL** content (Ctrl+A)
3. **Copy** (Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **Run** button (or Ctrl+Enter)

### Step 3️⃣: Wait for Success Message
You should see: **"Query successful"** (may have warnings about duplicate keys - that's OK)

If you see errors like:
- ⚠️ "Duplicate key value violates unique constraint" → **Click "Continue anyway"**
- ⚠️ "Relation already exists" → **Normal, it's just checking if tables exist**
- ❌ Other errors → Let me know the exact error message

### Step 4️⃣: Verify Tables Were Created
In SQL Editor, run this verification query:

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these ✅ **REQUIRED TABLES**:
```
✅ applications
✅ favorites
✅ lease_termination_requests  (NEW - was missing)
✅ leases
✅ messages
✅ notifications  (THIS WAS YOUR ERROR!)
✅ payments
✅ properties
✅ property_images
✅ tenant_profiles  (NEW - was missing)
✅ townships
✅ viewing_requests
```

If any are missing, the SQL didn't run properly. Go back to Step 2.

### Step 5️⃣: Insert Test Data (Optional)
If you want sample properties to test with:

1. Click **New Query** in Supabase
2. Open: `scripts/insert-test-properties.sql`
3. Copy all and paste into SQL Editor
4. Click **Run**

This creates 20 test properties automatically.

### Step 6️⃣: Restart Your Dev Server
In PowerShell:
```bash
# Kill the old server
taskkill /IM node.exe /F 2>$null

# Restart it
npm run dev
```

Or just press Ctrl+C in the terminal and run `npm run dev` again.

---

## ✅ Verify Everything Works

After restarting, test these in your browser:

### Test 1: Browse Properties (no login needed)
- Go to **http://localhost:3000/browse**
- ✅ Should see list of properties
- ❌ If you see error "notifications table", go back to Step 2-5

### Test 2: Click a Property
- Click any property card
- ✅ Should see property details page
- Should show images, landlord info, address
- ❌ If error, database setup didn't work

### Test 3: Check Console for Errors
- Open DevTools (F12)
- Click **Console** tab
- ✅ Should be clean, no red errors
- ❌ If you see "Could not find the table" errors, database setup failed

### Test 4: Login and Test Features
- Create an account or login
- Go to `/tenant/applications`
- ✅ Should load without errors
- ❌ If error mentioning "notifications", re-run SQL setup

---

## 🔍 What Was Fixed

| Table | Status | Used For |
|-------|--------|----------|
| `notifications` | ✅ NEW | Alerts for viewing requests, applications, payments, etc |
| `tenant_profiles` | ✅ NEW | Extended tenant information (employment, address history, etc) |
| `lease_termination_requests` | ✅ NEW | Request to break lease early |
| All 10 other tables | ✅ Ready | Properties, messages, payments, leases, etc |

---

## 🆘 Still Getting Errors?

### Error: "Could not find the table"
→ The SQL didn't execute. Go back to **Step 2-5** and run it again.

### Error: "Duplicate key violates unique constraint"
→ Normal! Click "Continue anyway" and proceed.

### Error: Something about "foreign key"
→ Tables are being created in wrong order. The complete SQL handles this automatically.

### Error: "permission denied"
→ Your Supabase user doesn't have permission. Usually not this, but verify you're using the correct project.

### Dev server still shows black screen
1. Clear .next folder: `Remove-Item -Recurse -Force .next`
2. Kill node: `taskkill /IM node.exe /F`
3. Restart: `npm run dev`
4. Wait 30-60 seconds for first load

---

## 📋 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied `scripts/complete-database-setup.sql` content
- [ ] Pasted into SQL Editor and clicked **Run**
- [ ] Saw "Query successful" message
- [ ] Ran verification query and saw all 13 tables
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested `/browse` page - no errors
- [ ] Opened DevTools console - no red errors
- [ ] All ready to go! ✅

---

## 💡 Why These Tables?

**`notifications`** → Stores alerts for:
- When viewing request is confirmed
- When application is approved/rejected
- When lease is ready to sign
- When payment is received
- When new message arrives
- When admin fee is due

**`tenant_profiles`** → Stores extended info about tenants:
- Employment status and income
- ID number and address history
- Preferred move-in date
- Pet ownership
- Emergency contact details

**`lease_termination_requests`** → Tracks early lease termination:
- When tenant wants to break lease early
- Notice period (default 30 days)
- Landlord's approval/rejection

---

## ✨ After Database Setup

All these features will work without errors:
- ✅ Property browsing and filtering
- ✅ Viewing requests (request → confirm → complete)
- ✅ Applications (apply → approve → lease → sign)
- ✅ Lease signing (both parties sign)
- ✅ Payments via Ozow
- ✅ Messaging between landlord/tenant
- ✅ Notifications for all events
- ✅ Tenant profile settings
- ✅ Lease termination requests
- ✅ Favorites (heart button)

**All without any database errors!**

---

## 🎯 Next Steps

1. **Execute the SQL** (Steps 1-5 above)
2. **Restart dev server**
3. **Test the app** at http://localhost:3000/browse
4. **Report any remaining errors** with full error message

You've got this! 🚀
