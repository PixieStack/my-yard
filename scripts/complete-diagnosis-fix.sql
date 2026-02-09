-- COMPLETE FIX: Run this entire script in Supabase SQL Editor
-- This will diagnose and fix ALL issues

-- ============================================
-- STEP 1: Check what exists
-- ============================================

-- Check if tables exist
SELECT 'Checking tables...' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tenant_profiles', 'landlord_profiles')
ORDER BY table_name;

-- Check if enum exists
SELECT 'Checking enums...' as status;
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'user_role';

-- Check if trigger exists
SELECT 'Checking triggers...' as status;
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- STEP 2: Create enum if missing
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
        RAISE NOTICE 'Created user_role enum';
    ELSE
        RAISE NOTICE 'user_role enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Create or fix profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL DEFAULT 'User',
    last_name TEXT NOT NULL DEFAULT 'Name',
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'tenant',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create tenant_profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    employment_status TEXT,
    employer_name TEXT,
    job_title TEXT,
    monthly_income DECIMAL(10,2),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    has_pets BOOLEAN DEFAULT FALSE,
    pet_details TEXT,
    preferred_move_in_date DATE,
    max_budget DECIMAL(10,2),
    preferred_areas TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create landlord_profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS public.landlord_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    years_experience INTEGER DEFAULT 0,
    total_properties INTEGER DEFAULT 0,
    active_properties INTEGER DEFAULT 0,
    occupied_properties INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_time_hours INTEGER DEFAULT 24,
    accepts_pets BOOLEAN DEFAULT FALSE,
    minimum_lease_months INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 6: Enable RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: Create RLS Policies
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own tenant profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Users can update their own tenant profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Users can insert their own tenant profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Users can view their own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Users can update their own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Users can insert their own landlord profile" ON public.landlord_profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tenant profiles policies
CREATE POLICY "Users can view their own tenant profile" ON public.tenant_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own tenant profile" ON public.tenant_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own tenant profile" ON public.tenant_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Landlord profiles policies
CREATE POLICY "Users can view their own landlord profile" ON public.landlord_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own landlord profile" ON public.landlord_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own landlord profile" ON public.landlord_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.tenant_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.landlord_profiles TO anon, authenticated, service_role;

-- ============================================
-- STEP 9: Create the trigger function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_val text;
BEGIN
    -- Log the start
    RAISE LOG 'Trigger fired for user: %', NEW.id;
    
    -- Get role from metadata, default to tenant
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
    
    -- Insert into profiles with explicit column names
    BEGIN
        INSERT INTO public.profiles (
            id,
            first_name,
            last_name,
            email,
            role,
            email_verified,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'firstName', 'User'),
            COALESCE(NEW.raw_user_meta_data->>'lastName', 'Name'),
            NEW.email,
            user_role_val::user_role,
            false,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully inserted into profiles';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE LOG 'Profile already exists for user %', NEW.id;
            RETURN NEW;
        WHEN OTHERS THEN
            RAISE LOG 'Error inserting into profiles: %', SQLERRM;
            RAISE;
    END;
    
    -- Insert into role-specific table
    BEGIN
        IF user_role_val = 'landlord' THEN
            INSERT INTO public.landlord_profiles (id, created_at, updated_at)
            VALUES (NEW.id, NOW(), NOW());
            RAISE LOG 'Successfully inserted into landlord_profiles';
        ELSE
            INSERT INTO public.tenant_profiles (id, created_at, updated_at)
            VALUES (NEW.id, NOW(), NOW());
            RAISE LOG 'Successfully inserted into tenant_profiles';
        END IF;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE LOG 'Role-specific profile already exists for user %', NEW.id;
            RETURN NEW;
        WHEN OTHERS THEN
            RAISE LOG 'Error inserting into role-specific table: %', SQLERRM;
            RAISE;
    END;
    
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 10: Create the trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 11: Verification
-- ============================================

SELECT 'Setup complete! Verifying...' as status;

SELECT 
    'Tables' as check_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tenant_profiles', 'landlord_profiles');

SELECT 
    'Trigger' as check_type,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

SELECT 
    'Function' as check_type,
    COUNT(*) as count
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT '✅ All done! Try registration now.' as final_status;
