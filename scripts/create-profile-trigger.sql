-- Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    is_verified,
    email_verified,
    phone_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role,
    true,
    false,
    NEW.email_confirmed_at IS NOT NULL,
    false,
    NOW(),
    NOW()
  );

  -- Insert into role-specific table based on user role
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'tenant' THEN
    INSERT INTO public.tenant_profiles (
      id,
      date_of_birth,
      employment_status,
      monthly_income,
      has_pets,
      smoking,
      rating,
      total_reviews,
      applications_count,
      successful_rentals,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NULL,
      'unemployed',
      0,
      false,
      false,
      0,
      0,
      0,
      0,
      NOW(),
      NOW()
    );
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'landlord' THEN
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
      minimum_lease_months,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      '',
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      false,
      false,
      12,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for tenant_profiles
CREATE POLICY "Users can view own tenant profile" ON public.tenant_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own tenant profile" ON public.tenant_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for landlord_profiles
CREATE POLICY "Users can view own landlord profile" ON public.landlord_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own landlord profile" ON public.landlord_profiles
  FOR UPDATE USING (auth.uid() = id);
