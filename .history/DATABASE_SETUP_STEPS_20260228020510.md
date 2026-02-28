# 🗄️ DATABASE SETUP - CRITICAL FIRST STEP

## The Problem
The `notifications` table (and potentially other tables) don't exist in your Supabase database. This is causing the error you're seeing.

## Solution: Execute SQL Scripts in Supabase

### Step 1: Go to Supabase Console
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run Database Setup
1. **Copy the entire content** from `scripts/complete-database-setup.sql`
2. **Paste it** into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for success message (should say "Query successful")

> ⚠️ **IMPORTANT:** If you get a warning about duplicate key values or constraint violations, that's OK - it means some tables already exist. Just click "Continue anyway".

### Step 3: Verify Tables Were Created
In SQL Editor, run this query:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

You should see these tables:
- ✅ applications
- ✅ favorites
- ✅ leases
- ✅ messages
- ✅ notifications ← This is what was missing!
- ✅ payments
- ✅ properties
- ✅ property_images
- ✅ townships
- ✅ viewing_requests

### Step 4: Insert Test Data (Optional but Recommended)
If you want to test with sample properties:

1. Click **New Query**
2. Copy the entire content from `scripts/insert-test-properties.sql`
3. Paste into SQL Editor
4. Click **Run**

This creates 20 test properties for you to browse and test with.

### Step 5: Restart Your Dev Server
```bash
# In PowerShell/Terminal:
npm run dev
```

The app should now work without database errors!

---

## 🔍 Verify It Worked

After restarting, try these in your app:
1. Go to `/browse` → Should see properties without error
2. Click a property → Should see details page
3. Any "Notification" should appear in console without errors

---

## 📋 Troubleshooting

### "Error: Could not find the table"
→ You haven't run the `complete-database-setup.sql` script yet. Do Step 2 above.

### "Duplicate key value violates unique constraint"
→ Normal. Some tables might already exist. Click "Continue anyway".

### Still getting errors after setup?
→ Check your `.env.local` has correct Supabase keys
→ Make sure you ran the SQL in the correct database
→ Try clearing `.next` folder: `Remove-Item -Recurse -Force .next`

---

## ✅ Once Complete
After database setup, all fetches should work and the notifications error will disappear!
