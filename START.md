# 🎯 SIMPLE SETUP - Since You Created Tables

Since you already created the database tables manually, let's just focus on running the app!

## Step 1: Verify .env.local

Your .env.local should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Install and Run

```powershell
cd app

npm install

npm run dev
```

## Step 3: Open in INCOGNITO

1. Open Chrome/Edge
2. Press `Ctrl + Shift + N` (Incognito)
3. Go to: `http://localhost:3000`
4. Test registration

---

## If Auth Still Fails:

The database tables might be missing the trigger function. Run this in Supabase SQL Editor:

```sql
-- Function to create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'firstName', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'lastName', 'Name'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create role-specific profile
    IF (NEW.raw_user_meta_data->>'role') = 'landlord' THEN
        INSERT INTO public.landlord_profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.tenant_profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

**Since tables exist, just install dependencies and run! Skip the database push.** ✅
