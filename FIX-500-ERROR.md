# 🔧 FIX 500 ERROR - CRITICAL

## The 500 error means the database trigger is broken!

### Step 1: Run This SQL in Supabase

1. Go to: https://supabase.com/dashboard/project/pbyhhzygikyucqogitwj/sql/new

2. Copy ALL content from: `/app/scripts/fix-auth-trigger.sql`

3. Paste and click **RUN**

This will:
- ✅ Fix the trigger function
- ✅ Add error handling
- ✅ Grant proper permissions

---

### Step 2: Test Registration

**Use These Credentials:**
- First Name: `Eden`
- Last Name: `Thwala`
- Email: `edenthwala@gmail.com`
- Password: `Tt@19990423`
- Role: `Tenant`

---

### Step 3: Check if it Worked

After clicking Register, check these:

**A. Check Supabase Auth Users**
- Go to: https://supabase.com/dashboard/project/pbyhhzygikyucqogitwj/auth/users
- You should see your email

**B. Check Profiles Table**
```sql
SELECT * FROM public.profiles WHERE email = 'edenthwala@gmail.com';
```

**C. Check Tenant Profiles Table**
```sql
SELECT * FROM public.tenant_profiles 
WHERE id IN (SELECT id FROM public.profiles WHERE email = 'edenthwala@gmail.com');
```

---

### If Still Getting 500:

**Check the error logs:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tenant_profiles', 'landlord_profiles');

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

---

**Run the fix-auth-trigger.sql file first, then try registration again!** 🔧
