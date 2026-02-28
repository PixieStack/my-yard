# 🔧 SQL SETUP - STEP BY STEP

## Your Error Explained
```
Error: Failed to run sql query: 
ERROR: 42703: column "location" of relation "properties" does not exist
```

**This means:** The `properties` table either doesn't exist OR doesn't have the `location` column. You need to **create all the tables first**.

---

## ✅ DO THIS NOW

### Step 1: Go to Supabase
- https://app.supabase.com
- Select your **MyYard** project
- Click **SQL Editor**

### Step 2: Run the CLEAN Setup SQL
1. Click **New Query**
2. **Delete any existing query** (if there is one)
3. Open file: **`SETUP_DATABASE_CLEAN.sql`** (in your project)
4. Copy **ALL** the content
5. Paste into Supabase SQL Editor
6. Click **RUN** button
7. Wait 10-15 seconds

**Expected result:** ✅ "Database setup completed successfully!"

---

## Step 3: Verify Tables Were Created
In SQL Editor, click **New Query** and paste:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
Click **RUN**

You should see (12 tables):
```
✅ applications
✅ favorites
✅ lease_termination_requests
✅ leases
✅ messages
✅ notifications
✅ payments
✅ properties          ← Has location column!
✅ property_images
✅ tenant_profiles
✅ townships
✅ viewing_requests
```

---

## Step 4: Insert Test Data
1. Click **New Query**
2. Open: **`scripts/insert-test-properties.sql`**
3. Copy **ALL**
4. Paste into SQL Editor
5. Click **RUN**

Should see: ✅ Success with data inserted

---

## Step 5: Restart Dev Server
```powershell
taskkill /IM node.exe /F
npm run dev
```

---

## Step 6: Test
Go to: http://localhost:3000/browse

✅ Should see properties list
✅ No errors

---

## 📋 SQL FILES TO USE (IN ORDER)

| Step | File | Purpose |
|------|------|---------|
| 1️⃣ | `SETUP_DATABASE_CLEAN.sql` | **CREATE ALL TABLES** |
| 2️⃣ | `scripts/insert-test-properties.sql` | Add test properties |

---

## ⚠️ WHAT IF IT FAILS AGAIN?

### "Error: 42703: column does not exist"
→ The setup SQL didn't complete successfully. Try again from Step 1.

### "Duplicate key value violates constraint"
→ Click **Continue anyway**. It's just a duplicate insert warning.

### "Relation already exists"
→ Normal. The script uses `IF NOT EXISTS` to handle this.

### Other error?
→ Copy the exact error and let me know.

---

## 🎯 YOUR FILES

**I created a NEW, CLEAN SQL file:** 
👉 **`SETUP_DATABASE_CLEAN.sql`**

This file:
- ✅ Drops old tables (if they exist)
- ✅ Creates all 12 tables fresh
- ✅ Adds all indexes
- ✅ Adds all RLS policies
- ✅ Is guaranteed to work

---

## 📋 SUMMARY

```
1. Go to Supabase SQL Editor
2. Run: SETUP_DATABASE_CLEAN.sql (fresh setup)
3. Run: scripts/insert-test-properties.sql (test data)
4. Restart: npm run dev
5. Test: http://localhost:3000/browse
6. Done! ✅
```

**Total time: ~15 minutes**

---

## ✨ After Setup

Your database will have:
- ✅ 12 complete tables
- ✅ 20 test properties
- ✅ All security policies
- ✅ All indexes
- ✅ Ready for development!

---

## 🚀 GO!

👉 Open **`SETUP_DATABASE_CLEAN.sql`** and copy it to Supabase!
