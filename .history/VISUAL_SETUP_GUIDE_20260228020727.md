# 🖼️ VISUAL GUIDE - EXACTLY WHAT TO DO

## Screenshot Reference - SQL Editor in Supabase

```
┌─────────────────────────────────────────────────────────────┐
│ Supabase                                                      │
│                                                               │
│  Project: MyYard    [SQL Editor]  [Query] [RUN]             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ -- Complete MyYard Database Setup                      │ │
│  │ -- This script ensures all necessary tables...         │ │
│  │                                                        │ │
│  │ ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role... │ │
│  │ CREATE TABLE IF NOT EXISTS townships (              │ │
│  │   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,    │ │
│  │   name TEXT NOT NULL UNIQUE,                         │ │
│  │   ...                                                │ │
│  │   [LOTS MORE SQL]                                   │ │
│  │ CREATE INDEX IF NOT EXISTS idx_notifications...     │ │
│  │                                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│                        [Click RUN →]                         │
│                                                               │
│  After 5-10 seconds:                                         │
│  ✅ "Query successful"                                      │
│  ⚠️  (Warnings about duplicates are OK)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Navigation

### 🔐 Step 1: Login to Supabase
```
https://app.supabase.com → Sign in → Select "MyYard" project
```

### 🗂️ Step 2: Open SQL Editor
```
Left Sidebar:
  ├─ Home
  ├─ SQL Editor  ← CLICK HERE
  ├─ Database
  ├─ Storage
  └─ ...
  
Then: Click "New Query" button (top right)
```

### 📋 Step 3: Copy-Paste SQL

**In VS Code:**
```
1. Open: scripts/complete-database-setup.sql
2. Press: Ctrl+A (select all text, ~400 lines)
3. Press: Ctrl+C (copy)
```

**In Supabase SQL Editor:**
```
1. Click in the text area
2. Press: Ctrl+V (paste ~400 lines of SQL)
3. You should see the entire script pasted in
```

### ▶️ Step 4: Execute SQL

**Option A: Click Button**
```
Look for: [RUN] button (top right of editor)
Click it
```

**Option B: Keyboard**
```
Press: Ctrl+Enter
```

### ⏳ Step 5: Wait for Result

```
✅ SUCCESS:
   "Query successful"
   (Takes 5-10 seconds)

⚠️  WARNING (OK to ignore):
   "Duplicate key value violates unique constraint"
   "on conflict (name) do nothing"
   This is normal - just means data already exists
   Click: "Continue anyway"

❌ ERROR (Report it):
   Any other error → Copy exact message → Tell me
```

### 🔄 Step 6: Verify Tables Created

**Run Verification Query:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Click "New Query" → Paste above → Click RUN**

**You should see (13 tables):**
```
✅ applications
✅ favorites
✅ lease_termination_requests    ← NEW!
✅ leases
✅ messages
✅ notifications                  ← THIS IS THE FIX!
✅ payments
✅ properties
✅ property_images
✅ tenant_profiles                ← NEW!
✅ townships
✅ viewing_requests
```

If you see all 13: **✅ DATABASE SETUP SUCCESSFUL!**

---

## 💻 Step 7: Restart Dev Server

**In Your Terminal/PowerShell:**

```powershell
# Option 1: Kill and restart
taskkill /IM node.exe /F 2>$null
npm run dev

# Option 2: Press Ctrl+C (stops current) then
npm run dev

# Either way: Wait 30-60 seconds for first load
```

**What you'll see:**
```
> my-yard@1.0.0 dev
> next dev

  ▲ Next.js 15.2.4
  - Local:        http://localhost:3000
  - Environments: .env.local
  
  ✓ Ready in 2.5s
```

---

## 🌐 Step 8: Test in Browser

### Test 1️⃣: Visit Browse Page
```
Go to: http://localhost:3000/browse
Expect: List of properties loads
        No console errors
        See "Township" dropdown filter
```

### Test 2️⃣: Click a Property
```
Click: Any property card
Expect: Property details page loads
        Images show
        Landlord info visible
        No "notifications table" error
```

### Test 3️⃣: Open Console
```
Press: F12 (opens DevTools)
Click: "Console" tab
Expect: Clean, no red errors ✅
        Only blue "info" messages OK
```

---

## 🎯 Success Indicators

| Check | ✅ Success | ❌ Failed |
|-------|----------|---------|
| SQL runs | Query successful | Error message |
| Tables exist | All 13 visible | Missing tables |
| App loads | No black screen | Black/loading forever |
| Browse works | Properties list | 404 or error |
| Console clean | No red errors | Red "notifications" error |
| Details load | Images & info show | 404 or blank page |

---

## 📸 Key Moments

### When Pasting SQL
```
Should see hundreds of lines of SQL code,
starting with:
  -- Complete MyYard Database Setup
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role...
  CREATE TABLE IF NOT EXISTS townships...
  
And ending with:
  CREATE POLICY "Landlords can update termination requests"...
```

### When Clicking RUN
```
You'll see at bottom:
  "Executing query..."
  (spinning indicator)
  
Then (after 5-10 sec):
  ✅ "Query successful"
  OR ⚠️ "with warnings" (OK - click Continue)
  OR ❌ "Error" (report to me)
```

### When Restarting Dev
```
Terminal will show:
  ▲ Next.js 15.2.4
  - Local:  http://localhost:3000
  ✓ Ready in XX seconds
  
Then browser loads app normally
```

### When App Works
```
http://localhost:3000/browse shows:
  - Search box
  - Township filter dropdown
  - List of property cards
  - Pagination
  - Heart icons (favorites)
  
NO ERROR MESSAGES!
```

---

## ⏰ Timeline

```
Start: You reading this
  ↓
0-1 min: Navigate to Supabase
  ↓
1-2 min: Open SQL Editor, paste code
  ↓
2-7 min: Wait for SQL to execute
  ↓
7-8 min: Verify tables (run verification query)
  ↓
8-9 min: Restart dev server
  ↓
9-10 min: Test in browser
  ↓
END: Database fixed! ✅
```

**Total time: ~10 minutes** ⏱️

---

## 🚀 Ready?

**Go to: https://app.supabase.com and start!**

Questions? Read:
- `COMPLETE_DATABASE_FIX.md` - Detailed troubleshooting
- `ALL_FETCHES_CHECKLIST.md` - Which tables do what
- `DATABASE_SETUP_STEPS.md` - Alternative guide

**Let's fix this! 💪**
