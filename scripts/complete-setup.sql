-- MyYard Complete Database Setup with Enhanced Location System
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if they exist (for clean setup)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;
DROP TYPE IF EXISTS viewing_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
CREATE TYPE property_type AS ENUM ('room', 'bachelor', 'cottage', 'flat', 'house', 'backroom');
CREATE TYPE property_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE application_status AS ENUM ('pending', 'viewing_requested', 'viewing_scheduled', 'viewing_declined', 'approved', 'rejected');
CREATE TYPE location_type AS ENUM ('township', 'suburb', 'cbd');
CREATE TYPE viewing_status AS ENUM ('requested', 'scheduled', 'confirmed', 'completed', 'cancelled');

-- 1. Base profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tenant profiles
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
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

-- 3. Landlord profiles
CREATE TABLE IF NOT EXISTS public.landlord_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
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

-- 4. Enhanced Townships/Locations table
CREATE TABLE IF NOT EXISTS public.townships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    type location_type NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, city, province)
);

-- 5. Properties table with township reference
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    township_id UUID REFERENCES public.townships(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    rent_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    utilities_included BOOLEAN DEFAULT FALSE,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    square_meters INTEGER,
    furnished BOOLEAN DEFAULT FALSE,
    pets_allowed BOOLEAN DEFAULT FALSE,
    parking_available BOOLEAN DEFAULT FALSE,
    security_features TEXT[],
    amenities TEXT[],
    status property_status DEFAULT 'available',
    available_from DATE,
    minimum_lease_months INTEGER DEFAULT 12,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Property images
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status application_status DEFAULT 'pending',
    cover_letter TEXT,
    preferred_move_in_date DATE,
    lease_duration_months INTEGER DEFAULT 12,
    landlord_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, tenant_id)
);

-- 8. Viewing requests
CREATE TABLE IF NOT EXISTS public.viewing_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    status viewing_status DEFAULT 'requested',
    landlord_message TEXT,
    tenant_message TEXT,
    confirmed_date DATE,
    confirmed_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Leases table
CREATE TABLE IF NOT EXISTS public.leases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    utilities_included BOOLEAN DEFAULT FALSE,
    lease_terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method TEXT,
    transaction_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- 13. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    landlord_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_township ON public.properties(township_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON public.applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_property ON public.applications(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord ON public.leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_townships_city ON public.townships(city, province);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tenant_profiles
CREATE POLICY "Users can view their own tenant profile" ON public.tenant_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own tenant profile" ON public.tenant_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own tenant profile" ON public.tenant_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for landlord_profiles
CREATE POLICY "Users can view their own landlord profile" ON public.landlord_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own landlord profile" ON public.landlord_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own landlord profile" ON public.landlord_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for properties (public read, landlord write)
CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT USING (is_active = true);
CREATE POLICY "Landlords can insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = landlord_id);

-- RLS Policies for property_images
CREATE POLICY "Anyone can view property images" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Landlords can manage images for their properties" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_images.property_id AND properties.landlord_id = auth.uid())
);

-- RLS Policies for applications
CREATE POLICY "Tenants can view their own applications" ON public.applications FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view applications for their properties" ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = applications.property_id AND properties.landlord_id = auth.uid())
);
CREATE POLICY "Tenants can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Tenants can update their own applications" ON public.applications FOR UPDATE USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can update applications for their properties" ON public.applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = applications.property_id AND properties.landlord_id = auth.uid())
);

-- RLS Policies for viewing_requests
CREATE POLICY "Tenants can view their own viewing requests" ON public.viewing_requests FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view viewing requests for their properties" ON public.viewing_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = viewing_requests.property_id AND properties.landlord_id = auth.uid())
);
CREATE POLICY "Tenants can create viewing requests" ON public.viewing_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Anyone involved can update viewing requests" ON public.viewing_requests FOR UPDATE USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = viewing_requests.property_id AND properties.landlord_id = auth.uid())
);

-- RLS Policies for leases
CREATE POLICY "Tenants can view their own leases" ON public.leases FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view their own leases" ON public.leases FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can create leases" ON public.leases FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update their own leases" ON public.leases FOR UPDATE USING (auth.uid() = landlord_id);

-- RLS Policies for payments
CREATE POLICY "Tenants can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can view payments for their properties" ON public.payments FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Anyone involved can update payments" ON public.payments FOR UPDATE USING (
    auth.uid() = tenant_id OR auth.uid() = landlord_id
);

-- RLS Policies for messages
CREATE POLICY "Users can view their sent messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can view their received messages" ON public.messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Make townships table publicly readable
ALTER TABLE public.townships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view townships" ON public.townships FOR SELECT USING (true);

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
    );
    
    -- Create role-specific profile
    IF (NEW.raw_user_meta_data->>'role') = 'landlord' THEN
        INSERT INTO public.landlord_profiles (id) VALUES (NEW.id);
    ELSE
        INSERT INTO public.tenant_profiles (id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
