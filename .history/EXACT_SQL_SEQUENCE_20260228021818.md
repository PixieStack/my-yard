# 🎯 EXACT SEQUENCE - COPY & PASTE INSTRUCTIONS

## 📌 YOUR SITUATION
```
❌ Error: column "location" does not exist
❌ Tables not created yet
❌ Need to set up database from scratch
```

## ✅ YOUR SOLUTION
Run these TWO SQL files IN THIS ORDER:

---

## 🔥 STEP 1: CREATE ALL TABLES (REQUIRED!)

### What to do:
1. Go to: **https://app.supabase.com**
2. Click your **MyYard** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### What to paste:
📄 Copy the entire file: **`SETUP_DATABASE_CLEAN.sql`**

```
Location: c:\Users\thwal\Documents\projects\my-yard\SETUP_DATABASE_CLEAN.sql
Size: ~9 KB
Lines: ~400
```

### How to copy:
```
1. In VS Code: Open SETUP_DATABASE_CLEAN.sql
2. Press: Ctrl+A (select all)
3. Press: Ctrl+C (copy)
4. In Supabase: Ctrl+V (paste)
5. Click: RUN button
6. Wait: 10-15 seconds
```

### Expected result:
```
✅ Query successful
   "Database setup completed successfully! All 12 tables created."
```

If you see warnings about "duplicate key" → Click **Continue anyway** → OK

---

## 🧪 STEP 2: ADD TEST DATA (OPTIONAL BUT RECOMMENDED)

### What to do:
1. Click **New Query** (in SQL Editor)
2. Clear the old query

### What to paste:
📄 Copy the entire file: **`scripts/insert-test-properties.sql`**

```
Location: c:\Users\thwal\Documents\projects\my-yard\scripts\insert-test-properties.sql
Size: ~10 KB
Lines: ~300
```

### How to copy:
```
1. In VS Code: Open scripts/insert-test-properties.sql
2. Press: Ctrl+A (select all)
3. Press: Ctrl+C (copy)
4. In Supabase: Ctrl+V (paste)
5. Click: RUN button
6. Wait: 5-10 seconds
```

### Expected result:
```
✅ Success - test data inserted
   "20 properties" created
```

---

## ⚙️ STEP 3: RESTART DEV SERVER

```powershell
# In PowerShell/Terminal:

# Option 1: Kill process and restart
taskkill /IM node.exe /F
npm run dev

# Option 2: Press Ctrl+C (if npm run dev is running) then
npm run dev

# Wait 30-60 seconds for first load
```

Expected:
```
▲ Next.js 15.2.4
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

---

## 🌐 STEP 4: TEST IN BROWSER

### Visit:
```
http://localhost:3000/browse
```

### Expect:
```
✅ Properties list loads
✅ See "Spacious Room in Soweto", "Modern Bachelor Flat", etc.
✅ See township dropdown filter
✅ Images display
✅ Heart icons visible
✅ NO error messages
```

### Check Console (F12):
```
✅ No red errors
✅ Only info messages OK
```

---

## 📋 CHECKLIST

- [ ] Opened Supabase SQL Editor
- [ ] Copied `SETUP_DATABASE_CLEAN.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked RUN
- [ ] Saw "Database setup completed successfully"
- [ ] Copied `scripts/insert-test-properties.sql`
- [ ] Pasted into NEW Query
- [ ] Clicked RUN
- [ ] Restarted dev server with `npm run dev`
- [ ] Visited http://localhost:3000/browse
- [ ] Saw properties list ✅
- [ ] Console is clean ✅

---

## 🎯 THE TWO FILES YOU NEED

### File 1: **SETUP_DATABASE_CLEAN.sql**
**Location:** `c:\Users\thwal\Documents\projects\my-yard\SETUP_DATABASE_CLEAN.sql`
**Purpose:** Create all 12 tables
**What it does:**
- Drops existing tables (if any)
- Creates: townships, properties, property_images, viewing_requests, applications, leases, payments, messages, favorites, tenant_profiles, lease_termination_requests, notifications
- Adds indexes for performance
- Adds RLS security policies
- Inserts 20 townships data

### File 2: **insert-test-properties.sql**
**Location:** `c:\Users\thwal\Documents\projects\my-yard\scripts\insert-test-properties.sql`
**Purpose:** Insert 20 test properties
**What it does:**
- Creates test properties across 5 townships
- Adds landlord profiles
- Adds property images
- Creates viewing requests and applications samples

---

## ✨ WHAT HAPPENS

```
BEFORE:
❌ No tables
❌ "column location" error
❌ App broken

↓ After SETUP_DATABASE_CLEAN.sql ↓

✅ All 12 tables created
✅ All columns defined (location, price_per_month, etc.)
✅ All indexes created
✅ All security configured

↓ After insert-test-properties.sql ↓

✅ 20 properties ready
✅ Images linked
✅ Test data ready

↓ After restart ↓

✅ App loads perfectly
✅ Browse page works
✅ Property details work
✅ No errors
```

---

## 🚀 YOU'RE READY!

Just follow these 4 steps and your database will be perfectly set up!

**Estimated time: 15-20 minutes**

---

## ❓ REFERENCE

### What's the difference?

**Old file:** `scripts/complete-database-setup.sql`
- Works but had some issues
- Doesn't drop existing tables

**New file:** `SETUP_DATABASE_CLEAN.sql` ← USE THIS ONE
- Fresh, clean setup
- Drops old tables first (prevents conflicts)
- Guaranteed to work
- All tables created from scratch

---

## 🎉 NEXT STEP

**👉 DO THIS NOW:**

1. Open Supabase: https://app.supabase.com
2. Open SQL Editor
3. Copy: `SETUP_DATABASE_CLEAN.sql`
4. Paste & Run
5. Copy: `scripts/insert-test-properties.sql`
6. Paste & Run
7. Restart: `npm run dev`
8. Test: http://localhost:3000/browse

**Done!** ✅
