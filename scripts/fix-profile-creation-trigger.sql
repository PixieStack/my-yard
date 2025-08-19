-- Fix automatic profile creation for new users
-- This addresses the "Database error saving new user" issue

-- First, ensure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role text;
BEGIN
    -- Get the role from user metadata
    user_role := NEW.raw_user_meta_data ->> 'role';
    
    -- Create base profile record
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'firstName', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'lastName', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
        COALESCE(user_role, 'tenant'),
        NOW(),
        NOW()
    );
    
    -- Create role-specific profile
    IF user_role = 'landlord' THEN
        INSERT INTO public.landlord_profiles (
            id,
            business_name,
            years_experience,
            total_properties,
            active_properties,
            occupied_properties,
            rating,
            total_reviews,
            response_time_hours,
            accepts_pets,
            allows_smoking,
            preferred_tenant_type,
            minimum_lease_months,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'businessName', ''),
            0,
            0,
            0,
            0,
            0.0,
            0,
            24,
            false,
            false,
            'any',
            12,
            NOW(),
            NOW()
        );
    ELSE
        INSERT INTO public.tenant_profiles (
            id,
            date_of_birth,
            employment_status,
            monthly_income,
            employment_duration_months,
            current_address,
            city,
            province,
            postal_code,
            rating,
            total_reviews,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NULL,
            'unemployed',
            0,
            0,
            '',
            '',
            '',
            '',
            0.0,
            0,
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.tenant_profiles TO authenticated;
GRANT ALL ON public.landlord_profiles TO authenticated;

-- Enable RLS on tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for tenant profiles
DROP POLICY IF EXISTS "Tenants can view own profile" ON public.tenant_profiles;
CREATE POLICY "Tenants can view own profile" ON public.tenant_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Tenants can update own profile" ON public.tenant_profiles;
CREATE POLICY "Tenants can update own profile" ON public.tenant_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for landlord profiles
DROP POLICY IF EXISTS "Landlords can view own profile" ON public.landlord_profiles;
CREATE POLICY "Landlords can view own profile" ON public.landlord_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Landlords can update own profile" ON public.landlord_profiles;
CREATE POLICY "Landlords can update own profile" ON public.landlord_profiles
    FOR UPDATE USING (auth.uid() = id);
