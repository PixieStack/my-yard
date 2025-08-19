-- Fix missing profiles for existing users
-- This script will create profiles for users who don't have them

-- First, let's create profiles for any existing users who don't have them
INSERT INTO public.profiles (id, first_name, last_name, email, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'tenant')::user_role as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email_confirmed_at IS NOT NULL;

-- Create tenant profiles for users with tenant role who don't have them
INSERT INTO public.tenant_profiles (id)
SELECT au.id
FROM auth.users au
LEFT JOIN public.tenant_profiles tp ON au.id = tp.id
WHERE tp.id IS NULL
AND au.email_confirmed_at IS NOT NULL
AND COALESCE(au.raw_user_meta_data->>'role', 'tenant') = 'tenant';

-- Create landlord profiles for users with landlord role who don't have them
INSERT INTO public.landlord_profiles (id)
SELECT au.id
FROM auth.users au
LEFT JOIN public.landlord_profiles lp ON au.id = lp.id
WHERE lp.id IS NULL
AND au.email_confirmed_at IS NOT NULL
AND COALESCE(au.raw_user_meta_data->>'role', 'tenant') = 'landlord';

-- Verify the trigger exists and recreate if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Insert into base profiles table
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role
    );
    
    -- Get the role for conditional profile creation
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role;
    
    -- Create role-specific profile
    IF user_role_val = 'tenant' THEN
        INSERT INTO public.tenant_profiles (id) VALUES (NEW.id);
    ELSIF user_role_val = 'landlord' THEN
        INSERT INTO public.landlord_profiles (id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
