-- Fix profile creation trigger without recreating existing policies
-- This script safely creates or replaces the trigger function

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role from user metadata, default to 'tenant'
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'tenant');
    
    -- Create base profile
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        role,
        is_active,
        is_verified,
        email_verified,
        phone_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        NEW.email,
        user_role,
        true,
        false,
        NEW.email_confirmed_at IS NOT NULL,
        false,
        NOW(),
        NOW()
    );
    
    -- Create role-specific profile
    IF user_role = 'tenant' THEN
        INSERT INTO public.tenant_profiles (
            id,
            employment_status,
            monthly_income,
            employment_duration_months,
            has_pets,
            number_of_pets,
            smoking_status,
            preferred_move_in_date,
            max_budget,
            preferred_property_type,
            preferred_bedrooms,
            preferred_bathrooms,
            preferred_location_type,
            transportation_access,
            rating,
            total_reviews,
            applications_submitted,
            applications_approved,
            current_lease_status,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            'not_specified',
            0,
            0,
            false,
            0,
            'non_smoker',
            CURRENT_DATE + INTERVAL '30 days',
            5000,
            'apartment',
            1,
            1,
            'township',
            'public_transport',
            0.0,
            0,
            0,
            0,
            'looking',
            NOW(),
            NOW()
        );
    ELSIF user_role = 'landlord' THEN
        INSERT INTO public.landlord_profiles (
            id,
            business_name,
            business_registration_number,
            tax_number,
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
            COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Property Business'),
            '',
            '',
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
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.tenant_profiles TO authenticated;
GRANT ALL ON public.landlord_profiles TO authenticated;
