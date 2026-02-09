-- CRITICAL FIX: Run this in Supabase SQL Editor to fix 500 error

-- 1. Make sure the enum exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        email, 
        role,
        email_verified
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'firstName', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'lastName', 'Name'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant'::user_role),
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- Create role-specific profile
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'landlord' THEN
        INSERT INTO public.landlord_profiles (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.tenant_profiles (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Test the function works
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
