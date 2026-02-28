# ⚡ ADD ONLY MISSING TABLES

## Your Situation
✅ You already have most tables created
❌ Missing: `lease_termination_requests` and `notifications`

## Solution (2 minutes)

### Step 1: Go to Supabase SQL Editor
- https://app.supabase.com
- Select: MyYard project
- Click: SQL Editor
- Click: New Query

### Step 2: Add Missing Tables Only
1. Open file: **`ADD_MISSING_TABLES.sql`** (just created!)
2. Copy ALL content
3. Paste into Supabase SQL Editor
4. Click: RUN
5. Wait: 2-5 seconds

**Expected:** ✅ "Minimal update completed!"

---

## What Gets Added

**Table 1: `lease_termination_requests`**
- Used by: Settings page, lease termination feature
- Columns: id, lease_id, tenant_id, requested_termination_date, reason, status, etc.
- RLS: Tenants can create, both parties can read/update

**Table 2: `notifications`**
- Used by: 20+ places in the app (viewing confirmed, payment received, etc.)
- Columns: id, user_id, type, title, message, action_url, is_read
- RLS: Users can read/update their own, system can create

---

## That's It!

No other changes needed. Your existing tables and data stay untouched.

**Time: 2 minutes**
